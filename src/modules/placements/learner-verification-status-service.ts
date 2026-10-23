import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { profileVerifications, profilePrivateDocumentReceipts } from "@/db/schema/profile-verification";
import { learnerProfiles } from "@/db/schema";
import { learnerProfileDocumentSchema } from "@/modules/people/profile-validation";
import { evaluateVerificationEvidence, type Receipt } from "@/modules/profile-verification/evidence";
import {learnerPrivateEvidenceSummary} from "./learner-private-evidence-model";
import {learnerVerifiedIdentityChanged} from "./learner-verified-identity-diff";
import type { RequestContext } from "@/modules/identity/context";
import { requireOwnLearnerProfileAccess } from "@/modules/people/learner-profile-access-service";
import { learnerVerificationStatus } from "./learner-verification-status-model";

/** Summaries expose the learner's own reviewable education fields but never
 * raw identity numbers, storage keys, document UUIDs or private URLs. */
function educationSnapshotSummary(snapshot:unknown){
 const value=snapshot && typeof snapshot==="object" && !Array.isArray(snapshot)
  ? snapshot as Record<string,unknown> : {};
 const entries=Array.isArray(value["education"])?value["education"]:[];
 return entries.filter((item):item is Record<string,unknown>=>Boolean(item)&&
  typeof item==="object"&&!Array.isArray(item)).map(item=>{
  const field=(...names:string[])=>{
   for(const name of names){
    const part=item[name];
    if(typeof part==="string"||typeof part==="number")return String(part).slice(0,200);
   }
   return "";
  };
  return {
   qualification:field("educationType","qualificationType"),
   program:field("program","qualification","course"),
   specialization:field("specialization"),
   institution:field("institution","institutionName"),
   year:field("year","yearOfPassing","passingYear"),
   grading:field("grading","gradingType","gradeType"),
   grade:field("grade","gradeObtained"),
   maximum:field("maxGrade","maximumGrade"),
   marksheetRecorded:typeof item["marksheetDocumentId"]==="string"&&Boolean(item["marksheetDocumentId"]),
  };
 });
}
function academicValues(rows:ReturnType<typeof educationSnapshotSummary>){
 return rows.map(row=>({
  qualification:row.qualification,program:row.program,specialization:row.specialization,
  institution:row.institution,year:row.year,grading:row.grading,
  grade:row.grade,maximum:row.maximum,
 }));
}

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
    submittedSnapshot:profileVerifications.submittedSnapshot,
    verifiedSnapshot:profileVerifications.verifiedSnapshot,
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
    const submittedEducation=section==="EDUCATION"?educationSnapshotSummary(row?.submittedSnapshot):[];
    const verifiedEducation=section==="EDUCATION"?educationSnapshotSummary(row?.verifiedSnapshot):[];
    const currentEducation=section==="EDUCATION"?educationSnapshotSummary({education:document.education}):[];
    const identityChanged=section==="IDENTITY"
      ?learnerVerifiedIdentityChanged(row?.verifiedSnapshot,document.identity):null;
    return {
      ...view,
      submittedEducation,verifiedEducation,
      identityChangedSinceVerification:identityChanged,
      changedSinceVerification:section==="EDUCATION"&&Boolean(row?.verifiedSnapshot)&&
        JSON.stringify(academicValues(verifiedEducation))!==JSON.stringify(academicValues(currentEducation)),
      missing:readiness(section).missing,
      submittedAt:row?.submittedAt?.toISOString()??null,
      decidedAt:row?.decidedAt?.toISOString()??null,
      decidedByName:row?.decidedByName??null,
      verifiedAt:row?.verifiedAt?.toISOString()??null,
    };
  };
  return { education: select("EDUCATION"), identity: select("IDENTITY"), evidence };
}
