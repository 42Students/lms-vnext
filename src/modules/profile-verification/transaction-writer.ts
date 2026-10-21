import {verificationDecisionNotice} from "@/modules/verification/notification-copy";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents, collegeMemberships, colleges, inAppNotifications, learnerProfiles, membershipRoles, systemRoles, users } from "@/db/schema";
import { profilePrivateDocumentReceipts, profileVerificationEvents, profileVerifications, profileVerificationSettings, profileVerificationTpoGrants } from "@/db/schema/profile-verification";
import {
  VerificationStateError,
  type Transition,
  type VerificationRecord,
  type VerificationSection,
} from "./domain";
import type { VerificationTransactionRepository } from "./service";
import { publishVerifiedEducation } from "./academic-publication";

type LockedTransition = VerificationTransactionRepository["withLockedTransition"];

/**
 * DB04 PostgreSQL transaction writer; not reachable through a public endpoint.
 *
 * pg_advisory_xact_lock is used in addition to SELECT FOR UPDATE so two first
 * submissions (where neither has a row yet) also serialize on one natural key.
 * This is advisory within the transaction and releases on rollback/commit.
 *
 * Education approval publishes original grades and comparable placement
 * evidence in the same transaction; failure rolls back the entire review.
 */
export const postgresLockedVerificationTransition: LockedTransition =
  async (membershipId: string, section: VerificationSection,
         plan: (current: VerificationRecord | null) => Promise<Transition>) => {
    return getDb().transaction(async (tx) => {
      // A stable text key is hashed by PostgreSQL into a transaction-scoped lock.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${"DB04:" + membershipId + ":" + section}, 0))`);
      const [target] = await tx.select({collegeId:collegeMemberships.collegeId})
        .from(collegeMemberships).where(eq(collegeMemberships.id,membershipId)).limit(1);
      if (!target) throw new VerificationStateError("NOT_ALLOWED");
      // Block concurrent admin setting, grant and CGPA policy changes for
      // the duration of review planning + writing. Mutators lock this row.
      // Use UPDATE immediately: upgrading SHARE to UPDATE later can deadlock
      // two concurrent Education approvals. This is conservative and serializes
      // reviews per college until finer-grained settings versioning exists.
      const [college] = await tx.select({id:colleges.id,organizationId:colleges.organizationId}).from(colleges)
        .where(eq(colleges.id,target.collegeId)).for("update");
      const [member] = await tx.select({
        id: collegeMemberships.id,
        status: collegeMemberships.status,
        collegeId: collegeMemberships.collegeId,
        userId: collegeMemberships.userId,
      }).from(collegeMemberships).where(eq(collegeMemberships.id, membershipId)).for("update");
      if (!member || member.status !== "ACTIVE") {
        throw new VerificationStateError("NOT_ALLOWED");
      }
      // Recheck the target's learner role and platform status INSIDE the same
      // transaction, after the membership lock. Hold shared locks so a role
      // removal or account suspension cannot pass between review and commit.
      const [learnerRole] = await tx.select({role:membershipRoles.role})
        .from(membershipRoles)
        .where(and(eq(membershipRoles.membershipId,membershipId),
          eq(membershipRoles.role,"LEARNER"))).for("share");
      const [platformUser] = await tx.select({status:users.platformStatus})
        .from(users).where(eq(users.id,member.userId)).for("share");
      if (!learnerRole || platformUser?.status !== "ACTIVE") {
        throw new VerificationStateError("NOT_ALLOWED");
      }
      // Hold a stable snapshot of the editable profile and evidence receipts.
      // Their updates/revocations must wait until this verification commits.
      await tx.select({membershipId:learnerProfiles.membershipId})
        .from(learnerProfiles).where(eq(learnerProfiles.membershipId,membershipId))
        .for("share");
      await tx.select({id:profilePrivateDocumentReceipts.id})
        .from(profilePrivateDocumentReceipts)
        .where(eq(profilePrivateDocumentReceipts.owningMembershipId,membershipId))
        .for("share");
      const [stored] = await tx.select().from(profileVerifications).where(and(
        eq(profileVerifications.learnerMembershipId, membershipId),
        eq(profileVerifications.section, section),
      )).for("update");
      const current: VerificationRecord | null = stored ? {
        learnerMembershipId: stored.learnerMembershipId,
        section: stored.section as VerificationSection,
        status: stored.status as VerificationRecord["status"],
        submittedSnapshot: stored.submittedSnapshot,
        verifiedSnapshot: stored.verifiedSnapshot,
        submittedAt: stored.submittedAt,
        verifiedAt: stored.verifiedAt,
        decidedAt: stored.decidedAt,
        decidedByUserId: stored.decidedByUserId,
        decidedByName: stored.decidedByName,
        note: stored.note,
        version: stored.rowVersion,
      } : null;
      const result = await plan(current);
      const record = result.record, event = result.event;
      const previous = current?.version ?? 0;
      // Verify actor identity and current role at COMMIT time, under locks.
      // Authenticated request context alone may be stale after role revocation.
      if (event.actorKind === "LEARNER") {
        if (event.actorUserId !== member.userId ||
            (event.action !== "SUBMITTED" && event.action !== "UPDATE_SUBMITTED" &&
              event.action !== "WITHDRAWN")) {
          throw new VerificationStateError("NOT_ALLOWED");
        }
      } else {
        if (event.actorUserId === member.userId ||
            (event.action !== "VERIFIED" && event.action !== "SENT_BACK")) {
          throw new VerificationStateError("NOT_ALLOWED");
        }
        const [reviewerUser] = await tx.select({status:users.platformStatus})
          .from(users).where(eq(users.id,event.actorUserId)).for("share");
        if (reviewerUser?.status !== "ACTIVE") {
          throw new VerificationStateError("NOT_ALLOWED");
        }
        if (event.actorKind === "SUPER_ADMIN") {
          const [superRole] = await tx.select({role:systemRoles.role})
            .from(systemRoles).where(and(eq(systemRoles.userId,event.actorUserId),
              eq(systemRoles.role,"SUPER_ADMIN"))).for("share");
          if (!superRole) throw new VerificationStateError("NOT_ALLOWED");
          // Selected super-admin organization/college scope is validated by
          // the service permission policy before entering this transaction.
        } else {
          const [reviewer] = await tx.select({
            id:collegeMemberships.id,status:collegeMemberships.status,
          }).from(collegeMemberships)
            .where(and(eq(collegeMemberships.userId,event.actorUserId),
              eq(collegeMemberships.collegeId,member.collegeId))).for("share");
          if (!reviewer || reviewer.status !== "ACTIVE") {
            throw new VerificationStateError("NOT_ALLOWED");
          }
          const expectedRole = event.actorKind === "TPO" ? "TPO" : "COLLEGE_ADMIN";
          const [reviewRole] = await tx.select({role:membershipRoles.role})
            .from(membershipRoles)
            .where(and(eq(membershipRoles.membershipId,reviewer.id),
              eq(membershipRoles.role,expectedRole))).for("share");
          if (!reviewRole) throw new VerificationStateError("NOT_ALLOWED");
          if (event.actorKind === "TPO") {
            const [grant] = await tx.select({id:profileVerificationTpoGrants.membershipId})
              .from(profileVerificationTpoGrants)
              .where(and(eq(profileVerificationTpoGrants.membershipId,reviewer.id),
                sql`${profileVerificationTpoGrants.revokedAt} is null`)).for("share");
            const [setting] = await tx.select({enabled:profileVerificationSettings.tpoCanVerifyProfiles})
              .from(profileVerificationSettings)
              .where(eq(profileVerificationSettings.collegeId,member.collegeId)).for("share");
            if (!grant || setting?.enabled === false) {
              throw new VerificationStateError("NOT_ALLOWED");
            }
          }
        }
      }
      if (record.learnerMembershipId !== membershipId || record.section !== section ||
          event.section !== section || record.version !== previous + 1 ||
          event.priorVersion !== previous || event.nextVersion !== record.version ||
          event.actorUserId.length === 0) {
        throw new VerificationStateError("INVALID_TRANSITION");
      }
      // A returned UPDATE_PENDING proof must never replace the previously
      // approved snapshot or its publication. First-time SEND_BACK instead
      // enters SENT_BACK with no verified evidence. These invariants are
      // checked under the same membership/verification row locks as the write.
      if(event.action==="SENT_BACK"){
        if(!event.note||event.note.trim().length<3||
          record.note?.trim()!==event.note.trim())
          throw new VerificationStateError("INVALID_TRANSITION");
        if(current?.status==="UPDATE_PENDING"&&(
          record.status!=="VERIFIED"||
          JSON.stringify(record.verifiedSnapshot)!==JSON.stringify(current.verifiedSnapshot)||
          record.verifiedAt?.getTime()!==current.verifiedAt?.getTime()))
          throw new VerificationStateError("INVALID_TRANSITION");
        if(current?.status==="SUBMITTED"&&(
          record.status!=="SENT_BACK"||record.verifiedSnapshot!==null))
          throw new VerificationStateError("INVALID_TRANSITION");
      }
      if(event.action==="VERIFIED"&&(
        record.status!=="VERIFIED"||
        JSON.stringify(record.verifiedSnapshot)!==JSON.stringify(record.submittedSnapshot)))
        throw new VerificationStateError("INVALID_TRANSITION");
      const values = {
        submittedSnapshot: record.submittedSnapshot,
        verifiedSnapshot: record.verifiedSnapshot,
        submittedAt: record.submittedAt,
        verifiedAt: record.verifiedAt,
        decidedAt: record.decidedAt,
        decidedByUserId: record.decidedByUserId,
        decidedByName: record.decidedByName,
        note: record.note,
        rowVersion: record.version,
        updatedAt: new Date(),
      };
      const [persisted] = stored
        ? await tx.update(profileVerifications).set({
            ...values, status: record.status,
          }).where(and(
            eq(profileVerifications.id, stored.id),
            eq(profileVerifications.rowVersion, previous),
          )).returning({ id: profileVerifications.id })
        : await tx.insert(profileVerifications).values({
            learnerMembershipId: membershipId, section,
            status: record.status, ...values,
          }).returning({ id: profileVerifications.id });
      if (!persisted) throw new VerificationStateError("STALE_VERSION");
      if (event.action === "VERIFIED" && section === "EDUCATION") {
        if (!record.verifiedSnapshot || !record.verifiedAt) {
          throw new VerificationStateError("INVALID_TRANSITION");
        }
        await publishVerifiedEducation(tx, {
          verificationId:persisted.id, membershipId, collegeId:member.collegeId,
          verifiedSnapshot:record.verifiedSnapshot, version:record.version,
          reviewerId:event.actorUserId, verifiedAt:record.verifiedAt,
        });
      }
      await tx.insert(profileVerificationEvents).values({
        verificationId: persisted.id,
        action: event.action,
        actorKind: event.actorKind,
        actorUserId: event.actorUserId,
        actorName: event.actorName,
        note: event.note,
        snapshot: event.snapshot,
        priorVersion: event.priorVersion,
        nextVersion: event.nextVersion,
        createdAt: event.occurredAt,
      });
      if (event.action === "VERIFIED" || event.action === "SENT_BACK") {
        if (!college) throw new VerificationStateError("NOT_ALLOWED");
        const [activity] = await tx.insert(activityEvents).values({
          organizationId:college.organizationId,collegeId:member.collegeId,
          actorUserId:event.actorUserId,module:"PLACEMENTS",
          eventType:event.action === "VERIFIED"
            ? "PROFILE_VERIFICATION_APPROVED" : "PROFILE_VERIFICATION_SENT_BACK",
          importance:"NORMAL",subjectType:"PROFILE_VERIFICATION",
          subjectId:persisted.id,
          summary:event.action === "VERIFIED"
            ? "Learner profile section verified" : "Profile section returned for correction",
          metadata:{section,version:record.version,
            eligibilityEvidenceRefreshed:event.action==="VERIFIED"&&section==="EDUCATION",
            decisionNotificationQueued:true,
            retainedPriorVerifiedSnapshot:event.action==="SENT_BACK"&&
              current?.status==="UPDATE_PENDING"},

        }).returning({id:activityEvents.id});
        if (!activity) throw new VerificationStateError("INVALID_TRANSITION");
        const message=verificationDecisionNotice({
          section,action:event.action,
          reviewerName:event.actorName??record.decidedByName,
          reason:event.note??record.note,
        });
        await tx.insert(inAppNotifications).values({
          userId:member.userId,eventId:activity.id,...message,
        });
      }
      return record;
    });
  };
