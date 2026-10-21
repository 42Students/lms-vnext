import "server-only";
import {and,asc,desc,eq,gt,inArray,lt,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,inAppNotifications,membershipRoles,
 placementJobs,placementJobRoleOptions,placementJobEligibilityPolicies,placementRecruiterCollegeGrants,users} from "@/db/schema";
import {placementDriveChangeRequests,placementDriveChangeRequestMessages,prepareSafeDriveChangeJobPatch} from "@/db/schema/placement-drive-change-requests";
import {placementTpoMessageThreads,placementTpoMessages} from "@/db/schema/tpo-collaboration";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {getRecruiterPlacementWorkspace} from "./recruiter-workspace-service";
import {placementJobIdSchema} from "./validation";
import {driveChangeCommandSchema} from "./tpo-drive-change-request-model";

type Party="TPO"|"COMPANY";
async function scoped(context:RequestContext,rawJobId:unknown){
 const jobId=placementJobIdSchema.parse(rawJobId);
 if(context.membership&&(hasMembershipRole(context,"TPO")||hasMembershipRole(context,"COLLEGE_ADMIN"))){
  const collegeId=await requireTpoJobCollege(context);
  const [job]=await getDb().select({
   id:placementJobs.id,collegeId:placementJobs.collegeId,title:placementJobs.title,
   organizationId:colleges.organizationId,
   status:placementJobs.status,companyRelationshipId:placementJobs.companyRelationshipId,
  }).from(placementJobs).innerJoin(colleges,eq(colleges.id,placementJobs.collegeId)).where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
  if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  return {job,party:"TPO" as Party};
 }
 // Existing recruiter workspace performs its own company/grant/status checks.
 const existing=await getRecruiterPlacementWorkspace(context,jobId);
 const [job]=await getDb().select({
  id:placementJobs.id,collegeId:placementJobs.collegeId,title:placementJobs.title,
  organizationId:colleges.organizationId,
  status:placementJobs.status,companyRelationshipId:placementJobs.companyRelationshipId,
 }).from(placementJobs).innerJoin(colleges,eq(colleges.id,placementJobs.collegeId)).where(and(eq(placementJobs.id,existing.job.id),
  eq(placementJobs.collegeId,existing.college.id))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 return {job,party:"COMPANY" as Party};
}
async function recipients(tx:Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
 job:{collegeId:string;companyRelationshipId:string},party:Party){
 if(party==="TPO"){
  const members=await tx.select({userId:collegeMemberships.userId}).from(collegeMemberships)
   .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(eq(collegeMemberships.collegeId,job.collegeId),eq(collegeMemberships.status,"ACTIVE"),
    eq(membershipRoles.role,"TPO"),eq(users.platformStatus,"ACTIVE")));
  return [...new Set(members.map(r=>r.userId))];
 }
 const grants=await tx.select({userId:placementRecruiterCollegeGrants.recruiterUserId})
  .from(placementRecruiterCollegeGrants)
  .innerJoin(users,eq(users.id,placementRecruiterCollegeGrants.recruiterUserId))
  .where(and(eq(placementRecruiterCollegeGrants.companyRelationshipId,job.companyRelationshipId),
   eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
   eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
   gt(placementRecruiterCollegeGrants.validUntil,new Date()),
   eq(users.platformStatus,"ACTIVE")));
 return [...new Set(grants.map(r=>r.userId))];
}
async function announce(tx:Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
 context:RequestContext,job:{id:string;collegeId:string;companyRelationshipId:string;organizationId:string;title:string},
 target:Party,kind:string,requestId:string,body:string){
 const [event]=await tx.insert(activityEvents).values({
  organizationId:job.organizationId,collegeId:job.collegeId,
  actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
  module:"PLACEMENTS",eventType:kind,subjectType:"placement_drive_change",
  subjectId:requestId,summary:body,metadata:{jobId:job.id,requestId},
 }).returning({id:activityEvents.id});
 if(!event)throw Error("Change-request audit could not be saved.");
 const ids=(await recipients(tx,job,target)).filter(id=>id!==context.user.id);
 const href=target==="TPO"?"/tpo/placements/jobs/"+job.id+"/change-requests":
  "/recruiter/drives/"+job.id+"/change-requests";
 for(let i=0;i<ids.length;i+=200){
  await tx.insert(inAppNotifications).values(ids.slice(i,i+200).map(userId=>({
   userId,eventId:event.id,title:"Drive change request",body,actionHref:href,
  }))).onConflictDoNothing();
 }
 // Mirror each state change to the canonical recruiter/placement Discussion.
 // System lines are already read and never claim external delivery.
 const recruiterId=target==="TPO"?context.user.id:(await recipients(tx,job,"COMPANY")).sort()[0];
 if(recruiterId){
  await tx.insert(placementTpoMessageThreads).values({
   collegeId:job.collegeId,recruiterUserId:recruiterId,jobId:job.id,
  }).onConflictDoNothing();
  const [thread]=await tx.select({id:placementTpoMessageThreads.id})
   .from(placementTpoMessageThreads).where(and(
    eq(placementTpoMessageThreads.collegeId,job.collegeId),
    eq(placementTpoMessageThreads.recruiterUserId,recruiterId),
    eq(placementTpoMessageThreads.jobId,job.id))).limit(1);
  if(thread){
   const now=new Date();
   await tx.insert(placementTpoMessages).values({
    threadId:thread.id,senderType:target==="TPO"?"RECRUITER":"TPO",
    senderUserId:context.user.id,body,readAt:now,createdAt:now,
   });
   await tx.update(placementTpoMessageThreads).set({lastMessageAt:now})
    .where(eq(placementTpoMessageThreads.id,thread.id));
  }
 }
}
const FIELD_LABELS:Record<string,string>={DEADLINE:"Application deadline",PAY:"Pay / package",
 ELIGIBILITY:"Eligibility",LOCATION:"Location",ROUNDS:"Interview rounds",OTHER:"Other",
 ROLE_TITLE:"Role title",DESCRIPTION:"Description",JOB_TYPE:"Job type",WORK_MODE:"Mode",
 CTC:"CTC",STIPEND:"Stipend",MIN_CGPA:"Minimum CGPA",BRANCHES:"Branches"};
