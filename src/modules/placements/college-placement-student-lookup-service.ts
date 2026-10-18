import "server-only";
import {and,desc,eq,ilike,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,membershipRoles,users,
 placementApplications,placementJobs,placementOffers,placementJoiningOutcomes,
 placementCompanies,placementCompanyRelationships} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {capStudentLookupRows,STUDENT_LOOKUP_CAP,STUDENT_LOOKUP_APPLICATION_CAP} from "./college-placement-student-lookup-model";
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
 .limit(STUDENT_LOOKUP_CAP+1);
 if(!people.length)return{students:[],truncated:false};
 const result=await Promise.all(capStudentLookupRows(people,STUDENT_LOOKUP_CAP).items.map(async person=>{
  const rows=await db.select({jobId:placementJobs.id,job:placementJobs.title,
   company:placementCompanies.name,
   submittedAt:placementApplications.submittedAt,
   applicationStatus:placementApplications.status,
   offerStatus:placementOffers.status,
   joining:placementJoiningOutcomes.status,
  }).from(placementApplications)
   .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
    eq(placementJobs.collegeId,collegeId)))
   // Both the job and its company relationship must belong to this college.
   // An incorrect cross-tenant relationship FK must never disclose another
   // college's company account through the selected-college lookup.
   .innerJoin(placementCompanyRelationships,
    and(eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId,collegeId)))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .leftJoin(placementOffers,eq(placementOffers.applicationId,placementApplications.id))
   .leftJoin(placementJoiningOutcomes,eq(placementJoiningOutcomes.offerId,placementOffers.id))
   .where(eq(placementApplications.membershipId,person.membershipId))
   .orderBy(desc(placementApplications.submittedAt),desc(placementApplications.id),desc(placementOffers.id)).limit(STUDENT_LOOKUP_APPLICATION_CAP+1);
  const applications=capStudentLookupRows(rows,STUDENT_LOOKUP_APPLICATION_CAP);
  return{...person,applications:applications.items,
   placed:applications.items.some(row=>row.offerStatus==="ACCEPTED"&&row.joining==="JOINED"),
   truncated:applications.truncated};
 }));
 return{students:result,truncated:people.length>STUDENT_LOOKUP_CAP};
}
