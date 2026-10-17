import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProgramEnrollments,membershipRoles,
 sectionEnrollments,sections,users} from "@/db/schema";
import {placementEligibilityDecisions} from "@/db/schema/placement-access";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoBatch} from "./tpo-batch-workspace-read-service";
import {summarizeTpoOwnOverrides} from "./tpo-batch-own-decision-model";

/** Full authorized roster, not merely the current 25-student page. */
export async function getTpoBatchOwnDecisionSummary(ctx:RequestContext,batchId:string){
 const {batch,collegeId}=await getTpoBatch(ctx,batchId);
 const db=getDb();
 const roster=await db.select({membershipId:collegeMemberships.id,enrollmentId:learnerProgramEnrollments.id})
  .from(learnerProgramEnrollments)
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
   eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(learnerProgramEnrollments.cohortId,batch.id),
   eq(learnerProgramEnrollments.status,"ACTIVE")));
 if(!roster.length)return summarizeTpoOwnOverrides([]);
 const members=[...new Set(roster.map(row=>row.membershipId))];
 const own=await db.select({scopeId:placementEligibilityDecisions.scopeId,
   status:placementEligibilityDecisions.status}).from(placementEligibilityDecisions)
  .where(and(eq(placementEligibilityDecisions.collegeId,collegeId),
   eq(placementEligibilityDecisions.scopeType,"MEMBERSHIP"),
   inArray(placementEligibilityDecisions.scopeId,members)));
 if(!own.length)return summarizeTpoOwnOverrides([]);
 const enrollmentIds=roster.map(row=>row.enrollmentId);
 const assigned=await db.select({enrollmentId:sectionEnrollments.learnerEnrollmentId,
    sectionId:sections.id}).from(sectionEnrollments)
  .innerJoin(sections,and(eq(sections.id,sectionEnrollments.sectionId),
   eq(sections.cohortId,batch.id),eq(sections.status,"ACTIVE")))
  .where(and(eq(sectionEnrollments.status,"ACTIVE"),
   inArray(sectionEnrollments.learnerEnrollmentId,enrollmentIds)));
 const classIds=[...new Set(assigned.map(s=>s.sectionId))];
 const [batchRule]=await db.select({status:placementEligibilityDecisions.status})
  .from(placementEligibilityDecisions).where(and(
   eq(placementEligibilityDecisions.collegeId,collegeId),
   eq(placementEligibilityDecisions.scopeType,"COHORT"),
   eq(placementEligibilityDecisions.scopeId,batch.id))).limit(1);
 const classRules=classIds.length?await db.select({scopeId:placementEligibilityDecisions.scopeId,
   status:placementEligibilityDecisions.status}).from(placementEligibilityDecisions)
  .where(and(eq(placementEligibilityDecisions.collegeId,collegeId),
   eq(placementEligibilityDecisions.scopeType,"SECTION"),
   inArray(placementEligibilityDecisions.scopeId,classIds))):[];
 const byMember=new Map(own.map(row=>[row.scopeId,row.status]));
 const byClass=new Map(classRules.map(row=>[row.scopeId,row.status]));
 const facts:({direct:"ELIGIBLE"|"INELIGIBLE";parent:"ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED"|null})[]=[];
 for(const row of roster){
  const direct=byMember.get(row.membershipId);
  if(direct!=="ELIGIBLE"&&direct!=="INELIGIBLE")continue;
  const classes=assigned.filter(item=>item.enrollmentId===row.enrollmentId);
  const inherited=classes.length>1?null:
   classes.length===1?byClass.get(classes[0].sectionId)??batchRule?.status??"NOT_DECIDED":
   batchRule?.status??"NOT_DECIDED";
  facts.push({direct,parent:inherited==="ELIGIBLE"||inherited==="INELIGIBLE"||inherited==="NOT_DECIDED"?inherited:null});
 }
 return summarizeTpoOwnOverrides(facts);
}
