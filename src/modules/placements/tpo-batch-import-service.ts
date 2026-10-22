import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProgramEnrollments,learnerProfiles,membershipRoles,users} from "@/db/schema";
import {placementEligibilityDecisions} from "@/db/schema/placement-access";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoBatch} from "./tpo-batch-workspace-read-service";
import {tpoSheetInputSchema,previewTpoEligibilitySheet} from "./tpo-eligibility-sheet-model";

/** Exact roll or membership UUID matching only against active learners in the authorized batch. */
export async function getBatchEligibilityImportPreview(ctx:RequestContext,rawBatchId:unknown,raw:unknown){
 const {batch,collegeId}=await getTpoBatch(ctx,rawBatchId);
 const {rows}=tpoSheetInputSchema.parse(raw);
 // All candidates are restricted to this exact active batch; never match by name/email.
 const candidates=await getDb().select({membershipId:collegeMemberships.id,rollNumber:learnerProfiles.rollNumber,name:users.displayName})
 .from(learnerProgramEnrollments)
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
  eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
 .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
 .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
  eq(membershipRoles.role,"LEARNER")))
 .where(and(eq(learnerProgramEnrollments.cohortId,batch.id),
  eq(learnerProgramEnrollments.status,"ACTIVE")));
 const eligibleIds=candidates.map(r=>r.membershipId);
 const stored=eligibleIds.length?await getDb().select({id:placementEligibilityDecisions.scopeId,
  updatedAt:placementEligibilityDecisions.updatedAt,status:placementEligibilityDecisions.status})
  .from(placementEligibilityDecisions).where(and(eq(placementEligibilityDecisions.collegeId,collegeId),
   eq(placementEligibilityDecisions.scopeType,"MEMBERSHIP"),inArray(placementEligibilityDecisions.scopeId,eligibleIds))):[];
 const existing=new Map(stored.map(row=>[row.id,row.updatedAt.toISOString()]));
 const statuses=new Map(stored.map(row=>[row.id,row.status]));
 const learnerNames=new Map(candidates.map(row=>[row.membershipId,row.name]));
 const learnerRolls=new Map(candidates.map(row=>[row.membershipId,row.rollNumber]));
 const roster=candidates.map(r=>({studentCode:r.membershipId,rollNumber:r.rollNumber,membershipId:r.membershipId,
  expectedVersion:existing.get(r.membershipId)??"none"}));
 const preview=previewTpoEligibilitySheet(rows,roster).map((item,index)=>{
  const inputRow=rows[index];
  if(!inputRow)throw new Error("INVALID_ELIGIBILITY_SHEET_ROW");
  return {...item,
  studentName:item.membershipId?learnerNames.get(item.membershipId)??null:null,
  rollNumber:item.membershipId?learnerRolls.get(item.membershipId)??null:null,
  currentStatus:item.membershipId?statuses.get(item.membershipId)??"NOT_DECIDED":null,
  proposedStatus:inputRow.decision,
  };
 });
 return {batchId:batch.id,rows,preview,ready:preview.filter(r=>r.status==="matched").length,
  skipped:preview.filter(r=>r.status==="unusable").length};
}
