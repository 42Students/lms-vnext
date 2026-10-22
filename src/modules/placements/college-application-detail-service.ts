import "server-only";
import {and,asc,desc,eq,gt,inArray,isNull,sql} from "drizzle-orm";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {evaluatePlacementEligibility} from "./eligibility-service";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,learnerProfiles,placementApplications,
 placementApplicationScreenings,placementApplicationScreeningHistory,
 placementApplicationStatusHistory,placementJobRoleOptions,placementJobs,
 placementJobRounds,placementOffers,placementRoundResults,
 placementApplicationPrivateArtifacts,users} from "@/db/schema";
import {placementApplicationNotes} from "@/db/schema/placement-application-notes";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import {placementCollegeApplicationStages,placementCollegeApplicationStageHistory}
 from "@/db/schema/placement-college-application-stages";
import {hasMembershipRole,isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {profileVerifications} from "@/db/schema/profile-verification";
import {verificationDocumentManifest} from "@/modules/verification/document-manifest";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {collegeDriveIdSchema} from "./college-drive-read-model";

const uuid=z.string().uuid();
async function scoped(ctx:RequestContext,rawJobId:unknown,rawId:unknown){
 const collegeId=await requireCollegePlacementAdmin(ctx);
 const jobId=collegeDriveIdSchema.parse(rawJobId),id=uuid.parse(rawId);
 const [application]=await getDb().select({
  id:placementApplications.id,jobId:placementApplications.jobId,
  name:users.displayName,email:users.email,phone:users.phoneE164,
  membershipId:collegeMemberships.id,rollNumber:learnerProfiles.rollNumber,
  role:placementJobRoleOptions.title,
  source:placementApplications.channel,sourceProvider:placementApplications.sourceProvider,
  papRequested:placementApplications.papRequested,
  version:placementApplications.version,status:placementApplications.status,
  submittedAt:placementApplications.submittedAt,
  withdrawnAt:placementApplications.withdrawnAt,
  statusBeforeWithdrawal:placementApplications.statusBeforeWithdrawal,
  statusUpdatedAt:placementApplications.statusUpdatedAt,
  statusUpdatedByUserId:placementApplications.statusUpdatedByUserId,
  eligibilityStatus:placementApplications.eligibilityStatus,
  eligibilitySnapshot:placementApplications.eligibilitySnapshot,
 }).from(placementApplications)
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
  eq(placementJobs.collegeId,collegeId)))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
  eq(collegeMemberships.collegeId,collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(placementJobRoleOptions,eq(placementJobRoleOptions.id,placementApplications.roleOptionId))
 .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
 .where(and(eq(placementApplications.id,id),eq(placementApplications.jobId,jobId))).limit(1);
 if(!application)throw Error("Application not found in this college drive");
 return {collegeId,jobId,application};
}
/** All-job, college-scoped learner summary backing legacy AdminJobController.
 * The caller must have a selected college, and both membership and each job
 * are filtered by that college. Future interview slots are read separately
 * and joined by application ID, not by a cross-tenant learner email.
 */
