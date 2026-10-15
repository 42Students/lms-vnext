import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { profileVerifications, profilePrivateDocumentReceipts } from "@/db/schema/profile-verification";
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
  }).from(profileVerifications)
    .where(eq(profileVerifications.learnerMembershipId, member.id));
  const receiptRows=await getDb().select({
    purpose:profilePrivateDocumentReceipts.purpose,
    scanStatus:profilePrivateDocumentReceipts.scanStatus,
    revokedAt:profilePrivateDocumentReceipts.revokedAt,
    retentionUntil:profilePrivateDocumentReceipts.retentionUntil,
  }).from(profilePrivateDocumentReceipts).where(eq(profilePrivateDocumentReceipts.owningMembershipId,member.id));
  const evidence=learnerPrivateEvidenceSummary(receiptRows,new Date());
  const select = (section: "EDUCATION" | "IDENTITY") => {
    const row = rows.find(r => r.section === section);
    const view = learnerVerificationStatus(section,
      row && (row.status === "SUBMITTED" || row.status === "SENT_BACK" ||
        row.status === "VERIFIED" || row.status === "UPDATE_PENDING")
        ? { section, status: row.status, note: row.note, version: row.version }
        : null);
    return {
      ...view,
      submittedAt:row?.submittedAt?.toISOString()??null,
      decidedAt:row?.decidedAt?.toISOString()??null,
    };
  };
  return { education: select("EDUCATION"), identity: select("IDENTITY"), evidence };
}
