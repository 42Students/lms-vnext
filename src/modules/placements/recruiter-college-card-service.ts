import "server-only";
import {and,asc,countDistinct,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users,placementJobs,collegeBranding,
  learnerProgramEnrollments,programs,departments,placementCompanyRelationships} from "@/db/schema";
import {type RequestContext,hasActiveRecruiter} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

export type RecruiterCollegeCard={
 collegeId:string;studentCount:number|null;branches:string[]|null;
 allDriveCount:number|null;liveDriveCount:number|null;
 tpoContact:{name:string;email:string|null}|null;
 logoUrl:string|null;memberKey:string;errors:string[];
};

/** All requests are scoped to one verified grant; never expose another college
 * or any learner identities. Each read is independently fallible and nullable. */
export async function recruiterCollegeCardDetail(context:RequestContext,collegeId:string){
 const recruiter=context.recruiter;
 if(!hasActiveRecruiter(context)||!recruiter||recruiter.userId!==context.user.id)
  throw new AuthorizationError("placements.recruiter.read");
 const grant=recruiter.grants.find(g=>g.collegeId===collegeId);
 if(!grant)throw new AuthorizationError("placements.recruiter.read");
 requirePermission(context,"placements.recruiter.read",{
  collegeId,placementCompanyRelationshipId:grant.companyRelationshipId,
 });
 const db=getDb();
 const [students,branches,drives,tpo,branding]=await Promise.allSettled([
  db.select({total:countDistinct(collegeMemberships.id)})
   .from(collegeMemberships)
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
   .where(and(eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"))),
  db.selectDistinct({name:departments.name}).from(learnerProgramEnrollments)
   .innerJoin(collegeMemberships,and(
     eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
     eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
   .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),
     eq(departments.collegeId,collegeId),isNull(departments.archivedAt)))
   .where(eq(learnerProgramEnrollments.status,"ACTIVE"))
   .orderBy(asc(departments.name)).limit(100),
  db.select({all:sql<number>`count(*)::int`,
   live:sql<number>`count(*) filter (where ${placementJobs.status}='PUBLISHED')::int`})
   .from(placementJobs).innerJoin(placementCompanyRelationships,and(
     eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
     eq(placementCompanyRelationships.collegeId,collegeId),
     eq(placementCompanyRelationships.companyId,recruiter.companyId)))
   .where(and(eq(placementJobs.collegeId,collegeId),isNull(placementJobs.archivedAt),
     eq(placementJobs.createdByUserId,context.user.id))),
  db.select({name:users.displayName,email:users.email}).from(collegeMemberships)
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
   .where(and(eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
   .orderBy(asc(users.displayName),asc(users.id)).limit(1),
  db.select({logoUrl:collegeBranding.logoUrl}).from(collegeBranding)
   .where(eq(collegeBranding.collegeId,collegeId)).limit(1),
 ]);
 const errors:string[]=[];
 const get=<T>(value:PromiseSettledResult<T>,name:string):T|null=>{
  if(value.status==="fulfilled")return value.value;
  errors.push(name);return null;
 };
 const a=get(students,"Learner count"),br=get(branches,"Branches"),
  j=get(drives,"Drive count"),c=get(tpo,"TPO contact"),logo=get(branding,"College logo");
 const result:RecruiterCollegeCard={
  collegeId,studentCount:a?.[0]?.total??null,
  branches:br?.map(row=>row.name)??null,
  allDriveCount:j?.[0]?.all??null,liveDriveCount:j?.[0]?.live??null,
  tpoContact:c?.[0]?{name:c[0].name,email:c[0].email}:null,
  logoUrl:logo?.[0]?.logoUrl??null,
  memberKey:grant.id,errors,
 };
 return result;
}