export async function getCollegeLearnerPlacementSummary(
 ctx:RequestContext,rawMembershipId:unknown,
){
 const collegeId=await requireCollegePlacementAdmin(ctx);
 const membershipId=uuid.parse(rawMembershipId);
 const db=getDb();
 const [member]=await db.select({id:collegeMemberships.id})
  .from(collegeMemberships).where(and(
   eq(collegeMemberships.id,membershipId),
   eq(collegeMemberships.collegeId,collegeId))).limit(1);
 if(!member)throw Error("Learner not found in this college");
 const portfolio=await db.select({
  id:placementApplications.id,jobId:placementApplications.jobId,
  job:placementJobs.title,role:placementJobRoleOptions.title,
  status:placementApplications.status,
  submittedAt:placementApplications.submittedAt,
 }).from(placementApplications)
  .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
   eq(placementJobs.collegeId,collegeId)))
  .innerJoin(placementJobRoleOptions,
   eq(placementJobRoleOptions.id,placementApplications.roleOptionId))
  .where(eq(placementApplications.membershipId,membershipId))
  .orderBy(desc(placementApplications.submittedAt),desc(placementApplications.id))
  .limit(501);
 const applications=portfolio.slice(0,500);
 if(!applications.length)
  return {membershipId,applications:[],hasMore:false};
 const upcoming=await db.select({
  applicationId:placementRoundCandidateSlots.applicationId,
  slotId:placementRoundCandidateSlots.id,
  startsAt:placementRoundCandidateSlots.startsAt,
  endsAt:placementRoundCandidateSlots.endsAt,
  room:placementRoundCandidateSlots.room,
  round:placementJobRounds.name,
 }).from(placementRoundCandidateSlots)
  .innerJoin(placementApplications,and(
   eq(placementApplications.id,placementRoundCandidateSlots.applicationId),
   eq(placementApplications.membershipId,membershipId)))
  .innerJoin(placementJobs,and(
   eq(placementJobs.id,placementApplications.jobId),
   eq(placementJobs.collegeId,collegeId),
   eq(placementJobs.id,placementRoundCandidateSlots.jobId)))
  .innerJoin(placementJobRounds,and(
   eq(placementJobRounds.id,placementRoundCandidateSlots.roundId),
   eq(placementJobRounds.jobId,placementJobs.id),
   eq(placementJobRounds.kind,"INTERVIEW")))
  .where(and(
   inArray(placementRoundCandidateSlots.applicationId,applications.map(row=>row.id)),
   eq(placementRoundCandidateSlots.status,"BOOKED"),
   gt(placementRoundCandidateSlots.startsAt,new Date())))
  .orderBy(asc(placementRoundCandidateSlots.startsAt),asc(placementRoundCandidateSlots.id))
  .limit(501);
 const nextByApplication=new Map<string,(typeof upcoming)[number]>();
 for(const slot of upcoming)if(slot.applicationId&&!nextByApplication.has(slot.applicationId))
  nextByApplication.set(slot.applicationId,slot);
 return {
  membershipId,hasMore:portfolio.length>500,upcomingTruncated:upcoming.length>500,
  applications:applications.map(row=>({
   ...row,
   nextInterview:nextByApplication.get(row.id)??null,
  })),
 };
}

/** History page is 0-based for the backend-compatible status-history reader.
 * Every date tie is ordered by immutable row UUID; pages preserve ASC legacy
 * sequence without silently truncating after the first hundred events. */