/** Apply a field-specific answer/acceptance while the job and request are locked.
 * Legacy answers change the drive too; the request must never say ACCEPTED
 * without a committed job version and an applied receipt.
 */
async function applyDriveChangeField(
 tx:Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
 job:typeof placementJobs.$inferSelect,
 field:string,valueInput:string,actorId:string,now:Date,
){
 const value=valueInput.trim();
 const changes:Partial<typeof placementJobs.$inferInsert>={};
 let roleChange:Partial<typeof placementJobRoleOptions.$inferInsert>|null=null;
 let cgpaHundredths:number|null=null;
 const roles=await tx.select().from(placementJobRoleOptions)
  .where(and(eq(placementJobRoleOptions.jobId,job.id),
   eq(placementJobRoleOptions.status,"ACTIVE"))).for("update");
 const requireSingleRole=()=>{
  if(roles.length!==1)throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  return roles[0];
 };
 if(field==="DEADLINE"||field==="LOCATION"){
  const patch=prepareSafeDriveChangeJobPatch({
   mode:"SUGGEST",field,legacyField:null,proposedValue:value,
  },now);
  if(!patch)throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  if(patch.field==="DEADLINE")changes.applicationDeadline=patch.changes.applicationDeadline;
  else changes.locations=patch.changes.locations;
 }else if(field==="ROLE_TITLE"){
  if(value.length<3||value.length>100)throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  requireSingleRole();
  changes.title=value;
  roleChange={title:value};
 }else if(field==="DESCRIPTION"){
  if(value.length<2||value.length>2000)throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  changes.description=value;
 }else if(field==="JOB_TYPE"){
  if(!["FULL_TIME","INTERNSHIP","CONTRACT"].includes(value))
   throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  requireSingleRole();
  const normalized=value as "FULL_TIME"|"INTERNSHIP"|"CONTRACT";
  changes.employmentType=normalized;
  roleChange={employmentType:normalized};
 }else if(field==="WORK_MODE"||field==="MODE"){
  if(!["ONSITE","HYBRID","REMOTE"].includes(value))
   throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  requireSingleRole();
  const normalized=value as "ONSITE"|"HYBRID"|"REMOTE";
  changes.workMode=normalized;
  roleChange={workMode:normalized};
 }else if(field==="CTC"||field==="STIPEND"){
  requireSingleRole();
  if(!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)||
   !Number.isFinite(Number(value))||Number(value)<0||
   (field==="CTC"&&Number(value)>1000)||
   (field==="STIPEND"&&Number(value)>2147483647))
   throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  if(field==="CTC"){
   changes.ctcLpa=Number(value).toFixed(2);
   changes.minimumAnnualCtcInr=Math.round(Number(value)*100000);
   roleChange={ctcLpa:Number(value).toFixed(4),
    minimumAnnualCtcInr:Math.round(Number(value)*100000)};
  }else{
   changes.stipendPerMonthInr=Math.round(Number(value));
   roleChange={stipendPerMonthInr:Number(value).toFixed(2)};
  }
 }else if(field==="MIN_CGPA"){
  if(!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)||
   Number(value)>10)throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  cgpaHundredths=Math.round(Number(value)*100);
 }else if(field==="BRANCHES"){
  const branches=value.split(",").map(x=>x.trim()).filter(Boolean);
  if(!branches.length||branches.length>100||
   branches.some(x=>x.length>100)||
   new Set(branches.map(x=>x.toLowerCase())).size!==branches.length)
   throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  changes.eligibleBranches=branches;
 }else{
  // Broad PAY/ELIGIBILITY, ROUNDS and OTHER have no unambiguous job patch.
  // Never claim that an edit was applied when its backing policy cannot be changed.
  throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
 }
 if(roleChange)await tx.update(placementJobRoleOptions)
  .set({...roleChange,updatedAt:now})
  .where(eq(placementJobRoleOptions.id,requireSingleRole().id));
 if(cgpaHundredths!==null){
  await tx.insert(placementJobEligibilityPolicies).values({
   jobId:job.id,minCgpaHundredths:cgpaHundredths,updatedByUserId:actorId,
  }).onConflictDoUpdate({target:placementJobEligibilityPolicies.jobId,
   set:{minCgpaHundredths:cgpaHundredths,updatedByUserId:actorId,updatedAt:now}});
 }
 const [patched]=await tx.update(placementJobs).set({
  ...changes,version:sql`${placementJobs.version} + 1`,updatedAt:now,
 }).where(and(eq(placementJobs.id,job.id),eq(placementJobs.collegeId,job.collegeId),
  eq(placementJobs.version,job.version))).returning({version:placementJobs.version});
 if(!patched)throw new PlacementsServiceError("PLACEMENT_REQUEST_STALE");
 return patched.version;
}

