import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, users } from "@/db/schema";
import { profileVerifications, profileVerificationSettings, profileVerificationTpoGrants } from "@/db/schema/profile-verification";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";
import { placementTableExists } from "./staged-tables";
import type { VerificationQueueCard } from "@/components/verification/VerificationWorkspace";
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
 // A missing setting does not authorize staff to view sensitive identity data.
 if(setting?.enabled!==true)return {available:true,enabled:false,permitted:false,rows:[]};
 const [grant]=await getDb().select({id:profileVerificationTpoGrants.membershipId})
  .from(profileVerificationTpoGrants)
  .where(and(eq(profileVerificationTpoGrants.membershipId,ctx.membership!.id),
   isNull(profileVerificationTpoGrants.revokedAt))).limit(1);
 if(!grant)return {available:true,enabled:true,permitted:false,rows:[]};
 const records=await getDb().select({
  id:profileVerifications.learnerMembershipId,status:profileVerifications.status,
  section:profileVerifications.section,submittedAt:profileVerifications.submittedAt,
  version:profileVerifications.rowVersion,name:users.displayName,
 }).from(profileVerifications)
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,profileVerifications.learnerMembershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
  .orderBy(desc(profileVerifications.submittedAt)).limit(100);
 const rows:VerificationQueueCard[]=records.flatMap(row=>{
  const status=statusSchema.safeParse(row.status),section=sectionSchema.safeParse(row.section);
  if(!status.success||!section.success)return [];
  return [{learnerMembershipId:row.id,learnerName:row.name??"Unnamed learner",
   batchName:null,branchName:null,status:status.data,section:section.data,
   submittedAt:row.submittedAt,version:row.version,missingMarksheet:false,attention:[]}];
 });
 return {available:true,enabled:true,permitted:true,rows};
}