export async function getCollegeApplicationDetail(
 ctx:RequestContext,job:unknown,id:unknown,rawHistoryPage:unknown=0,
){
 const historyPage=z.coerce.number().int().min(0).max(100000).parse(rawHistoryPage);
 const {application,jobId,collegeId}=await scoped(ctx,job,id);
 const learnerPortfolio=await getCollegeLearnerPlacementSummary(ctx,application.membershipId);
 const db=getDb();
 const [screening,history,stage,notes,rounds,offers]=await Promise.all([
  db.select().from(placementApplicationScreenings)
    .where(eq(placementApplicationScreenings.applicationId,application.id)).limit(1),
  db.select({id:placementApplicationStatusHistory.id,from:placementApplicationStatusHistory.fromStatus,
    to:placementApplicationStatusHistory.toStatus,reason:placementApplicationStatusHistory.reason,
    when:placementApplicationStatusHistory.createdAt,
    actorName:users.displayName})
    .from(placementApplicationStatusHistory)
    .leftJoin(users,eq(users.id,placementApplicationStatusHistory.actorUserId))
    .where(eq(placementApplicationStatusHistory.applicationId,application.id))
    .orderBy(asc(placementApplicationStatusHistory.createdAt),
      asc(placementApplicationStatusHistory.id))
    .limit(101).offset(historyPage*100),
  db.select().from(placementCollegeApplicationStages)
    .where(and(eq(placementCollegeApplicationStages.jobId,jobId),
      eq(placementCollegeApplicationStages.applicationId,application.id))).limit(1),
  db.select({id:placementApplicationNotes.id,body:placementApplicationNotes.body,
    createdAt:placementApplicationNotes.createdAt,
    authorUserId:placementApplicationNotes.authorUserId})
    .from(placementApplicationNotes)
    .where(and(eq(placementApplicationNotes.applicationId,application.id),
      eq(placementApplicationNotes.side,"TPO")))
    .orderBy(desc(placementApplicationNotes.createdAt),
      desc(placementApplicationNotes.id)).limit(101),
  db.select({id:placementJobRounds.id,name:placementJobRounds.name,
    testUrl:placementJobRounds.testUrl,scheduledAt:placementJobRounds.scheduledAt})
    .from(placementJobRounds).where(and(eq(placementJobRounds.jobId,jobId),
      eq(placementJobRounds.kind,"ASSESSMENT"))).limit(20),
  db.select({id:placementOffers.id,status:placementOffers.status,
    issuedAt:placementOffers.issuedAt,offerLetterUrl:placementOffers.offerLetterUrl,
    offerLetterAttachedAt:placementOffers.offerLetterAttachedAt})
    .from(placementOffers).where(eq(placementOffers.applicationId,application.id))
    .orderBy(asc(placementOffers.issuedAt)).limit(50),
 ]);
 // Only real applied, unsuperseded score_percent evidence is displayable.
 // There is no vNext automated matching score or partial-match algorithm.
 // Join the round to this authorized job so imported foreign results cannot
 // accidentally appear under the selected college's application.
 const [recordedScore] = await db.select({
   scorePercent:sql<number|null>`max(${placementRoundResults.scorePercent})::integer`,
 }).from(placementRoundResults)
  .innerJoin(placementJobRounds,and(
   eq(placementJobRounds.id,placementRoundResults.roundId),
   eq(placementJobRounds.jobId,jobId)))
  .where(and(
   eq(placementRoundResults.applicationId,application.id),
   eq(placementRoundResults.status,"APPLIED"),
   isNull(placementRoundResults.supersededAt),
  ));
 const assessmentScore=recordedScore?.scorePercent??null;
 const [privateAssessment,jobAssessment]=await Promise.all([
  db.select({assessmentUrl:placementApplicationPrivateArtifacts.assessmentUrl})
   .from(placementApplicationPrivateArtifacts)
   .where(eq(placementApplicationPrivateArtifacts.applicationId,application.id)).limit(1),
  db.select({posting:placementJobs.legacyPostingDetails}).from(placementJobs)
   .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId)))
   .limit(1),
 ]);
 const jobAssessmentLink=jobAssessment[0]?.posting?.assessmentUrl??null;
 const assessmentLink=privateAssessment[0]?.assessmentUrl??jobAssessmentLink;
 const [receiptRecord]=await db.select({snapshot:profileVerifications.submittedSnapshot})
   .from(profileVerifications).where(and(
    eq(profileVerifications.learnerMembershipId,application.membershipId),
    eq(profileVerifications.section,"EDUCATION"))).limit(1);
 const resumeReceipt=receiptRecord?verificationDocumentManifest(receiptRecord.snapshot)
   .find(doc=>doc.purpose==="RESUME"):null;
 // Do not expose an object key or signed URL. The linked receipt API performs
 // a separate authorization check and validates the CLEAN private object.
 const prefix=isSuperAdmin(ctx)?"/api/admin/verification":
   hasMembershipRole(ctx,"TPO")?"/api/tpo/verification":"/api/college/verification";
 const resumeUrl=resumeReceipt?
   prefix+"/"+encodeURIComponent(application.membershipId)+"/EDUCATION/documents/"+
   encodeURIComponent(resumeReceipt.receiptId)+
   (isSuperAdmin(ctx)?"?collegeId="+encodeURIComponent(await requireCollegePlacementAdmin(ctx)):"")
   :null;
 const [stageHistory,screeningHistory]=await Promise.all([
  stage[0]?db.select({from:placementCollegeApplicationStageHistory.fromStage,
    to:placementCollegeApplicationStageHistory.toStage,
    reason:placementCollegeApplicationStageHistory.reason,
    when:placementCollegeApplicationStageHistory.movedAt})
    .from(placementCollegeApplicationStageHistory)
    .where(eq(placementCollegeApplicationStageHistory.stageId,stage[0].id))
    .orderBy(asc(placementCollegeApplicationStageHistory.movedAt),
      asc(placementCollegeApplicationStageHistory.id)).limit(101):[],
  db.select({from:placementApplicationScreeningHistory.fromStatus,
   to:placementApplicationScreeningHistory.toStatus,
   reason:placementApplicationScreeningHistory.candidateMessage,
   when:placementApplicationScreeningHistory.createdAt})
   .from(placementApplicationScreeningHistory)
   .where(eq(placementApplicationScreeningHistory.applicationId,application.id))
   .orderBy(asc(placementApplicationScreeningHistory.createdAt),
     asc(placementApplicationScreeningHistory.id)).limit(101),
 ]);
 // Only resolve the audit actor after the application is college-scoped;
 // this cannot be used to enumerate unrelated user profiles.
 const [statusUpdatedBy]=application.statusUpdatedByUserId
  ?await db.select({name:users.displayName}).from(users)
    .where(eq(users.id,application.statusUpdatedByUserId)).limit(1)
  :[];
 const rejectionReason=stageHistory.filter(row=>row.to==="REJECTED").at(-1)?.reason??
    screeningHistory.filter(row=>row.to==="REJECTED").at(-1)?.reason??null;
 const latestNote=notes[0]??null;
 return {application:{...application,rejectionReason,
   statusUpdatedByName:statusUpdatedBy?.name??null},learnerPortfolio,
  screening:screening[0]??null,
  stage:stage[0]?.stage??null,stageHistory:stageHistory.slice(0,100),
  screeningHistory:screeningHistory.slice(0,100),
  history:history.slice(0,100),
  historyPagination:{page:historyPage,pageSize:100,hasMore:history.length>100,
   nextPage:history.length>100?historyPage+1:null},
  historyTruncated:history.length>100,
  stageHistoryHasMore:stageHistory.length>100,
  screeningHistoryHasMore:screeningHistory.length>100,
  notes:notes.slice(0,100),notesHasMore:notes.length>100,
  internalNotes:latestNote?.body??null,
  internalNoteVersion:latestNote?.id??null,
  offerLetterUrl:offers.at(-1)?.offerLetterUrl??null,
  rounds,offers,assessmentLink,jobAssessmentLink,
  scoring:{available:assessmentScore!==null,scorePercent:assessmentScore,
   partial:false,
   reason:assessmentScore!==null
    ?"Highest recorded score from applied assessment rounds; not an automated match score."
    :"No applied assessment round score is recorded. Automated match scoring is not enabled."},
  resume:{available:Boolean(resumeUrl),url:resumeUrl,
   reason:resumeUrl?"Open the verified resume through the authorized document route.":
    "A submitted verified private resume receipt is not available."}};
}
export async function appendCollegeApplicationNote(ctx:RequestContext,job:unknown,id:unknown,raw:unknown){
 const input=z.strictObject({body:z.string().trim().min(1).max(2000),
  amendsNoteId:z.uuid().optional()}).parse(raw);
 const {collegeId,application}=await scoped(ctx,job,id);
 const acting=await resolveActingCollege(ctx,"placements.manage");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId:acting.collegeId,organizationId:acting.organizationId,
  });
  const [parent]=await tx.select({id:placementApplications.id}).from(placementApplications)
   .where(and(eq(placementApplications.id,application.id),
    eq(placementApplications.jobId,application.jobId))).for("update").limit(1);
  if(!parent)throw Error("Application no longer belongs to the drive.");
  if(input.amendsNoteId){
   const [previous]=await tx.select({id:placementApplicationNotes.id}).from(placementApplicationNotes)
    .where(and(eq(placementApplicationNotes.id,input.amendsNoteId),
      eq(placementApplicationNotes.applicationId,parent.id),
      eq(placementApplicationNotes.side,"TPO"))).limit(1);
   if(!previous)throw Error("The original note is no longer available in this application.");
  }
  const [note]=await tx.insert(placementApplicationNotes).values({
   applicationId:application.id,side:"TPO",companyId:null,
   authorUserId:ctx.user.id,body:input.body,
  }).returning({id:placementApplicationNotes.id,createdAt:placementApplicationNotes.createdAt});
  if(!note)throw new Error("Application note was not created.");
  await tx.insert(activityEvents).values({
   organizationId:acting.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership?.id??null,
   module:"PLACEMENTS",eventType:"PLACEMENTS_COLLEGE_APPLICATION_NOTE_ADDED",
   subjectType:"placement_application",subjectId:application.id,
   summary:input.amendsNoteId?"Internal placement application note corrected":"Internal placement application note added",
   metadata:{jobId:application.jobId,noteId:note.id,amendsNoteId:input.amendsNoteId??null},
  });
  return {id:note.id,createdAt:note.createdAt};
 });
}

