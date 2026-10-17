import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, users, learnerProgramEnrollments, cohorts, programs, departments } from "@/db/schema";
import { profileVerifications, profileVerificationSettings, profileVerificationTpoGrants } from "@/db/schema/profile-verification";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { loadPlacementCollegeScope } from "./scope";
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";
import {effectiveTpoVerifierSetting,tpoVerifierGrantAllowed} from "@/modules/verification/switch-state";
import { placementTableExists } from "./staged-tables";
import type { VerificationQueueCard } from "@/components/verification/VerificationWorkspace";
import {submittedMarksheets} from "@/modules/verification/queue-mark-sheets";
import {verificationDocumentManifest} from "@/modules/verification/document-manifest";
import {verificationAttentionFlags} from "@/modules/verification/attention-flags";
const statusSchema=z.enum(["SUBMITTED","UPDATE_PENDING","VERIFIED","SENT_BACK"]);
const sectionSchema=z.enum(["EDUCATION","IDENTITY"]);
export async function getTpoVerificationQueue(ctx:RequestContext):Promise<{
 available:boolean;enabled:boolean;permitted:boolean;rows:VerificationQueueCard[];
}>{
 const collegeId=await requireTpoBatchActor(ctx);
 const names=["profile_verifications","profile_verification_settings","profile_verification_tpo_grants"];
 const available=(await Promise.all(names.map(placementTableExists))).every(Boolean);
 if(!available)return {available:false,enabled:false,permitted:false,rows:[]};
 const [setting]=await getDb().select({enabled:profileVerificationSettings.tpoCanVerifyProfiles})
  .from(profileVerificationSettings).where(eq(profileVerificationSettings.collegeId,collegeId)).limit(1);
 // Legacy default: enabled unless the college admin explicitly switches it off.
 if(!effectiveTpoVerifierSetting(setting))return {available:true,enabled:false,permitted:false,rows:[]};
 const [grant]=await getDb().select({revokedAt:profileVerificationTpoGrants.revokedAt})
  .from(profileVerificationTpoGrants)
  .where(eq(profileVerificationTpoGrants.membershipId,ctx.membership!.id)).limit(1);
 if(!tpoVerifierGrantAllowed(grant))return {available:true,enabled:true,permitted:false,rows:[]};
 const college=await loadPlacementCollegeScope(collegeId);
 requirePermission(ctx,"profile-verification.review",{
  collegeId,organizationId:college.organizationId,
  tpoVerificationAdministrator:true,tpoVerificationEnabled:true,
 });
 const records=await getDb().select({
  id:profileVerifications.learnerMembershipId,status:profileVerifications.status,
  section:profileVerifications.section,submittedAt:profileVerifications.submittedAt,
  version:profileVerifications.rowVersion,name:users.displayName,
  submittedSnapshot:profileVerifications.submittedSnapshot,
 }).from(profileVerifications)
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,profileVerifications.learnerMembershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
  .orderBy(desc(profileVerifications.submittedAt)).limit(100);
 const memberIds=[...new Set(records.map(row=>row.id))];
 const enrollments=memberIds.length?await getDb().select({
  membershipId:learnerProgramEnrollments.membershipId,
  batchName:cohorts.name,branchName:departments.name,
 }).from(learnerProgramEnrollments)
  .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
  .innerJoin(programs,and(eq(programs.id,learnerProgramEnrollments.programId),eq(programs.id,cohorts.programId)))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(inArray(learnerProgramEnrollments.membershipId,memberIds),
   eq(learnerProgramEnrollments.status,"ACTIVE"))):[];
 const byMember=new Map(enrollments.map(row=>[row.membershipId,row]));
 const evaluatedAt=new Date();
 const rows:VerificationQueueCard[]=records.flatMap(row=>{
  const status=statusSchema.safeParse(row.status),section=sectionSchema.safeParse(row.section);
  if(!status.success||!section.success)return [];
  const marks=submittedMarksheets(row.submittedSnapshot);
  const missingMarksheet=section.data==="EDUCATION"&&marks.missing>0;
  const missingIdentityProof=section.data==="IDENTITY"&&
    !verificationDocumentManifest(row.submittedSnapshot).some(ref=>ref.purpose==="AADHAAR"||ref.purpose==="PAN");
  const attention=verificationAttentionFlags({status:status.data,section:section.data,
    submittedAt:row.submittedAt,missingMarksheet},evaluatedAt)
    .map(flag=>flag.replaceAll("_"," ").toLowerCase());
  return [{learnerMembershipId:row.id,learnerName:row.name?.trim()||"Unnamed learner",
   batchName:byMember.get(row.id)?.batchName??null,branchName:byMember.get(row.id)?.branchName??null,
   status:status.data,section:section.data,
   submittedAt:row.submittedAt,version:row.version,missingMarksheet,missingIdentityProof,
   marksheets:{uploaded:marks.count-marks.missing,expected:marks.count,missing:marks.missing},attention}];
 });
 return {available:true,enabled:true,permitted:true,rows};
}
