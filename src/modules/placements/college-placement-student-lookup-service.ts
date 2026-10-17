import "server-only";
import {and,desc,eq,ilike,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,membershipRoles,users,
 placementApplications,placementJobs,placementOffers,placementJoiningOutcomes,
 placementCompanies,placementCompanyRelationships} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
export async function lookupCollegeStudentPlacement(ctx:RequestContext,raw:unknown){
 const q=z.string().trim().min(3).max(150).parse(raw);
 const collegeId=await requireCollegePlacementAdmin(ctx),db=getDb();
 const people=await db.select({membershipId:collegeMemberships.id,name:users.displayName,
  roll:learnerProfiles.rollNumber,email:users.email})
 .from(collegeMemberships)
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
  eq(membershipRoles.role,"LEARNER")))
 .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
 .where(and(eq(collegeMemberships.collegeId,collegeId),
  or(ilike(users.displayName,"%"+q.replace(/[\\%_]/g,"\\$&")+"%"),
   eq(learnerProfiles.rollNumber,q),eq(users.email,q))))
 .limit(15);
 if(!people.length)return{students:[],truncated:false};
 const result=await Promise.all(people.map(async person=>{
  const rows=await db.select({jobId:placementJobs.id,job:placementJobs.title,
   company:placementCompanies.name,
   submittedAt:placementApplications.submittedAt,
   applicationStatus:placementApplications.status,
   offerStatus:placementOffers.status,
   joining:placementJoiningOutcomes.status,
  }).from(placementApplications)
   .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
    eq(placementJobs.collegeId,collegeId)))
   .innerJoin(placementCompanyRelationships,
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .leftJoin(placementOffers,eq(placementOffers.applicationId,placementApplications.id))
   .leftJoin(placementJoiningOutcomes,eq(placementJoiningOutcomes.offerId,placementOffers.id))
   .where(eq(placementApplications.membershipId,person.membershipId))
   .orderBy(desc(placementApplications.submittedAt)).limit(100);
  return{...person,applications:rows,
   placed:rows.some(row=>row.offerStatus==="ACCEPTED"&&row.joining==="JOINED"),
   truncated:rows.length===100};
 }));
 return{students:result,truncated:people.length===15};
}
