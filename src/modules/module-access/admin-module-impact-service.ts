import "server-only";
import {moduleDisableImpactSummary} from "./admin-module-impact-model";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {and,count,countDistinct,eq,gt,isNull,notInArray,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {colleges,collegeMemberships,membershipRoles,users,projectInstances,projectMembers,placementJobs,placementApplications,placementOffers,placementRoundCandidateSlots} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
const id=z.uuid();
/** Only return aggregate tenant counts while the persisted Super Admin role
 * and this exact active college's scope are still valid. */
async function assertCurrentImpactScope(ctx:RequestContext,collegeId:string,organizationId:string){
 await getDb().transaction(async tx=>{
  const [college]=await tx.select({status:colleges.status,organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE"||college.organizationId!==organizationId)
   throw new AuthorizationError("college.read");
  const live=await assertPersistedPlatformPermission(tx,ctx,"college.read",{collegeId,organizationId});
  if(!isSuperAdmin(live))throw new AuthorizationError("admin-scope.select");
 });
}
export async function readModuleDisableImpact(ctx:RequestContext,collegeRaw:string,moduleRaw:string){
 if(!isSuperAdmin(ctx))throw new AuthorizationError("admin-scope.select");
 requirePermission(ctx,"admin-scope.select");
 const collegeId=id.parse(collegeRaw),moduleName=z.enum(["projects","placements","electives"]).parse(moduleRaw);
 const [college]=await getDb().select({id:colleges.id,name:colleges.name,organizationId:colleges.organizationId}).from(colleges)
  .where(and(eq(colleges.id,collegeId),eq(colleges.status,"ACTIVE"))).limit(1);
 if(!college)throw new AuthorizationError("college.read");
 requirePermission(ctx,"college.read",{collegeId,organizationId:college.organizationId});
 const db=getDb();
 const [population]=await db.select({total:countDistinct(collegeMemberships.id)})
  .from(collegeMemberships)
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")));
 const students=population?.total??0;
 if(moduleName==="projects"){
  const [row]=await db.select({total:count()}).from(projectMembers)
   .innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
   .where(and(eq(projectInstances.collegeId,collegeId),eq(projectInstances.status,"ACTIVE"),
     eq(projectMembers.role,"MENTOR"),eq(projectMembers.isPrimary,true),isNull(projectMembers.endedAt)));
  const counts=[row?.total??0];
  await assertCurrentImpactScope(ctx,collegeId,college.organizationId);
  return {module:moduleName,students,counts,summary:moduleDisableImpactSummary(moduleName,counts,college.name)};
 }
 if(moduleName==="placements"){
  // Legacy impact counts in-progress applications for actual college
  // learners, not only applications still in the initial SUBMITTED stage.
  // Include later screening/offered stages while excluding deleted/final
  // rejected, withdrawn or hired applications. BOOKED interviews likewise
  // require a real application in this college, not merely a job locator.
  const [drives,applications,offers,interviews]=await Promise.all([
   db.select({total:count()}).from(placementJobs)
    .where(and(eq(placementJobs.collegeId,collegeId),eq(placementJobs.status,"PUBLISHED"))),
   db.select({total:countDistinct(placementApplications.id)}).from(placementApplications)
    .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
    .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
    .where(and(
      eq(placementJobs.collegeId,collegeId),
      eq(collegeMemberships.collegeId,collegeId),
      notInArray(placementApplications.status,["HIRED","REJECTED","WITHDRAWN"]),
      or(isNull(placementApplications.legacyWasDeleted),
        eq(placementApplications.legacyWasDeleted,false)),
    )),
   db.select({total:count()}).from(placementOffers)
    .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
    .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
    .where(and(eq(placementJobs.collegeId,collegeId),eq(placementOffers.status,"ISSUED"))),
   db.select({total:countDistinct(placementRoundCandidateSlots.id)}).from(placementRoundCandidateSlots)
    .innerJoin(placementJobs,eq(placementJobs.id,placementRoundCandidateSlots.jobId))
    .innerJoin(placementApplications,eq(placementApplications.id,placementRoundCandidateSlots.applicationId))
    .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
    .where(and(
      eq(placementJobs.collegeId,collegeId),
      eq(collegeMemberships.collegeId,collegeId),
      eq(placementRoundCandidateSlots.status,"BOOKED"),
      gt(placementRoundCandidateSlots.startsAt,new Date()),
    )),
  ]);
  const counts=[
    drives[0]?.total??0,applications[0]?.total??0,
    offers[0]?.total??0,interviews[0]?.total??0,
  ];
  await assertCurrentImpactScope(ctx,collegeId,college.organizationId);
  return {module:moduleName,counts,summary:moduleDisableImpactSummary(moduleName,counts,college.name)};
 }
 await assertCurrentImpactScope(ctx,collegeId,college.organizationId);
 return {module:moduleName,students,counts:[],summary:moduleDisableImpactSummary(moduleName,[])};
}
