import "server-only";
import {and,asc,count,desc,eq,ilike,inArray,or,gte} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,membershipRoles,users,
 placementApplications,placementJobs,placementOffers,placementJoiningOutcomes,
 placementCompanies,placementCompanyRelationships,placementApplicationScreenings,
 placementCollegeApplicationStages,placementRoundCandidateSlots,placementJobRounds} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {capStudentLookupRows,relevantStudentApplicationOffers,STUDENT_LOOKUP_CAP,STUDENT_LOOKUP_APPLICATION_CAP} from "./college-placement-student-lookup-model";
/** Legacy first/last name is represented by one persisted displayName
 * in vNext. Never fabricate a name component or client supplied learner ID. */
export function collegeStudentLookupLabel(row:{
 name:string|null;email:string|null;roll:string|null;
 legacyLearnerId:number|null;membershipId:string;
}):string{
 const name=row.name?.trim().replace(/\\s+/g," ");
 return name||row.email?.trim()||
  (row.legacyLearnerId!==null?"Student #"+row.legacyLearnerId:null)||
  row.roll?.trim()||"Student #"+row.membershipId;
}

/** Convert UTC history dates using the product's IST zone. */
export function formatCollegePlacementAppliedDate(at:Date|string|null|undefined):string{
 if(!at)return "-";
 const d=at instanceof Date?at:new Date(at);
 if(!Number.isFinite(d.getTime()))return "-";
 return new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
 }).format(d);
}

/** No private application or profile joins in autocomplete. */
export async function suggestCollegePlacementLearners(ctx:RequestContext,raw:unknown){
 const q=z.string().trim().min(2).max(150).parse(raw);
 const collegeId=await requireCollegePlacementAdmin(ctx),db=getDb();
 const escaped=q.replace(/[\\\\%_]/g,"\\$&");
 const people=await db.select({
  membershipId:collegeMemberships.id,name:users.displayName,
  roll:learnerProfiles.rollNumber,email:users.email,
  legacyLearnerId:learnerProfiles.legacyLearnerId,
 }).from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .where(and(eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE"),
    or(ilike(users.displayName,"%"+escaped+"%"),
      ilike(users.email,"%"+escaped+"%"),
      ilike(learnerProfiles.rollNumber,"%"+escaped+"%"))))
  .orderBy(asc(users.displayName),asc(collegeMemberships.id))
  .limit(STUDENT_LOOKUP_CAP+1);
 return {students:people.slice(0,STUDENT_LOOKUP_CAP).map(person=>({
  ...person,label:collegeStudentLookupLabel(person),
 })),truncated:people.length>STUDENT_LOOKUP_CAP};
}

/** Backwards-compatible detailed history. Selected learners may instead use
 * getCollegeStudentPlacementDetails without reading other candidates. */
