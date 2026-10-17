import "server-only";
import {and,asc,desc,eq} from "drizzle-orm";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {evaluatePlacementEligibility} from "./eligibility-service";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,learnerProfiles,placementApplications,
 placementApplicationScreenings,placementApplicationScreeningHistory,
 placementApplicationStatusHistory,placementJobRoleOptions,placementJobs,
 placementJobRounds,placementOffers,users} from "@/db/schema";
import {placementApplicationNotes} from "@/db/schema/placement-application-notes";
import {placementCollegeApplicationStages,placementCollegeApplicationStageHistory}
 from "@/db/schema/placement-college-application-stages";
import type {RequestContext} from "@/modules/identity/context";
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
  source:placementApplications.channel,status:placementApplications.status,
  submittedAt:placementApplications.submittedAt,
  withdrawnAt:placementApplications.withdrawnAt,
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
export async function getCollegeApplicationDetail(ctx:RequestContext,job:unknown,id:unknown){
 const {application,jobId}=await scoped(ctx,job,id);
 const db=getDb();
 const [screening,history,stage,notes,rounds,offers]=await Promise.all([
  db.select().from(placementApplicationScreenings)
    .where(eq(placementApplicationScreenings.applicationId,application.id)).limit(1),
  db.select({id:placementApplicationStatusHistory.id,from:placementApplicationStatusHistory.fromStatus,
    to:placementApplicationStatusHistory.toStatus,reason:placementApplicationStatusHistory.reason,
    when:placementApplicationStatusHistory.createdAt})
    .from(placementApplicationStatusHistory)
    .where(eq(placementApplicationStatusHistory.applicationId,application.id))
    .orderBy(asc(placementApplicationStatusHistory.createdAt)).limit(100),
  db.select().from(placementCollegeApplicationStages)
    .where(and(eq(placementCollegeApplicationStages.jobId,jobId),
      eq(placementCollegeApplicationStages.applicationId,application.id))).limit(1),
  db.select({id:placementApplicationNotes.id,body:placementApplicationNotes.body,
    createdAt:placementApplicationNotes.createdAt})
    .from(placementApplicationNotes)
    .where(and(eq(placementApplicationNotes.applicationId,application.id),
      eq(placementApplicationNotes.side,"TPO")))
    .orderBy(desc(placementApplicationNotes.createdAt)).limit(100),
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
 const [stageHistory,screeningHistory]=await Promise.all([
  stage[0]?db.select({from:placementCollegeApplicationStageHistory.fromStage,
    to:placementCollegeApplicationStageHistory.toStage,
    reason:placementCollegeApplicationStageHistory.reason,
    when:placementCollegeApplicationStageHistory.movedAt})
    .from(placementCollegeApplicationStageHistory)
    .where(eq(placementCollegeApplicationStageHistory.stageId,stage[0].id))
    .orderBy(asc(placementCollegeApplicationStageHistory.movedAt)).limit(100):[],
  db.select({from:placementApplicationScreeningHistory.fromStatus,
   to:placementApplicationScreeningHistory.toStatus,
   reason:placementApplicationScreeningHistory.candidateMessage,
   when:placementApplicationScreeningHistory.createdAt})
   .from(placementApplicationScreeningHistory)
   .where(eq(placementApplicationScreeningHistory.applicationId,application.id))
   .orderBy(asc(placementApplicationScreeningHistory.createdAt)).limit(100),
 ]);
 return {application,screening:screening[0]??null,
  stage:stage[0]?.stage??null,stageHistory,screeningHistory,history,
  notes,rounds,offers,
  scoring:{available:false,reason:"No persisted screening score is available for this application."},
  resume:{available:false,reason:"A private resume receipt was not supplied by the application record."}};
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
  return {offerId:offer.id,attachedAt:now.toISOString()};
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
