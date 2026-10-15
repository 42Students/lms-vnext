import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { cohorts, collegeMemberships, departments, learnerProgramEnrollments, membershipRoles, programs, sectionEnrollments, sections, users } from "@/db/schema";
import { placementEligibilityDecisions } from "@/db/schema/placement-access";
import { placementBatchLifecycles, placementEligibilityEvents } from "@/db/schema/placement-batches";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { placementTableExists } from "./staged-tables";
import { requirePlacementManageScope } from "./scope";
import { buildBatchHistoryScope } from "./tpo-batch-history-scope-model";
const uuid=z.string().uuid();
const pageSchema=z.coerce.number().int().min(1).max(100000).default(1);
export async function requireTpoBatchActor(ctx:RequestContext) {
 const m=ctx.membership;
 if(!m||m.status!=="ACTIVE"||ctx.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.manage");
 const [persisted]=await getDb().select({id:collegeMemberships.id}).from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
  .where(and(eq(collegeMemberships.id,m.id),eq(collegeMemberships.collegeId,m.collegeId),
   eq(collegeMemberships.userId,ctx.user.id),eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))).limit(1);
 if(!persisted)throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(ctx,m.collegeId);
 requirePermission(ctx,"placements.manage",{collegeId:college.id,organizationId:college.organizationId});
 return college.id;
}
export async function listTpoBatches(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 const batches=await getDb().select({id:cohorts.id,name:cohorts.name,code:cohorts.code,status:cohorts.status,program:programs.name,department:departments.name})
 .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
 .innerJoin(departments,eq(departments.id,programs.departmentId))
 .where(eq(departments.collegeId,collegeId)).orderBy(asc(programs.name),asc(cohorts.name));
 const ready=await placementTableExists("placement_batch_lifecycles");
 const states=ready&&batches.length?await getDb().select().from(placementBatchLifecycles)
 .where(and(eq(placementBatchLifecycles.collegeId,collegeId),inArray(placementBatchLifecycles.cohortId,batches.map(b=>b.id)))):[];
 return {ready,batches:batches.map(batch=>{const state=states.find(r=>r.cohortId===batch.id);
 return {...batch,invitedAt:state?.invitedAt??null,finishedAt:state?.finishedAt??null,deadline:state?.registrationDeadline??null};})};
}
export async function getTpoBatch(ctx:RequestContext,rawId:unknown){
 const collegeId=await requireTpoBatchActor(ctx),id=uuid.parse(rawId);
 const [batch]=await getDb().select({id:cohorts.id,name:cohorts.name,code:cohorts.code,status:cohorts.status,program:programs.name,department:departments.name})
 .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId)).innerJoin(departments,eq(departments.id,programs.departmentId))
 .where(and(eq(cohorts.id,id),eq(departments.collegeId,collegeId))).limit(1);
 if(!batch)throw new AuthorizationError("placements.manage");
 const ready=await placementTableExists("placement_batch_lifecycles");
 const [lifecycle]=ready?await getDb().select().from(placementBatchLifecycles)
 .where(and(eq(placementBatchLifecycles.cohortId,id),eq(placementBatchLifecycles.collegeId,collegeId))).limit(1):[];
 const [stored]=await getDb().select({status:placementEligibilityDecisions.status,
   reason:placementEligibilityDecisions.reason,note:placementEligibilityDecisions.note,
   updatedAt:placementEligibilityDecisions.updatedAt})
  .from(placementEligibilityDecisions)
  .where(and(eq(placementEligibilityDecisions.collegeId,collegeId),
    eq(placementEligibilityDecisions.scopeType,"COHORT"),eq(placementEligibilityDecisions.scopeId,id))).limit(1);
 const decision={status:stored?.status??"NOT_DECIDED",reason:stored?.reason??null,
  note:stored?.note??null,expectedVersion:stored?.updatedAt.toISOString()??"none"};
 return {batch,collegeId,ready,lifecycle:lifecycle??null,decision};
}
export async function getTpoBatchStudents(ctx:RequestContext,rawId:unknown,rawPage:unknown=1) {
 const {batch,collegeId}=await getTpoBatch(ctx,rawId);const page=pageSchema.parse(rawPage);
 const filter=and(eq(learnerProgramEnrollments.cohortId,batch.id),eq(learnerProgramEnrollments.status,"ACTIVE"),
  eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"));
 const roster=()=>getDb().select({membershipId:collegeMemberships.id,name:users.displayName,enrollmentId:learnerProgramEnrollments.id})
 .from(learnerProgramEnrollments).innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER"))).where(filter);
 const records=await roster().orderBy(asc(users.displayName),asc(collegeMemberships.id)).limit(26).offset((page-1)*25);
 const visible=records.slice(0,25),enrollmentIds=visible.map(r=>r.enrollmentId);
 const activeSections=enrollmentIds.length?await getDb().select({enrollmentId:sectionEnrollments.learnerEnrollmentId,sectionId:sections.id})
 .from(sectionEnrollments).innerJoin(sections,and(eq(sections.id,sectionEnrollments.sectionId),eq(sections.cohortId,batch.id),eq(sections.status,"ACTIVE")))
 .where(and(eq(sectionEnrollments.status,"ACTIVE"),inArray(sectionEnrollments.learnerEnrollmentId,enrollmentIds))):[];
 const scopeIds=[batch.id,...visible.map(r=>r.membershipId),...activeSections.map(r=>r.sectionId)];
 const decisions=await getDb().select({scopeType:placementEligibilityDecisions.scopeType,scopeId:placementEligibilityDecisions.scopeId,status:placementEligibilityDecisions.status,reason:placementEligibilityDecisions.reason,note:placementEligibilityDecisions.note,updatedAt:placementEligibilityDecisions.updatedAt})
 .from(placementEligibilityDecisions).where(and(eq(placementEligibilityDecisions.collegeId,collegeId),inArray(placementEligibilityDecisions.scopeId,scopeIds)));
 const find=(kind:string,id:string)=>decisions.find(d=>d.scopeType===kind&&d.scopeId===id);
 const students=visible.map(r=>{const direct=find("MEMBERSHIP",r.membershipId);
 const sectionsFor=activeSections.filter(s=>s.enrollmentId===r.enrollmentId);
 const section=sectionsFor.length===1?find("SECTION",sectionsFor[0].sectionId):undefined;
 const cohort=find("COHORT",batch.id);const winner=sectionsFor.length>1?undefined:(direct??section??cohort);
 return {membershipId:r.membershipId,name:r.name??"Unnamed learner",decision:winner?.status??"NOT_DECIDED",
  source:!winner?"NONE":winner===direct?"LEARNER":winner===section?"CLASS":"BATCH",
  reason:winner?.reason??null,ambiguous:sectionsFor.length>1,
  direct:direct&&["ELIGIBLE","INELIGIBLE"].includes(direct.status)
   ?{status:direct.status as "ELIGIBLE"|"INELIGIBLE",reason:direct.reason,note:direct.note,updatedAt:direct.updatedAt.toISOString()}
   :{status:null,reason:null,note:null,updatedAt:null},
 };});
 return {batch,students,page,hasMore:records.length>25};
}
export async function listTpoBatchHistory(ctx:RequestContext,rawId:unknown){
 const {batch,collegeId}=await getTpoBatch(ctx,rawId);
 const ready=await placementTableExists("placement_eligibility_events");
 if(!ready)return {batch,ready:false,events:[],limited:false,currentRosterOnly:true};
 const members=await getDb().select({id:learnerProgramEnrollments.membershipId})
  .from(learnerProgramEnrollments)
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
   eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(learnerProgramEnrollments.cohortId,batch.id),
   eq(learnerProgramEnrollments.status,"ACTIVE")))
  .orderBy(asc(learnerProgramEnrollments.membershipId)).limit(501);
 const classes=await getDb().select({id:sections.id}).from(sections)
  .where(and(eq(sections.cohortId,batch.id),eq(sections.status,"ACTIVE"))).limit(501);
 const scope=buildBatchHistoryScope(batch.id,members.map(m=>m.id),classes.map(c=>c.id));
 const found=await getDb().select({
  id:placementEligibilityEvents.id,actionId:placementEligibilityEvents.actionId,
  reversesActionId:placementEligibilityEvents.reversesActionId,kind:placementEligibilityEvents.eventKind,
  before:placementEligibilityEvents.beforeStatus,after:placementEligibilityEvents.afterStatus,
  occurredAt:placementEligibilityEvents.occurredAt,scopeType:placementEligibilityEvents.scopeType,
  scopeId:placementEligibilityEvents.scopeId,
 }).from(placementEligibilityEvents)
  .where(and(eq(placementEligibilityEvents.collegeId,collegeId),
   inArray(placementEligibilityEvents.scopeId,scope.ids)))
  .orderBy(desc(placementEligibilityEvents.sequence)).limit(101);
 return {batch,ready:true,events:found.slice(0,100),
  limited:scope.limited||classes.length>500||found.length>100,
  currentRosterOnly:true};
}