export async function getDriveChangeRequests(context:RequestContext,jobId:unknown,cursor?:string|null){
 const {job,party}=await scoped(context,jobId);
 const storageReady=true; // registered in 0114
 if(!storageReady)return {job,party,storageReady,requests:[],
  pendingMessage:"Company change requests are pending database migration registration."};
 const [at,id]=cursor?.split("|")??[];
 const date=at?new Date(at):null;
 if(cursor&&(!date||!Number.isFinite(date.getTime())||!id||
  !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)))
  throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT");
 const where=and(eq(placementDriveChangeRequests.jobId,job.id),
  date&&id?or(lt(placementDriveChangeRequests.createdAt,date),
   and(eq(placementDriveChangeRequests.createdAt,date),lt(placementDriveChangeRequests.id,id))):undefined);
 const [all,total]=await Promise.all([
  getDb().select().from(placementDriveChangeRequests).where(where)
   .orderBy(desc(placementDriveChangeRequests.createdAt),desc(placementDriveChangeRequests.id)).limit(101),
  getDb().select({count:sql<number>`count(*)::int`}).from(placementDriveChangeRequests)
   .where(eq(placementDriveChangeRequests.jobId,job.id)),
 ]);
 const requests=all.slice(0,100);
 const messages=requests.length?await getDb().select().from(placementDriveChangeRequestMessages)
  .where(inArray(placementDriveChangeRequestMessages.requestId,requests.map(r=>r.id)))
  .orderBy(asc(placementDriveChangeRequestMessages.sentAt)):[];
 const authors=requests.length?await getDb().select({id:users.id,name:users.displayName})
  .from(users).where(inArray(users.id,[...new Set(requests.map(r=>r.createdByUserId))])):[];
 const names=new Map(authors.map(r=>[r.id,r.name]));
 const grouped=new Map<string,typeof messages>();
 for(const message of messages){
  const items=grouped.get(message.requestId)??[];
  items.push(message);grouped.set(message.requestId,items);
 }
 const last=requests.at(-1);
 return {job,party,storageReady,pendingMessage:null,totalCount:Number(total[0]?.count??0),
  hasMore:all.length>100,nextCursor:all.length>100&&last?last.createdAt.toISOString()+"|"+last.id:null,
  requests:requests.map(r=>({
   ...r,createdAt:r.createdAt.toISOString(),updatedAt:r.updatedAt.toISOString(),
   decidedAt:r.decidedAt?.toISOString()??null,
   resolvedAt:(r.resolvedAt??r.decidedAt)?.toISOString()??null,
   createdByName:names.get(r.createdByUserId)??null,
   fieldLabel:FIELD_LABELS[r.legacyField??r.field]??FIELD_LABELS[r.field]??"Other",
   kind:r.mode==="SUGGEST"?"PROPOSE":"ASK",
   direction:r.proposerParty==="TPO"?"COLLEGE_TO_COMPANY":"COMPANY_TO_COLLEGE",
   answerValue:r.answerValue??(r.status==="ANSWERED"?r.decisionNote:null),
   replyText:r.replyText??(r.status==="DECLINED"?r.decisionNote:null),
   currentValue:r.currentValue, // Null means no imported baseline was saved.
   messages:(grouped.get(r.id)??[]).map(m=>({...m,sentAt:m.sentAt.toISOString()})),
  }))};
}
export async function mutateDriveChangeRequest(context:RequestContext,rawJobId:unknown,raw:unknown){
 const {job,party}=await scoped(context,rawJobId);
 const input=driveChangeCommandSchema.parse(raw);
 return getDb().transaction(async tx=>{
  // A job-first exclusive lock serializes create/dedupe and decision transitions.
  // Withdrawing remains legal even after an otherwise read-only drive has ended.
  const [lockedJob]=await tx.select().from(placementJobs)
   .where(and(eq(placementJobs.id,job.id),eq(placementJobs.collegeId,job.collegeId)))
   .for("update").limit(1);
  if(!lockedJob)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  if(input.action!=="WITHDRAW"&&(lockedJob.status==="ARCHIVED"||lockedJob.status==="CANCELLED"))
   throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
  if(input.action==="CREATE"){
   const target:Party=party==="TPO"?"COMPANY":"TPO";
   const mode=input.field==="OTHER"?"ASK":input.mode==="PROPOSE"?"SUGGEST":input.mode;
   const canonicalField=({
    ROLE_TITLE:"OTHER",DESCRIPTION:"OTHER",JOB_TYPE:"OTHER",WORK_MODE:"OTHER",
    CTC:"PAY",STIPEND:"PAY",MIN_CGPA:"ELIGIBILITY",BRANCHES:"ELIGIBILITY",
   } as Record<string,string>)[input.field]??input.field;
   if(input.field!=="OTHER"){
    const [duplicate]=await tx.select({id:placementDriveChangeRequests.id})
     .from(placementDriveChangeRequests).where(and(
      eq(placementDriveChangeRequests.jobId,job.id),
      eq(placementDriveChangeRequests.proposerParty,party),
      eq(placementDriveChangeRequests.field,canonicalField),
      eq(placementDriveChangeRequests.status,"OPEN"),
      eq(placementDriveChangeRequests.legacyField,input.field))).limit(1);
    if(duplicate)throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT");
   }
   if(mode==="SUGGEST"&&["PAY","CTC","STIPEND"].includes(input.field)){
    const roleCounts=await tx.select({total:sql<number>`count(*)::integer`.mapWith(Number)})
     .from(placementJobRoleOptions).where(and(
      eq(placementJobRoleOptions.jobId,job.id),
      eq(placementJobRoleOptions.status,"ACTIVE")));
    if((roleCounts[0]?.total??0)>1)
     throw new Error("This drive has multiple roles. Please ask for the package instead.");
   }
   if(mode==="SUGGEST"&&input.field==="LOCATION"&&
    lockedJob.locations.join(", ").trim().toLocaleLowerCase("en-IN")===
     input.proposedValue.trim().toLocaleLowerCase("en-IN"))
    throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT");
   if(mode==="SUGGEST"&&input.field==="DEADLINE"){
    const patch=prepareSafeDriveChangeJobPatch({mode:"SUGGEST",field:"DEADLINE",
     legacyField:null,proposedValue:input.proposedValue});
    if(!patch||patch.field!=="DEADLINE")
     throw new PlacementsServiceError("PLACEMENT_JOB_INVALID_DEADLINE");
    if(lockedJob.applicationDeadline?.getTime()===patch.changes.applicationDeadline.getTime())
     throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT");
   }
   if(target==="COMPANY"&&(await recipients(tx,job,"COMPANY")).length===0)
    throw new PlacementsServiceError("PLACEMENT_RECRUITER_RELATIONSHIP_INACTIVE");
   // The schema requires both pieces of text even for ASK/OTHER. For an
   // ASK, proposedValue stores the question, NOT a replacement or an applied
   // value. The optional rationale is never silently promoted to an edit.
   const questionOrValue=input.field==="OTHER"?(input.reason.trim()||input.proposedValue.trim()):
     (input.proposedValue.trim()||input.reason.trim());
   const proposedValue=mode==="SUGGEST"&&["CTC","STIPEND","MIN_CGPA","PAY"].includes(input.field)
    ?Number(input.proposedValue).toFixed(2):questionOrValue;
   const reason=input.reason.trim().length>=3?input.reason.trim():"No reason provided";
   const [created]=await tx.insert(placementDriveChangeRequests).values({
    jobId:job.id,createdByUserId:context.user.id,proposerParty:party,targetParty:target,
    mode,field:canonicalField,legacyField:input.field,
    proposedValue,reason,
   }).returning();
   await announce(tx,context,job,target,"PLACEMENTS_DRIVE_CHANGE_REQUEST_CREATED",created.id,
    "New "+input.field.toLowerCase()+" change request for "+job.title+".");
   return {id:created.id,status:created.status};
  }
  const [request]=await tx.select().from(placementDriveChangeRequests)
   .where(and(eq(placementDriveChangeRequests.id,input.requestId),
    eq(placementDriveChangeRequests.jobId,job.id))).for("update").limit(1);
  if(!request)throw new PlacementsServiceError("PLACEMENT_REQUEST_NOT_FOUND");
  if(input.action==="COMMENT"){
   if(request.status==="WITHDRAWN")throw new Error("Withdrawn requests cannot receive messages.");
   const [message]=await tx.insert(placementDriveChangeRequestMessages).values({
    requestId:request.id,senderUserId:context.user.id,senderParty:party,body:input.body,
   }).returning({id:placementDriveChangeRequestMessages.id});
   await announce(tx,context,job,party==="TPO"?"COMPANY":"TPO",
    "PLACEMENTS_DRIVE_CHANGE_COMMENTED",request.id,
    "New reply in the "+request.field.toLowerCase()+" change request for "+job.title+".");
   return {id:message.id,status:"COMMENTED"};
  }
  if(request.status!=="OPEN")throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT");
  if(request.updatedAt.toISOString()!==input.expectedUpdatedAt)
   throw new PlacementsServiceError("PLACEMENT_REQUEST_STALE");
  if(input.action==="ACCEPT"&&(request.mode!=="SUGGEST"||
   request.legacyField==="OTHER"||(!request.legacyField&&request.field==="OTHER")))
   throw new Error("This one asks for a detail: answer it instead");
  if(input.action==="ANSWER"&&request.mode!=="ASK")
   throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  if(input.action==="WITHDRAW"){
   if(request.proposerParty!==party||request.createdByUserId!==context.user.id)
    throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  }else if(request.targetParty!==party)
   throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  const now=new Date();
  const field=request.legacyField??request.field;
  // A typed answer changes the backing job just like an accepted suggestion.
  // OTHER asks for free text only; it is never a silent job mutation.
  const shouldApply=input.action==="ACCEPT"||
   (input.action==="ANSWER"&&field!=="OTHER");
  const appliedVersion=shouldApply?await applyDriveChangeField(
   tx,lockedJob,field,input.action==="ACCEPT"?request.proposedValue:input.note,
   context.user.id,now,
  ):null;
  const status=input.action==="ACCEPT"?"ACCEPTED":
   input.action==="ANSWER"?"ANSWERED":input.action==="DECLINE"?"DECLINED":"WITHDRAWN";
  const [updated]=await tx.update(placementDriveChangeRequests).set({
   status,decisionNote:input.note,
   ...(input.action==="ANSWER"?{answerValue:input.note}:{}),
   ...(input.action==="ACCEPT"?{
    appliedAt:now,appliedByUserId:context.user.id,appliedJobVersion:appliedVersion,
   }:{}),
   ...(input.action==="DECLINE"?{replyText:input.note}:{}),
   decidedByUserId:context.user.id,decidedAt:now,resolvedAt:now,
   updatedAt:now,
  }).where(and(eq(placementDriveChangeRequests.id,request.id),
   eq(placementDriveChangeRequests.status,"OPEN"))).returning({id:placementDriveChangeRequests.id});
  if(!updated)throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT");
  const [remaining]=party==="COMPANY"&&request.proposerParty==="TPO"?
   await tx.select({id:placementDriveChangeRequests.id}).from(placementDriveChangeRequests)
    .where(and(eq(placementDriveChangeRequests.jobId,job.id),
     eq(placementDriveChangeRequests.proposerParty,"TPO"),
     eq(placementDriveChangeRequests.status,"OPEN"))).limit(1):[];
  const ready=party==="COMPANY"&&request.proposerParty==="TPO"&&!remaining;
  await announce(tx,context,job,party==="TPO"?"COMPANY":"TPO",
   ready?"PLACEMENTS_DRIVE_CHANGES_MADE":"PLACEMENTS_DRIVE_CHANGE_REQUEST_DECIDED",request.id,
   ready?"The company answered your change requests for "+job.title+"; ready to review again.":
    "Your change request about "+(request.legacyField??request.field).toLowerCase()+" was "+status.toLowerCase()+". "+input.note);
  return {id:updated.id,status};
 });
}
