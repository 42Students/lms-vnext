import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, colleges } from "@/db/schema";
import { profileVerificationEvents, profileVerifications } from "@/db/schema/profile-verification";
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
      await tx.select({id:colleges.id}).from(colleges)
        .where(eq(colleges.id,target.collegeId)).for("share");
      const [member] = await tx.select({
        id: collegeMemberships.id,
        status: collegeMemberships.status,
        collegeId: collegeMemberships.collegeId,
      }).from(collegeMemberships).where(eq(collegeMemberships.id, membershipId)).for("update");
      if (!member || member.status !== "ACTIVE") {
        throw new VerificationStateError("NOT_ALLOWED");
      }
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
      if (record.learnerMembershipId !== membershipId || record.section !== section ||
          event.section !== section || record.version !== previous + 1 ||
          event.priorVersion !== previous || event.nextVersion !== record.version ||
          event.actorUserId.length === 0) {
        throw new VerificationStateError("INVALID_TRANSITION");
      }
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
      return record;
    });
  };
