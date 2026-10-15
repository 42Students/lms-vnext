import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProgramEnrollments,membershipRoles,users} from "@/db/schema";
import {placementEligibilityDecisions} from "@/db/schema/placement-access";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoBatch} from "./tpo-batch-workspace-read-service";
import {eligibilityImportInputSchema,previewEligibilityImport} from "./tpo-eligibility-import-model";

/** A membership UUID is the only accepted import identifier until a unique
 * institutional roll-code mapping exists. No name/email matching. */
export async function getBatchEligibilityImportPreview(ctx:RequestContext,rawBatchId:unknown,raw:unknown){
 const {batch,collegeId}=await getTpoBatch(ctx,rawBatchId);
 const {rows}=eligibilityImportInputSchema.parse(raw);
 const ids=[...new Set(rows.map(r=>r.studentCode))];
 const candidates=await getDb().select({membershipId:collegeMemberships.id})
 .from(learnerProgramEnrollments)
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
  eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
 .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
  eq(membershipRoles.role,"LEARNER")))
 .where(and(eq(learnerProgramEnrollments.cohortId,batch.id),
  eq(learnerProgramEnrollments.status,"ACTIVE"),
  inArray(learnerProgramEnrollments.membershipId,ids)));
 const eligibleIds=candidates.map(r=>r.membershipId);
 const stored=eligibleIds.length?await getDb().select({id:placementEligibilityDecisions.scopeId,
  updatedAt:placementEligibilityDecisions.updatedAt})
  .from(placementEligibilityDecisions).where(and(eq(placementEligibilityDecisions.collegeId,collegeId),
   eq(placementEligibilityDecisions.scopeType,"MEMBERSHIP"),inArray(placementEligibilityDecisions.scopeId,eligibleIds))):[];
 const existing=new Map(stored.map(row=>[row.id,row.updatedAt.toISOString()]));
 const roster=candidates.map(r=>({studentCode:r.membershipId,membershipId:r.membershipId,
  expectedVersion:existing.get(r.membershipId)??"none"}));
 const preview=previewEligibilityImport(rows,roster);
 return {batchId:batch.id,rows,preview,ready:preview.filter(r=>r.status==="matched").length,
  skipped:preview.filter(r=>r.status==="unusable").length};
}
