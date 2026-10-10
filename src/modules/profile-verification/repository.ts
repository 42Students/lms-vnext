import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, colleges, learnerProfiles, membershipRoles, users,
} from "@/db/schema";
import {
  profilePrivateDocumentReceipts, profileVerificationSettings, profileVerificationTpoGrants,
} from "@/db/schema/profile-verification";
import { learnerProfileDocumentSchema } from "@/modules/people/profile-validation";
import {
  safeVerificationSnapshot, type SafeSnapshot, type VerificationSection,
} from "./domain";
import { evaluateVerificationEvidence, usablePrivateReceipt, validateSubmittedEvidence, type Receipt } from "./evidence";
import { postgresLockedVerificationTransition } from "./transaction-writer";
import type { VerificationTransactionRepository } from "./service";

type ObjectEvidenceVerifier = (receipt: Receipt) => Promise<boolean>;

/**
 * Safe-by-default DB04 adapter. It cannot be used for approval until callers
 * inject an implementation that verifies exact GCS bucket/object generation
 * and scan receipt. A missing verifier ALWAYS fails closed.
 */
export function createProfileVerificationRepository(
  verifyPrivateObject?: ObjectEvidenceVerifier,
): VerificationTransactionRepository {
  const loadReceipts = async (membershipId: string): Promise<Receipt[]> => {
    const rows = await getDb().select().from(profilePrivateDocumentReceipts)
      .where(eq(profilePrivateDocumentReceipts.owningMembershipId, membershipId));
    return rows.map(r => ({
      id:r.id, owningMembershipId:r.owningMembershipId,
      purpose:r.purpose as Receipt["purpose"], educationEntryId:r.educationEntryId,
      scanStatus:r.scanStatus as Receipt["scanStatus"], privateObjectKey:r.privateObjectKey,
      objectGeneration:r.objectGeneration, sha256Hex:r.sha256Hex, mimeType:r.mimeType,
      sizeBytes:r.sizeBytes, revokedAt:r.revokedAt, retentionUntil:r.retentionUntil,
    }));
  };
  const currentProfile = async (membershipId: string) => {
    const [row] = await getDb().select().from(learnerProfiles)
      .where(eq(learnerProfiles.membershipId, membershipId)).limit(1);
    return learnerProfileDocumentSchema.parse(row?.profileDocument ?? {});
  };
  const prepare = async (membershipId: string, section: VerificationSection) => {
    const profile = await currentProfile(membershipId);
    const receipts = await loadReceipts(membershipId);
    const verifiedObjects = verifyPrivateObject
      ? await Promise.all(receipts.map(async r => {
          try { return {receipt:r, verified:await verifyPrivateObject(r)}; }
          catch {return {receipt:r, verified:false};}
        }))
      : [];
    // No object verifier means NO verified receipts, regardless of CLEAN metadata.
    const accepted = verifiedObjects.filter(x => x.verified &&
      usablePrivateReceipt(x.receipt,membershipId,x.receipt.purpose,new Date(),x.receipt.educationEntryId))
      .map(x => x.receipt);
    const education = profile.education.map(e => ({
      id:e.id, educationType:e.educationType, gradeObtained:e.gradeObtained,
    }));
    const evidence = evaluateVerificationEvidence({
      owningMembershipId:membershipId, section, education,
      hasAadhaarNumber:!!profile.identity.aadhaarNumber,
      hasPanNumber:!!profile.identity.panNumber, receipts:accepted, now:new Date(),
    });
    const doc = (purpose: Receipt["purpose"], educationEntryId: string | null = null) =>
      accepted.find(r => r.purpose === purpose && r.educationEntryId === educationEntryId)?.id;
    const mask = (raw:string) => raw ? "XXXXXXXX" + raw.slice(-4) : "";
    const raw: SafeSnapshot = section === "IDENTITY"
      ? { aadhaarNumber:mask(profile.identity.aadhaarNumber),
          panNumber:mask(profile.identity.panNumber),
          ...(doc("AADHAAR") ? {aadhaarDocumentId:doc("AADHAAR")!}:{}),
          ...(doc("PAN") ? {panDocumentId:doc("PAN")!}:{}) }
      : { education:profile.education.map(e => ({
          id:e.id, educationType:e.educationType, program:e.program,
          institution:e.institution, specialization:e.specialization,
          gradingType:e.gradingType, grade:e.gradeObtained, max:e.maxGrade,
          endYear:e.endYear,
          ...(doc("MARKSHEET",e.id) ? {marksheetDocumentId:doc("MARKSHEET",e.id)!}:{}),
        })),
        ...(doc("RESUME") ? {resumeDocumentId:doc("RESUME")!}:{}) };
    return {snapshot:safeVerificationSnapshot(raw), documentsReady:evidence.ready};
  };

  return {
    withLockedTransition:postgresLockedVerificationTransition,
    async resolveLearner(membershipId) {
      const [row] = await getDb().select({
        membershipId:collegeMemberships.id,
        collegeId:collegeMemberships.collegeId,
        organizationId:colleges.organizationId,
        userId:collegeMemberships.userId,
        membershipStatus:collegeMemberships.status,
        platformStatus:users.platformStatus,
      }).from(collegeMemberships)
        .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
        .innerJoin(users,eq(users.id,collegeMemberships.userId))
        .where(eq(collegeMemberships.id,membershipId)).limit(1);
      if (!row) return null;
      const [learner] = await getDb().select({role:membershipRoles.role}).from(membershipRoles)
        .where(and(eq(membershipRoles.membershipId,membershipId),
          eq(membershipRoles.role,"LEARNER"))).limit(1);
      return {membershipId:row.membershipId,collegeId:row.collegeId,
        organizationId:row.organizationId,userId:row.userId,
        status:row.membershipStatus === "ACTIVE" && row.platformStatus !== "ACTIVE"
          ? "SUSPENDED" : row.membershipStatus,
        hasLearnerRole:!!learner};
    },
    async reviewerDisplayName(userId) {
      const [row] = await getDb().select({displayName:users.displayName}).from(users)
        .where(eq(users.id,userId)).limit(1);
      return row?.displayName ?? null;
    },
    async isTpoAdministrator(userId,collegeId) {
      const [row] = await getDb().select({id:profileVerificationTpoGrants.membershipId})
        .from(profileVerificationTpoGrants)
        .innerJoin(collegeMemberships, eq(collegeMemberships.id,profileVerificationTpoGrants.membershipId))
        .innerJoin(membershipRoles,and(
          eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
        .where(and(eq(collegeMemberships.userId,userId),
          eq(collegeMemberships.collegeId,collegeId),
          eq(collegeMemberships.status,"ACTIVE"),
          isNull(profileVerificationTpoGrants.revokedAt))).limit(1);
      return !!row;
    },
    async isTpoVerificationEnabled(collegeId) {
      const [row] = await getDb().select({enabled:profileVerificationSettings.tpoCanVerifyProfiles})
        .from(profileVerificationSettings)
        .where(eq(profileVerificationSettings.collegeId,collegeId)).limit(1);
      return row?.enabled ?? true; // exact legacy default
    },
    readCurrentSectionForSubmission:async (membershipId,section) => prepare(membershipId,section),
    async submittedEvidenceIsValid(membershipId,section,snapshot) {
      // Documents are bound to the immutable submitted snapshot. A learner
      // can edit draft profile details without silently replacing the review.
      if (!verifyPrivateObject) return false;
      const rows = await loadReceipts(membershipId);
      const accepted: Receipt[] = [];
      for (const receipt of rows) {
        try {
          if (await verifyPrivateObject(receipt)) accepted.push(receipt);
        } catch {
          // Unavailable storage/scan verifier fails closed.
        }
      }
      return validateSubmittedEvidence(membershipId,section,snapshot,accepted,new Date());
    },
  };
}
