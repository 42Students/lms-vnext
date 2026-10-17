import "server-only";
import {and,asc,countDistinct,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProgramEnrollments,sectionEnrollments,sections,users} from "@/db/schema";
import {placementEligibilityDecisions} from "@/db/schema/placement-access";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoBatch} from "./tpo-batch-workspace-read-service";

/** Exact batch ancestry before returning a class-level decision or count. */
export async function listTpoBatchClassesForDecisions(context:RequestContext,batchId:string){
 const {batch,collegeId,decision,lifecycle}=await getTpoBatch(context,batchId);
 const db=getDb();
 const rows=await db.select({
  id:sections.id,name:sections.name,code:sections.code,status:sections.status,
  students:countDistinct(collegeMemberships.id),
 }).from(sections)
 .leftJoin(sectionEnrollments,and(eq(sectionEnrollments.sectionId,sections.id),eq(sectionEnrollments.status,"ACTIVE")))
 .leftJoin(learnerProgramEnrollments,and(eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId),
   eq(learnerProgramEnrollments.cohortId,batch.id),eq(learnerProgramEnrollments.status,"ACTIVE")))
 .leftJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
   eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
 .leftJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
 .where(and(eq(sections.cohortId,batch.id),eq(sections.status,"ACTIVE")))
 .groupBy(sections.id,sections.name,sections.code,sections.status)
 .orderBy(asc(sections.name),asc(sections.id)).limit(500);
 const overrides=rows.length?await db.select({
   scopeId:placementEligibilityDecisions.scopeId,status:placementEligibilityDecisions.status,
   reason:placementEligibilityDecisions.reason,version:placementEligibilityDecisions.updatedAt,
 }).from(placementEligibilityDecisions)
  .where(and(eq(placementEligibilityDecisions.collegeId,collegeId),
    eq(placementEligibilityDecisions.scopeType,"SECTION"),
    inArray(placementEligibilityDecisions.scopeId,rows.map(row=>row.id)))):[];
 const keyed=new Map(overrides.map(row=>[row.scopeId,row]));
 return {batch,finished:Boolean(lifecycle?.finishedAt),ready:true,
  inherited:decision.status,classes:rows.map(row=>({
   ...row,decision:keyed.get(row.id)?.status??"NOT_DECIDED",
   effectiveDecision:keyed.get(row.id)?.status??decision.status,
   reason:keyed.get(row.id)?.reason??null,
   expectedVersion:keyed.get(row.id)?.version.toISOString()??"none",
  }))};
}