export async function attachCollegeApplicationOfferLetter(ctx:RequestContext,job:unknown,id:unknown,raw:unknown){
 const input=z.strictObject({
  offerId:z.uuid(),url:z.url().refine(v=>v.startsWith("https://"),"Use an HTTPS offer-letter link."),
  confirmed:z.literal(true),
 }).parse(raw);
 const {collegeId,application}=await scoped(ctx,job,id);
 const acting=await resolveActingCollege(ctx,"placements.manage");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId:acting.collegeId,organizationId:acting.organizationId,
  });
  const [parent]=await tx.select({id:placementApplications.id}).from(placementApplications)
   .where(and(eq(placementApplications.id,application.id),
    eq(placementApplications.jobId,application.jobId)))
   .for("share").limit(1);
  if(!parent)throw Error("Application no longer belongs to the selected drive.");
  const [offer]=await tx.select({id:placementOffers.id,status:placementOffers.status})
   .from(placementOffers).where(and(eq(placementOffers.id,input.offerId),
    eq(placementOffers.applicationId,parent.id))).for("update").limit(1);
  if(!offer||!["ISSUED","ACCEPTED"].includes(offer.status))
   throw Error("Only an issued or accepted offer can receive an offer letter.");
  const now=new Date();
  await tx.update(placementOffers).set({
   offerLetterUrl:input.url,offerLetterAttachedAt:now,offerLetterAttachedByUserId:ctx.user.id,
   updatedAt:now,
  }).where(eq(placementOffers.id,offer.id));
  await tx.insert(activityEvents).values({
   organizationId:acting.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership?.id??null,
   module:"PLACEMENTS",eventType:"PLACEMENTS_COLLEGE_OFFER_LETTER_ATTACHED",
   subjectType:"placement_offer",subjectId:offer.id,
   summary:"Offer letter attached to application",metadata:{jobId:application.jobId,applicationId:parent.id},
  });
  return {offerId:offer.id,attachedAt:now.toISOString(),message:"Offer letter attached"};
 });
}

