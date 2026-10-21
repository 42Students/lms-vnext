import "server-only";
import {and,asc,count,desc,eq,ilike,inArray,or,gte} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,membershipRoles,users,
 placementApplications,placementJobs,placementOffers,placementJoiningOutcomes,
 placementCompanies,placementCompanyRelationships,placementApplicationScreenings,
 placementCollegeApplicationStages,placementRoundCandidateSlots,placementJobRounds} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {capStudentLookupRows,STUDENT_LOOKUP_CAP,STUDENT_LOOKUP_APPLICATION_CAP} from "./college-placement-student-lookup-model";
export async function lookupCollegeStudentPlacement(ctx:RequestContext,raw:unknown){
 const q=z.string().trim().min(2).max(150).parse(raw);
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
 .orderBy(asc(users.displayName),asc(collegeMemberships.id))
 .limit(Math.min(10,STUDENT_LOOKUP_CAP)+1);
 if(!people.length)return{students:[],truncated:false};
 const visiblePeople=capStudentLookupRows(people,Math.min(10,STUDENT_LOOKUP_CAP)).items;
 // Joining can have happened on an older drive beyond the 100-row detail cap.
 // Query that fact separately for all visible learner memberships, scoped to
 // the selected college's jobs AND employer relationships.
 const joinedRows=await db.selectDistinct({membershipId:placementApplications.membershipId})
   .from(placementApplications)
   .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
    eq(placementJobs.collegeId,collegeId)))
   .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,collegeId)))
   .innerJoin(placementOffers,and(
    eq(placementOffers.applicationId,placementApplications.id),
    eq(placementOffers.status,"ACCEPTED")))
   .innerJoin(placementJoiningOutcomes,and(
    eq(placementJoiningOutcomes.offerId,placementOffers.id),
    eq(placementJoiningOutcomes.status,"JOINED")))
   .where(inArray(placementApplications.membershipId,visiblePeople.map(person=>person.membershipId)));
 const joinedMemberships=new Set(joinedRows.map(row=>row.membershipId));
 const result=await Promise.all(visiblePeople.map(async person=>{
  const rows=await db.select({jobId:placementJobs.id,job:placementJobs.title,
   company:placementCompanies.name,
   submittedAt:placementApplications.submittedAt,
   applicationStatus:placementApplications.status,
   applicationId:placementApplications.id,
   legacyApplicationId:placementApplications.legacyApplicationId,
   candidateRejectionReason:placementApplicationScreenings.candidateMessage,
   screeningStatus:placementApplicationScreenings.status,
   recordedStage:placementCollegeApplicationStages.stage,
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
   .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .leftJoin(placementCollegeApplicationStages,eq(placementCollegeApplicationStages.applicationId,placementApplications.id))
   .leftJoin(placementOffers,eq(placementOffers.applicationId,placementApplications.id))
   .leftJoin(placementJoiningOutcomes,eq(placementJoiningOutcomes.offerId,placementOffers.id))
   .where(eq(placementApplications.membershipId,person.membershipId))
   .orderBy(desc(placementApplications.submittedAt),desc(placementApplications.id),desc(placementOffers.id)).limit(STUDENT_LOOKUP_APPLICATION_CAP+1);
  // An application may have multiple offers. Old LMS displayed exactly one
  // application history row; keep the most recent offer for that application.
  const distinct=[...new Map(rows.map(row=>[row.applicationId,row])).values()];
  const applications=capStudentLookupRows(distinct,STUDENT_LOOKUP_APPLICATION_CAP);
  return{...person,applications:applications.items.map(row=>({
    ...row,legacyStage:row.applicationStatus==="WITHDRAWN"?"WITHDRAWN":
     row.joining==="JOINED"?"HIRED":row.offerStatus==="ISSUED"||row.offerStatus==="ACCEPTED"?
      "OFFERED":row.recordedStage??row.screeningStatus??"APPLIED",
    rejectionReason:row.screeningStatus==="REJECTED"?row.candidateRejectionReason:null,
   })),
   placed:joinedMemberships.has(person.membershipId),
   truncated:applications.truncated};
 }));
 return{students:result,truncated:people.length>Math.min(10,STUDENT_LOOKUP_CAP)};
}

/** Selected-learner detail is a separate authorized read, keyed only by the
 * college membership UUID. It never materializes the other 9 suggestions'
 * private resumes/preferences or eagerly reads their full history. */
export const collegeStudentPlacementDetailSchema=z.strictObject({
 membershipId:z.string().uuid(),
 page:z.number().int().min(1).max(100000).default(1),
});
export async function getCollegeStudentPlacementDetails(ctx:RequestContext,raw:unknown,now=new Date()){
 const input=collegeStudentPlacementDetailSchema.parse(raw);
 const collegeId=await requireCollegePlacementAdmin(ctx),db=getDb();
 const [student]=await db.select({
  membershipId:collegeMemberships.id,name:users.displayName,email:users.email,
  roll:learnerProfiles.rollNumber,legacyLearnerId:learnerProfiles.legacyLearnerId,
  profileDocument:learnerProfiles.profileDocument,
  resumeObjectPath:learnerProfiles.resumeObjectPath,
  resumeScanStatus:learnerProfiles.resumeScanStatus,
  profileDocumentVersion:learnerProfiles.profileDocumentVersion,
 }).from(collegeMemberships)
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER")))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .where(and(eq(collegeMemberships.id,input.membershipId),
    eq(collegeMemberships.collegeId,collegeId))).limit(1);
 if(!student)throw new Error("Student not found in this college");
 const appScope=and(eq(placementApplications.membershipId,input.membershipId),
  eq(placementJobs.collegeId,collegeId));
 const [totalRow]=await db.select({total:count()}).from(placementApplications)
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .where(appScope);
 const pageSize=25;
 const rows=await db.select({
  applicationId:placementApplications.id,legacyApplicationId:placementApplications.legacyApplicationId,
  submittedAt:placementApplications.submittedAt,applicationStatus:placementApplications.status,
  jobId:placementJobs.id,job:placementJobs.title,company:placementCompanies.name,
  recordedStage:placementCollegeApplicationStages.stage,
  screeningStatus:placementApplicationScreenings.status,
  rejectionReason:placementApplicationScreenings.candidateMessage,
 }).from(placementApplications)
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,collegeId)))
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .leftJoin(placementCollegeApplicationStages,eq(placementCollegeApplicationStages.applicationId,placementApplications.id))
  .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .where(appScope)
  .orderBy(desc(placementApplications.submittedAt),desc(placementApplications.id))
  .limit(pageSize).offset((input.page-1)*pageSize);
 const ids=rows.map(row=>row.applicationId);
 const offers=ids.length?await db.select({
  id:placementOffers.id,applicationId:placementOffers.applicationId,
  status:placementOffers.status,joining:placementJoiningOutcomes.status,
 }).from(placementOffers)
  .leftJoin(placementJoiningOutcomes,eq(placementJoiningOutcomes.offerId,placementOffers.id))
  .where(inArray(placementOffers.applicationId,ids))
  .orderBy(desc(placementOffers.createdAt),desc(placementOffers.id)):[];
 const latestOffers=new Map<string,typeof offers[number]>();
 for(const row of offers)if(!latestOffers.has(row.applicationId))latestOffers.set(row.applicationId,row);
 const interviews=ids.length?await db.select({
  applicationId:placementRoundCandidateSlots.applicationId,
  roundName:placementJobRounds.name,startsAt:placementRoundCandidateSlots.startsAt,
  room:placementRoundCandidateSlots.room,
 }).from(placementRoundCandidateSlots)
  .innerJoin(placementJobRounds,eq(placementJobRounds.id,placementRoundCandidateSlots.roundId))
  .where(and(inArray(placementRoundCandidateSlots.applicationId,ids),
   eq(placementRoundCandidateSlots.status,"BOOKED"),
   gte(placementRoundCandidateSlots.startsAt,now)))
  .orderBy(asc(placementRoundCandidateSlots.startsAt)):[];
 const nextInterviewByApplication=new Map<string,typeof interviews[number]>();
 for(const interview of interviews)if(interview.applicationId&&
   !nextInterviewByApplication.has(interview.applicationId))
    nextInterviewByApplication.set(interview.applicationId,interview);
 // The profile payload is read only after resolving the selected active learner
 // in the college, never as part of the multi-student suggestion result.
 const doc=student.profileDocument;
 const validArray=(value:unknown):string[]=>Array.isArray(value)?
  value.filter((item):item is string=>typeof item==="string").slice(0,50):[];
 return {
  student:{membershipId:student.membershipId,legacyLearnerId:student.legacyLearnerId,
   name:student.name,email:student.email,roll:student.roll,
   profile:{skills:validArray(doc?.skills),jobPreferences:validArray(doc?.jobPreferences),
    resumeAvailable:Boolean(student.resumeObjectPath)&&student.resumeScanStatus==="CLEAN",
    profileDocumentVersion:student.profileDocumentVersion??0}},
  page:input.page,pageSize,total:totalRow?.total??0,
  hasMore:input.page*pageSize<(totalRow?.total??0),
  applications:rows.map(row=>{
    const offer=latestOffers.get(row.applicationId),interview=nextInterviewByApplication.get(row.applicationId);
    const stage=row.applicationStatus==="WITHDRAWN"?"WITHDRAWN":
     offer?.joining==="JOINED"?"HIRED":
     offer&&(offer.status==="ISSUED"||offer.status==="ACCEPTED")?"OFFERED":
     row.recordedStage??(row.screeningStatus==="SHORTLISTED"?"SHORTLISTED":
      row.screeningStatus==="REJECTED"?"REJECTED":"APPLIED");
    return {...row,legacyStage:stage,
     rejectionReason:stage==="REJECTED"?row.rejectionReason:null,
     offerStatus:offer?.status??null,joining:offer?.joining??null,
     nextInterview:interview?{roundName:interview.roundName,
      startsAt:interview.startsAt.toISOString(),room:interview.room}:null};
  }),
 };
}
