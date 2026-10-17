import "server-only";
import {and,desc,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {users} from "@/db/schema";
import {placementEligibilityEvents} from "@/db/schema/placement-batches";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";

/** Bounded latest cohort decisions, only for cohort IDs supplied by the already
 * authorized TPO directory. Membership and class actions live in History. */
export async function listTpoBatchRecentCohortActions(context:RequestContext,cohortIds:readonly string[]){
 const collegeId=await requireTpoBatchActor(context);
 const ids=[...new Set(cohortIds)];
 if(!ids.length)return new Map<string,{actionId:string;actor:string;occurredAt:string;canUndo:boolean}>();
 const rows=await getDb().select({
  cohortId:placementEligibilityEvents.scopeId,actionId:placementEligibilityEvents.actionId,
  reversed:placementEligibilityEvents.reversesActionId,kind:placementEligibilityEvents.eventKind,
  actor:users.displayName,occurredAt:placementEligibilityEvents.occurredAt,
 }).from(placementEligibilityEvents).innerJoin(users,eq(users.id,placementEligibilityEvents.actorUserId))
 .where(and(eq(placementEligibilityEvents.collegeId,collegeId),
  eq(placementEligibilityEvents.scopeType,"COHORT"),inArray(placementEligibilityEvents.scopeId,ids)))
 .orderBy(desc(placementEligibilityEvents.sequence)).limit(1000);
 const reversed=new Set(rows.flatMap(row=>row.reversed?[row.reversed]:[]));
 const map=new Map<string,{actionId:string;actor:string;occurredAt:string;canUndo:boolean}>();
 for(const row of rows){
  if(map.has(row.cohortId))continue;
  map.set(row.cohortId,{
   actionId:row.actionId,actor:row.actor||"Unknown actor",occurredAt:row.occurredAt.toISOString(),
   canUndo:row.kind==="DECIDE"&&!reversed.has(row.actionId),
  });
 }
 return map;
}