/** Re-evaluate real persisted policy/evidence. This is not a fabricated
 * resume or skills score; historical decisions are never overwritten. */
export async function rescreenCollegeApplication(ctx:RequestContext,job:unknown,id:unknown,raw:unknown){
 z.strictObject({confirmed:z.literal(true)}).parse(raw);
 const {collegeId,jobId,application}=await scoped(ctx,job,id);
 const acting=await resolveActingCollege(ctx,"placements.manage");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId:acting.collegeId,organizationId:acting.organizationId,
  });
  const [parent]=await tx.select({id:placementApplications.id,status:placementApplications.status})
   .from(placementApplications).where(and(eq(placementApplications.id,application.id),
    eq(placementApplications.jobId,jobId))).for("share").limit(1);
  if(!parent||parent.status!=="SUBMITTED")
   throw Error("Only submitted applications can be re-screened.");
  const result=await evaluatePlacementEligibility(ctx,jobId,application.membershipId,tx);
  await recordActivityEventInTransaction(tx,ctx,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_APPLICATION_RESCREENED,
   organizationId:acting.organizationId,collegeId,
   subjectType:"placement_application",subjectId:application.id,
   summary:"Application re-screened using current eligibility evidence",
   metadata:{jobId,eligibilityStatus:result.status,
    checks:result.checks.map(check=>({criterion:check.criterion,status:check.status,
      actual:check.actual,required:check.required,detail:check.detail})),
    priorSubmissionUnchanged:true,screeningDecisionUnchanged:true},
  });
  return {status:result.status,checks:result.checks,
   override:result.override,reviewedAt:new Date().toISOString()};
 });
}


/** Global status reports must not query each application individually. The
 * IDs may be on several drives, but every returned row joins an application
 * and a job in the signed acting college. A missing/foreign ID yields no row,
 * not a cross-tenant existence oracle. Sorting is application, time, UUID. */
const batchHistoryInput=z.strictObject({
 applicationIds:z.array(z.string().uuid()).min(1).max(100)
  .refine(ids=>new Set(ids).size===ids.length),
 newStatus:z.string().trim().min(1).max(24).optional(),
 page:z.number().int().min(0).max(100000).default(0),
 size:z.number().int().min(1).max(500).default(100),
});
export async function listCollegeApplicationStatusHistoryBatch(
 ctx:RequestContext,raw:unknown,
){
 const input=batchHistoryInput.parse(raw);
 const collegeId=await requireCollegePlacementAdmin(ctx);
 const rows=await getDb().select({
  id:placementApplicationStatusHistory.id,
  applicationId:placementApplicationStatusHistory.applicationId,
  from:placementApplicationStatusHistory.fromStatus,
  to:placementApplicationStatusHistory.toStatus,
  reason:placementApplicationStatusHistory.reason,
  when:placementApplicationStatusHistory.createdAt,
 }).from(placementApplicationStatusHistory)
 .innerJoin(placementApplications,eq(
  placementApplications.id,placementApplicationStatusHistory.applicationId))
 .innerJoin(placementJobs,and(
  eq(placementJobs.id,placementApplications.jobId),
  eq(placementJobs.collegeId,collegeId)))
 .where(and(
  inArray(placementApplicationStatusHistory.applicationId,input.applicationIds),
  input.newStatus?eq(placementApplicationStatusHistory.toStatus,input.newStatus):undefined,
 ))
 .orderBy(asc(placementApplicationStatusHistory.applicationId),
   asc(placementApplicationStatusHistory.createdAt),
   asc(placementApplicationStatusHistory.id))
 .limit(input.size+1).offset(input.page*input.size);
 return {
  rows:rows.slice(0,input.size),
  page:input.page,pageSize:input.size,
  hasMore:rows.length>input.size,
 };
}
