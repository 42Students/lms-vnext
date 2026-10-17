import "server-only";
import {asc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCollegeApplicationStages,placementCollegeApplicationStageHistory} from "@/db/schema/placement-college-application-stages";
import {getSuperAdminApplicationDetail} from "./super-admin-application-detail-service";
import type {RequestContext} from "@/modules/identity/context";

/** Permission and selected-college ancestry are enforced before any stage read. */
export async function listSuperAdminApplicationStageHistory(context:RequestContext,applicationId:string){
 const record=await getSuperAdminApplicationDetail(context,applicationId);
 if(!record)return null;
 const rows=await getDb().select({
  id:placementCollegeApplicationStageHistory.id,
  fromStage:placementCollegeApplicationStageHistory.fromStage,
  toStage:placementCollegeApplicationStageHistory.toStage,
  reason:placementCollegeApplicationStageHistory.reason,
  changedAt:placementCollegeApplicationStageHistory.movedAt,
 }).from(placementCollegeApplicationStageHistory)
 .innerJoin(placementCollegeApplicationStages,eq(placementCollegeApplicationStages.id,placementCollegeApplicationStageHistory.stageId))
 .where(eq(placementCollegeApplicationStages.applicationId,applicationId))
 .orderBy(asc(placementCollegeApplicationStageHistory.movedAt),asc(placementCollegeApplicationStageHistory.id))
 .limit(100);
 return rows;
}
