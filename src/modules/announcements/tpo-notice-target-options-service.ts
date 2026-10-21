import "server-only";
import {and,asc,eq,inArray,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,departments,placementJobs,programs} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";

/** TPO-inbox-team-44: selector choices are facts scoped by college, never
 * user-input IDs or visibility inferred across institutions.
 */
export async function listTpoNoticeTargetOptions(context:RequestContext){
 const member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,member.collegeId);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [batches,branches,drives]=await Promise.all([
   tx.select({id:cohorts.id,name:cohorts.name,program:programs.name})
    .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(and(eq(departments.collegeId,college.id),isNull(departments.archivedAt),
     isNull(cohorts.inactiveAt)))
    .orderBy(asc(cohorts.name),asc(cohorts.id)).limit(300),
   tx.select({id:departments.id,name:departments.name}).from(departments)
    .where(and(eq(departments.collegeId,college.id),isNull(departments.archivedAt)))
    .orderBy(asc(departments.name),asc(departments.id)).limit(200),
   tx.select({id:placementJobs.id,name:placementJobs.title}).from(placementJobs)
    .where(and(eq(placementJobs.collegeId,college.id),inArray(placementJobs.status,["PUBLISHED","CLOSED"])))
    .orderBy(asc(placementJobs.title),asc(placementJobs.id)).limit(60),
  ]);
  return {
   batches:batches.map(row=>({id:row.id,label:row.name+" · "+row.program})),
   branches:branches.map(row=>({id:row.id,label:row.name})),
   drives:drives.map(row=>({id:row.id,label:row.name})),
   // Legacy emailReady was false: this selector never claims external delivery.
   emailReady:false as const,
   deliveryChannels:{inApp:true as const,email:false as const,sms:false as const},
  };
 });
}
