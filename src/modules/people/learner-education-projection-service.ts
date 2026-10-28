import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  learnerProfileEducationDocuments,
  learnerProfileEducationEntries,
  profilePrivateDocumentReceipts,
} from "@/db/schema";
import type { LearnerProfileDocument } from "./profile-validation";

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/**
 * DB-007 normalized education is an atomic projection of the learner's
 * authorized, version-checked profile_document. It is NOT a second editable
 * canonical source: both profile writers call this under their profile row
 * lock in the same transaction. A deliberately incomplete/ungraded draft
 * stays in profile JSON and is excluded from the qualified screening rows.
 *
 * Never publish arbitrary URLs as evidence. Exact-owner CLEAN receipt checks
 * are enforced again by the registered DB04 composite FK and trigger.
 */
export async function syncLearnerEducationProjection(
  tx: Tx,
  membershipId: string,
  education: LearnerProfileDocument["education"],
) {
  const seen = new Set<string>();
  for (const item of education) {
    if (seen.has(item.id)) throw new Error("DUPLICATE_EDUCATION_ID");
    seen.add(item.id);
  }

  // Validate *all* attachment references, including ungraded drafts that
  // do not yet qualify for screening. A partial JSON edit must never retain
  // another learner's private document ID as an apparent attachment.
  const verifiedReceipts = new Map<string,{ id:string; purpose:string }>();
  for (const item of education) {
    if (!item.certificateReceiptId) continue;
    const [receipt] = await tx.select({
      id: profilePrivateDocumentReceipts.id,
      purpose: profilePrivateDocumentReceipts.purpose,
      relatedEntryId: profilePrivateDocumentReceipts.relatedEntryId,
    }).from(profilePrivateDocumentReceipts).where(and(
      eq(profilePrivateDocumentReceipts.id, item.certificateReceiptId),
      eq(profilePrivateDocumentReceipts.owningMembershipId, membershipId),
      inArray(profilePrivateDocumentReceipts.purpose, ["MARKSHEET", "EDUCATION_CERTIFICATE"]),
      eq(profilePrivateDocumentReceipts.scanStatus, "CLEAN"),
      sql`${profilePrivateDocumentReceipts.revokedAt} is null`,
      sql`(${profilePrivateDocumentReceipts.retentionUntil} is null or ${profilePrivateDocumentReceipts.retentionUntil} > now())`,
    )).for("share").limit(1);
    if (!receipt || (receipt.relatedEntryId !== null && receipt.relatedEntryId !== item.id))
      throw new Error("EDUCATION_RECEIPT_INVALID");
    verifiedReceipts.set(item.id,receipt);
  }

  const qualified = education.filter(item =>
    item.educationType.trim() && item.institution.trim() &&
    item.gradingType && item.gradeObtained.trim() && item.maxGrade.trim(),
  );
  // The caller already owns the locked learner profile. Serialize against
  // direct row writers and clear the partial unique "recent" slot first so
  // switching the recent qualification cannot fail halfway through.
  const previous = await tx.select({ id: learnerProfileEducationEntries.id })
    .from(learnerProfileEducationEntries)
    .where(eq(learnerProfileEducationEntries.learnerMembershipId, membershipId))
    .for("update");
  await tx.update(learnerProfileEducationEntries).set({
    isRecentEducation: false,
    updatedAt: new Date(),
  }).where(eq(learnerProfileEducationEntries.learnerMembershipId, membershipId));

  for (const item of qualified) {
    const values = {
      learnerMembershipId: membershipId,
      educationType: item.educationType,
      program: item.program || null,
      specialization: item.specialization || null,
      institutionName: item.institution,
      startYear: item.startYear ? Number(item.startYear) : null,
      // A currently pursuing qualification has no completed end-year in the
      // registered screening representation; preserve future plans in JSON.
      endYear: item.isCurrentlyPursuing ? null :
        (item.endYear ? Number(item.endYear) : null),
      isCurrentlyPursuing: item.isCurrentlyPursuing,
      isRecentEducation: false,
      gradingType: item.gradingType,
      gradeObtained: item.gradeObtained,
      maxGrade: item.maxGrade,
      qualifyingExam: item.qualifyingExam || null,
      examRank: item.examRank || null,
      examDetails: item.examDetails,
      legacyDegree: item.degree || null,
      legacyField: item.field || null,
      legacyScore: item.score || null,
      legacyDescription: item.description || null,
      archivedAt: null,
      updatedAt: new Date(),
    };
    const [saved] = await tx.insert(learnerProfileEducationEntries)
      .values({ id: item.id, ...values })
      .onConflictDoUpdate({
        target: learnerProfileEducationEntries.id,
        set: values,
        // An attacker-chosen UUID must not overwrite somebody else's row.
        setWhere: eq(learnerProfileEducationEntries.learnerMembershipId, membershipId),
      })
      .returning({ id: learnerProfileEducationEntries.id });
    if (!saved) throw new Error("EDUCATION_OWNERSHIP_CONFLICT");

    // Current education attachments are projections too. Prior linkage for
    // an edited row is replaced under the same transaction and parent lock.
    await tx.delete(learnerProfileEducationDocuments).where(and(
      eq(learnerProfileEducationDocuments.educationEntryId, item.id),
      eq(learnerProfileEducationDocuments.learnerMembershipId, membershipId),
    ));
    if (item.certificateReceiptId) {
      const receipt=verifiedReceipts.get(item.id);
      if (!receipt) throw new Error("EDUCATION_RECEIPT_INVALID");
      await tx.insert(learnerProfileEducationDocuments).values({
        educationEntryId: item.id,
        learnerMembershipId: membershipId,
        receiptId: receipt.id,
        purpose: receipt.purpose,
      });
    }
  }

  const keep = new Set(qualified.map(item => item.id));
  const removed = previous.map(item => item.id).filter(id => !keep.has(id));
  if (removed.length) await tx.update(learnerProfileEducationEntries).set({
    archivedAt: new Date(), isRecentEducation: false, updatedAt: new Date(),
  }).where(and(
    eq(learnerProfileEducationEntries.learnerMembershipId, membershipId),
    inArray(learnerProfileEducationEntries.id, removed),
  ));

  // New + old rows were all demoted above; promote just the current eligible
  // primary record after old duplicates/archives are no longer unique rivals.
  const recent = qualified.find(item => item.isRecentEducation);
  if (recent) await tx.update(learnerProfileEducationEntries).set({
    isRecentEducation: true, updatedAt: new Date(),
  }).where(and(
    eq(learnerProfileEducationEntries.id, recent.id),
    eq(learnerProfileEducationEntries.learnerMembershipId, membershipId),
    sql`${learnerProfileEducationEntries.archivedAt} is null`,
  ));
  return { activeQualified: qualified.length, archived: removed.length };
}
