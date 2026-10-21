import "server-only";
import { and, asc, desc, eq, exists, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { cohorts, collegeMemberships, departments, learnerProgramEnrollments, learnerProfiles, membershipRoles, programs, sectionEnrollments, sections, users } from "@/db/schema";
import { placementEligibilityDecisions } from "@/db/schema/placement-access";
import { placementBatchLifecycles, placementEligibilityEvents } from "@/db/schema/placement-batches";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import { placementTableExists } from "./staged-tables";
import { requirePlacementManageScope } from "./scope";
const uuid=z.string().uuid();
const pageSchema=z.coerce.number().int().min(1).max(100000).default(1);
export async function requireTpoBatchActor(ctx:RequestContext) {
 if(isSuperAdmin(ctx)){
  const scope=await resolveActingCollege(ctx,"placements.manage");
  requirePermission(ctx,"placements.manage",{collegeId:scope.collegeId,organizationId:scope.organizationId});
  return scope.collegeId;
 }
 const m=ctx.membership;
 if(!m||m.status!=="ACTIVE"||ctx.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.manage");
 const [persisted]=await getDb().select({id:collegeMemberships.id}).from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
  .where(and(eq(collegeMemberships.id,m.id),eq(collegeMemberships.collegeId,m.collegeId),
   eq(collegeMemberships.userId,ctx.user.id),eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))).limit(1);
 if(!persisted)throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(ctx,m.collegeId);
 requirePermission(ctx,"placements.manage",{collegeId:college.id,organizationId:college.organizationId});
 return college.id;
}
export async function listTpoBatches(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 const batches=await getDb().select({id:cohorts.id,name:cohorts.name,code:cohorts.code,status:cohorts.status,programId:programs.id,program:programs.name,departmentId:departments.id,department:departments.name,
  startYear:sql<number | null>`(select extract(year from ap.start_date)::int from academic_periods ap where ap.id = ${cohorts.startPeriodId})`,
  endYear:sql<number | null>`(select extract(year from ap.end_date)::int from academic_periods ap where ap.id = ${cohorts.expectedEndPeriodId})`})
 .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
 .innerJoin(departments,eq(departments.id,programs.departmentId))
 .where(eq(departments.collegeId,collegeId)).orderBy(asc(programs.name),asc(cohorts.name));
 const ready=await placementTableExists("placement_batch_lifecycles");
 const states=ready&&batches.length?await getDb().select().from(placementBatchLifecycles)
 .where(and(eq(placementBatchLifecycles.collegeId,collegeId),inArray(placementBatchLifecycles.cohortId,batches.map(b=>b.id)))):[];
 return {ready,readiness:ready?"READY" as const:"PLACEMENT_BATCH_MIGRATION_REQUIRED" as const,
  readinessMessage:ready?null:"Placement batch rules are unavailable until the college placement tables are deployed. Retry after the administrator completes setup.",
  batches:batches.map(batch=>{const state=states.find(r=>r.cohortId===batch.id);
 return {...batch,invitedAt:state?.invitedAt??null,finishedAt:state?.finishedAt??null,deadline:state?.registrationDeadline??null};})};
}
export async function getTpoBatch(ctx:RequestContext,rawId:unknown){
 const collegeId=await requireTpoBatchActor(ctx),id=uuid.parse(rawId);
 const [batch]=await getDb().select({id:cohorts.id,name:cohorts.name,code:cohorts.code,status:cohorts.status,program:programs.name,department:departments.name,
  startYear:sql<number|null>`(select extract(year from ap.start_date)::int from academic_periods ap where ap.id=${cohorts.startPeriodId})`,
  endYear:sql<number|null>`(select extract(year from ap.end_date)::int from academic_periods ap where ap.id=${cohorts.expectedEndPeriodId})`})
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
 return {batch,collegeId,ready,readiness:ready?"READY" as const:"PLACEMENT_BATCH_MIGRATION_REQUIRED" as const,
  readinessMessage:ready?null:"Placement batch lifecycle migration is not installed. Try again after setup.",
  lifecycle:lifecycle??null,decision};
}
export async function getTpoBatchStudents(ctx:RequestContext,rawId:unknown,rawPage:unknown=1,rawSearch:unknown="",onlyDirect=false) {
 const {batch,collegeId}=await getTpoBatch(ctx,rawId);const page=pageSchema.parse(rawPage);
 const search=z.string().trim().max(100).parse(rawSearch);
 const term="%"+search.replace(/[\\%_]/g,"\\$&")+"%";
 const filter=and(eq(learnerProgramEnrollments.cohortId,batch.id),eq(learnerProgramEnrollments.status,"ACTIVE"),
  eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
  onlyDirect?exists(getDb().select({id:placementEligibilityDecisions.scopeId}).from(placementEligibilityDecisions)
   .where(and(eq(placementEligibilityDecisions.collegeId,collegeId),
     eq(placementEligibilityDecisions.scopeType,"MEMBERSHIP"),
     eq(placementEligibilityDecisions.scopeId,collegeMemberships.id)))):undefined,
  search?or(ilike(users.displayName,term),ilike(learnerProfiles.rollNumber,term)):undefined);
 const roster=()=>getDb().select({membershipId:collegeMemberships.id,name:users.displayName,rollNumber:learnerProfiles.rollNumber,enrollmentId:learnerProgramEnrollments.id})
 .from(learnerProgramEnrollments).innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER"))).where(filter);
 const records=await roster().orderBy(asc(users.displayName),asc(collegeMemberships.id)).limit(26).offset((page-1)*25);
 const visible=records.slice(0,25),enrollmentIds=visible.map(r=>r.enrollmentId);
 const activeSections=enrollmentIds.length?await getDb().select({enrollmentId:sectionEnrollments.learnerEnrollmentId,sectionId:sections.id,sectionName:sections.name})
 .from(sectionEnrollments).innerJoin(sections,and(eq(sections.id,sectionEnrollments.sectionId),eq(sections.cohortId,batch.id),eq(sections.status,"ACTIVE")))
 .where(and(eq(sectionEnrollments.status,"ACTIVE"),inArray(sectionEnrollments.learnerEnrollmentId,enrollmentIds))):[];
 const scopeIds=[batch.id,...visible.map(r=>r.membershipId),...activeSections.map(r=>r.sectionId)];
 const decisions=await getDb().select({scopeType:placementEligibilityDecisions.scopeType,scopeId:placementEligibilityDecisions.scopeId,status:placementEligibilityDecisions.status,reason:placementEligibilityDecisions.reason,note:placementEligibilityDecisions.note,updatedAt:placementEligibilityDecisions.updatedAt})
 .from(placementEligibilityDecisions).where(and(eq(placementEligibilityDecisions.collegeId,collegeId),inArray(placementEligibilityDecisions.scopeId,scopeIds)));
 const find=(kind:string,id:string)=>decisions.find(d=>d.scopeType===kind&&d.scopeId===id);
 const students=visible.map(r=>{const direct=find("MEMBERSHIP",r.membershipId);
 const sectionsFor=activeSections.filter(s=>s.enrollmentId===r.enrollmentId);
 const section=sectionsFor.length===1?find("SECTION",sectionsFor[0].sectionId):undefined;
 const cohort=find("COHORT",batch.id);const winner=direct??(sectionsFor.length>1?undefined:(section??cohort));
 return {membershipId:r.membershipId,name:r.name??"Unnamed learner",rollNumber:r.rollNumber,
  className:sectionsFor.length===1?sectionsFor[0].sectionName:null,
  classId:sectionsFor.length===1?sectionsFor[0].sectionId:null,
  branch:batch.department,program:batch.program,
  decision:winner?.status??"NOT_DECIDED",
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
 const events=ready?await getDb().select({id:placementEligibilityEvents.id,actionId:placementEligibilityEvents.actionId,
  reversesActionId:placementEligibilityEvents.reversesActionId,kind:placementEligibilityEvents.eventKind,
  before:placementEligibilityEvents.beforeStatus,after:placementEligibilityEvents.afterStatus,
  occurredAt:placementEligibilityEvents.occurredAt,scopeType:placementEligibilityEvents.scopeType,
  scopeId:placementEligibilityEvents.scopeId, beforeReason:placementEligibilityEvents.beforeReason,
  afterReason:placementEligibilityEvents.afterReason, actorName:users.displayName})
 .from(placementEligibilityEvents)
 .leftJoin(users,eq(users.id,placementEligibilityEvents.actorUserId))
 .where(and(eq(placementEligibilityEvents.collegeId,collegeId),or(
  and(eq(placementEligibilityEvents.scopeType,"COHORT"),eq(placementEligibilityEvents.scopeId,batch.id)),
  and(eq(placementEligibilityEvents.scopeType,"SECTION"),sql`exists(select 1 from sections sc where sc.id=${placementEligibilityEvents.scopeId} and sc.cohort_id=${batch.id})`),
  and(eq(placementEligibilityEvents.scopeType,"MEMBERSHIP"),sql`exists(select 1 from learner_program_enrollments e where e.membership_id=${placementEligibilityEvents.scopeId} and e.cohort_id=${batch.id})`),
  )))
 .orderBy(desc(placementEligibilityEvents.sequence)).limit(100):[];
 return {batch,ready,readiness:ready?"READY" as const:"PLACEMENT_EVENTS_MIGRATION_REQUIRED" as const,events};
}
