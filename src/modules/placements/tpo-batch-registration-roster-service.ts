import "server-only";
import {and,asc,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProgramEnrollments,membershipRoles,users} from "@/db/schema";
import {placementBatchRegistrations} from "@/db/schema/placement-registration";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoBatch} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {tpoRegistrationChoiceSchema} from "./tpo-batch-registration-summary-model";
import {summarizeSampledBatchRegistrations} from "./tpo-batch-registration-sample-summary-model";
import {sortTpoBatchRegistrationRows} from "./tpo-batch-registration-sort-model";
import {filterTpoRegistrationRecency} from "./tpo-batch-registration-recency-model";
import {filterTpoBatchRegistrationSource} from "./tpo-batch-registration-source-model";
import {filterBatchRegistrations,paginateBatchRegistrations,tpoBatchRegistrationFilters} from "./tpo-batch-registration-filter-model";
const MAX_ACTIVE_LEARNERS=500;
export async function listTpoBatchRegistrationRoster(ctx:RequestContext,cohortId:string,raw:unknown){
 const filters=tpoBatchRegistrationFilters.parse(raw);
 const {batch,collegeId}=await getTpoBatch(ctx,cohortId);
 const ready=await placementTableExists("placement_batch_registrations");
 if(!ready)return {batch,ready:false,limited:false,filters,items:[],hasMore:false,total:0,sampleSize:0};
 const db=getDb();
 const all=await db.select({membershipId:collegeMemberships.id,name:users.displayName})
  .from(learnerProgramEnrollments)
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
   eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(learnerProgramEnrollments.cohortId,batch.id),eq(learnerProgramEnrollments.status,"ACTIVE")))
  .orderBy(asc(users.displayName),asc(collegeMemberships.id)).limit(MAX_ACTIVE_LEARNERS+1);
 const limited=all.length>MAX_ACTIVE_LEARNERS;
 const sample=all.slice(0,MAX_ACTIVE_LEARNERS);
 const ids=sample.map(r=>r.membershipId);
 const registrations=ids.length?await db.select({
  membershipId:placementBatchRegistrations.membershipId,
  choice:placementBatchRegistrations.choice,
  source:placementBatchRegistrations.source,
  updatedAt:placementBatchRegistrations.updatedAt,
 }).from(placementBatchRegistrations)
  .where(and(eq(placementBatchRegistrations.collegeId,collegeId),
    eq(placementBatchRegistrations.cohortId,batch.id),
    inArray(placementBatchRegistrations.membershipId,ids))):[];
 const byId=new Map(registrations.map(row=>[row.membershipId,row]));
 const roster=sample.map(row=>{
  const reg=byId.get(row.membershipId);
  return {membershipId:row.membershipId,name:row.name??"Unnamed learner",
   choice:reg?tpoRegistrationChoiceSchema.parse(reg.choice):null,
   source:reg?.source??null,updatedAt:reg?.updatedAt.toISOString()??null};
 });
 const summary=summarizeSampledBatchRegistrations(roster);
 const filtered=filterTpoRegistrationRecency(filterTpoBatchRegistrationSource(filterBatchRegistrations(roster,filters),filters.source),filters.recency,new Date());
 const ordered=sortTpoBatchRegistrationRows(filtered,filters.order);
 const page=paginateBatchRegistrations(ordered,filters.page,filters.pageSize);
 return {batch,ready:true,limited,filters,items:page.items,hasMore:page.hasMore,
   total:page.total,sampleSize:sample.length,summary};
}
