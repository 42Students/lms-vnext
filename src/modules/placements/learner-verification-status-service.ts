import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { profileVerifications, profilePrivateDocumentReceipts } from "@/db/schema/profile-verification";
import { learnerProfiles } from "@/db/schema";
import { learnerProfileDocumentSchema } from "@/modules/people/profile-validation";
import { evaluateVerificationEvidence, type Receipt } from "@/modules/profile-verification/evidence";
import {learnerPrivateEvidenceSummary} from "./learner-private-evidence-model";
import type { RequestContext } from "@/modules/identity/context";
import { requireOwnLearnerProfileAccess } from "@/modules/people/learner-profile-access-service";
import { learnerVerificationStatus } from "./learner-verification-status-model";

/** Read only the persisted, current learner membership's two verification rows.
 * The profile-access service rechecks user, membership, role and college in DB.
 * Never return submitted snapshots or private document locations.
 */
export async function getOwnLearnerVerificationStatus(context: RequestContext) {
  const member = await requireOwnLearnerProfileAccess(context);
  const rows = await getDb().select({
    section: profileVerifications.section,
    status: profileVerifications.status,
    note: profileVerifications.note,
    version: profileVerifications.rowVersion,
    submittedAt: profileVerifications.submittedAt,
    decidedAt: profileVerifications.decidedAt,
    decidedByName: profileVerifications.decidedByName,
    verifiedAt: profileVerifications.verifiedAt,
  }).from(profileVerifications)
    .where(eq(profileVerifications.learnerMembershipId, member.id));
  const receiptRows=await getDb().select().from(profilePrivateDocumentReceipts)
    .where(eq(profilePrivateDocumentReceipts.owningMembershipId,member.id));
  const [ownProfile]=await getDb().select({document:learnerProfiles.profileDocument})
    .from(learnerProfiles).where(eq(learnerProfiles.membershipId,member.id)).limit(1);
  const document=learnerProfileDocumentSchema.parse(ownProfile?.document??{});
  const now=new Date();
  const evidence=learnerPrivateEvidenceSummary(receiptRows,now);
  const receipts=receiptRows.map(row=>({...row,
    purpose:row.purpose as Receipt["purpose"],scanStatus:row.scanStatus as Receipt["scanStatus"],
  }));
  const readiness=(section:"EDUCATION"|"IDENTITY")=>evaluateVerificationEvidence({
    owningMembershipId:member.id,section,
    education:document.education.map(row=>({id:row.id,educationType:row.educationType,
      gradeObtained:row.gradeObtained})),
    hasAadhaarNumber:Boolean(document.identity.aadhaarNumber),
    hasPanNumber:Boolean(document.identity.panNumber),receipts,now,
  });
  const select = (section: "EDUCATION" | "IDENTITY") => {
    const row = rows.find(r => r.section === section);
    const view = learnerVerificationStatus(section,
      row && (row.status === "SUBMITTED" || row.status === "SENT_BACK" ||
        row.status === "VERIFIED" || row.status === "UPDATE_PENDING")
        ? { section, status: row.status, note: row.note, version: row.version }
        : null);
    return {
      ...view,
      missing:readiness(section).missing,
      submittedAt:row?.submittedAt?.toISOString()??null,
      decidedAt:row?.decidedAt?.toISOString()??null,
      decidedByName:row?.decidedByName??null,
      verifiedAt:row?.verifiedAt?.toISOString()??null,
    };
  };
  return { education: select("EDUCATION"), identity: select("IDENTITY"), evidence };
}