export async function lookupCollegeStudentPlacement(ctx:RequestContext,raw:unknown){
 const {students:visiblePeople,truncated}=await suggestCollegePlacementLearners(ctx,raw);
 const collegeId=await requireCollegePlacementAdmin(ctx),db=getDb();
 if(!visiblePeople.length)return{students:[],truncated:false};
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
  // Paginate distinct applications BEFORE joining offer versions. A learner
  // with many historical offer letters must not crowd out other applications.
  const rows=await db.select({
   jobId:placementJobs.id,job:placementJobs.title,
   company:placementCompanies.name,
   submittedAt:placementApplications.submittedAt,
   applicationStatus:placementApplications.status,
   applicationId:placementApplications.id,
   legacyApplicationId:placementApplications.legacyApplicationId,
   candidateRejectionReason:placementApplicationScreenings.candidateMessage,
   screeningStatus:placementApplicationScreenings.status,
   recordedStage:placementCollegeApplicationStages.stage,
  }).from(placementApplications)
   .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
    eq(placementJobs.collegeId,collegeId)))
   .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,collegeId)))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .leftJoin(placementCollegeApplicationStages,eq(placementCollegeApplicationStages.applicationId,placementApplications.id))
   .where(eq(placementApplications.membershipId,person.membershipId))
   .orderBy(desc(placementApplications.submittedAt),desc(placementApplications.id))
   .limit(STUDENT_LOOKUP_APPLICATION_CAP+1);
  const applications=capStudentLookupRows(rows,STUDENT_LOOKUP_APPLICATION_CAP);
  const applicationIds=applications.items.map(row=>row.applicationId);
  const offers=applicationIds.length?await db.select({
   id:placementOffers.id,applicationId:placementOffers.applicationId,
   status:placementOffers.status,joining:placementJoiningOutcomes.status,
  }).from(placementOffers)
   .leftJoin(placementJoiningOutcomes,eq(placementJoiningOutcomes.offerId,placementOffers.id))
   .where(inArray(placementOffers.applicationId,applicationIds))
   .orderBy(desc(placementOffers.issuedAt),desc(placementOffers.id)):[];
  const chosenOffers=relevantStudentApplicationOffers(offers);
  return {...person,applications:applications.items.map(row=>{
    const offer=chosenOffers.get(row.applicationId);
    const offerStatus=offer?.status??null,joining=offer?.joining??null;
    return {...row,offerStatus,joining,
      legacyStage:row.applicationStatus==="WITHDRAWN"?"WITHDRAWN":
       offerStatus==="ACCEPTED"&&joining==="JOINED"?"HIRED":offerStatus==="ISSUED"||offerStatus==="ACCEPTED"?
        "OFFERED":row.recordedStage??row.screeningStatus??"APPLIED",
      rejectionReason:row.screeningStatus==="REJECTED"&&row.candidateRejectionReason?.trim()?row.candidateRejectionReason.trim():null,
      appliedDateLabel:formatCollegePlacementAppliedDate(row.submittedAt),
    };
   }),
   placed:joinedMemberships.has(person.membershipId),
   truncated:applications.truncated};
 }));
 return{students:result,truncated};
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
    eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE"),
    eq(users.platformStatus,"ACTIVE"))).limit(1);
 if(!student)throw new Error("Student not found in this college");
 const appScope=and(eq(placementApplications.membershipId,input.membershipId),
  eq(placementJobs.collegeId,collegeId));
 const [totalRow]=await db.select({total:count()}).from(placementApplications)
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,collegeId)))
  .where(appScope);
 // Joined is a persistent outcome and must be found independently of
 // the current 25-record history page and independently of the last offer.
 const [confirmedJoining]=await db.select({membershipId:placementApplications.membershipId})
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
  .where(eq(placementApplications.membershipId,input.membershipId)).limit(1);
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
  .orderBy(desc(placementOffers.issuedAt),desc(placementOffers.id)):[];
 // Shared with the College Admin history: an older confirmed joining is
 // more relevant than a newer revoked letter for the same application.
 const latestOffers=relevantStudentApplicationOffers(offers);
 const interviews=ids.length?await db.select({
  applicationId:placementRoundCandidateSlots.applicationId,
  roundName:placementJobRounds.name,startsAt:placementRoundCandidateSlots.startsAt,
  room:placementRoundCandidateSlots.room,
 }).from(placementRoundCandidateSlots)
  .innerJoin(placementJobRounds,eq(placementJobRounds.id,placementRoundCandidateSlots.roundId))
  // Candidate IDs were authorized above; additionally tie the interview
  // round back to its application's job to reject malformed imported slots.
  .innerJoin(placementApplications,and(
   eq(placementApplications.id,placementRoundCandidateSlots.applicationId),
   eq(placementApplications.jobId,placementJobRounds.jobId)))
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
 const validSkills=learnerProfileDocumentSchema.shape.skills.safeParse(doc?.skills??[]);
 const validPreferences=learnerProfileDocumentSchema.shape.jobPreferences.safeParse(doc?.jobPreferences??{});
 return {
  student:{membershipId:student.membershipId,legacyLearnerId:student.legacyLearnerId,
   name:student.name,email:student.email,roll:student.roll,
   profile:{skills:validSkills.success?validSkills.data:[],
    jobPreferences:validPreferences.success?validPreferences.data:null,
    resumeAvailable:Boolean(student.resumeObjectPath)&&student.resumeScanStatus==="CLEAN",
    resumeScanStatus:student.resumeScanStatus,
    profileDocumentVersion:student.profileDocumentVersion??0}},
  page:input.page,pageSize,total:totalRow?.total??0,
  placed:Boolean(confirmedJoining),
  hasMore:input.page*pageSize<(totalRow?.total??0),
  applications:rows.map(row=>{
    const offer=latestOffers.get(row.applicationId),interview=nextInterviewByApplication.get(row.applicationId);
    const stage=row.applicationStatus==="WITHDRAWN"?"WITHDRAWN":
     offer?.status==="ACCEPTED"&&offer.joining==="JOINED"?"HIRED":
     offer&&(offer.status==="ISSUED"||offer.status==="ACCEPTED")?"OFFERED":
     row.recordedStage??(row.screeningStatus==="SHORTLISTED"?"SHORTLISTED":
      row.screeningStatus==="REJECTED"?"REJECTED":"APPLIED");
    return {...row,legacyStage:stage,
     rejectionReason:row.screeningStatus==="REJECTED"&&row.rejectionReason?.trim()?row.rejectionReason.trim():null,
     offerStatus:offer?.status??null,joining:offer?.joining??null,
     nextInterview:interview?{roundName:interview.roundName,
      startsAt:interview.startsAt.toISOString(),room:interview.room}:null};
  }),
 };
}
