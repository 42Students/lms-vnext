import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementDebarments} from "@/db/schema/placement-debarments";
import type {RequestContext} from "@/modules/identity/context";
import {requireLearnerPlacementAccess} from "./learner-participation-guard";
import {isDebarmentActive} from "./batch-registration-policy";

/** Learner-only scoped read: show the saved restriction reason, expiry
 * and remaining drive count exactly as legacy did. Never expose other
 * learners' staff notes, history or membership identifiers. */
export async function getOwnLearnerDebarmentNotice(context:RequestContext,now=new Date()){
 const membership=await requireLearnerPlacementAccess(context);
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
 }).formatToParts(now);
 const part=(type:string)=>parts.find(item=>item.type===type)?.value??"";
 const today=part("year")+"-"+part("month")+"-"+part("day");
 const rows=await getDb().select({
  liftedAt:placementDebarments.liftedAt,
  untilDate:placementDebarments.untilDate,
  reason:placementDebarments.reason,
  untilDrives:placementDebarments.untilDrives,
  drivesCounted:placementDebarments.drivesCounted,
 }).from(placementDebarments).where(and(
  eq(placementDebarments.collegeId,membership.collegeId),
  eq(placementDebarments.membershipId,membership.id),
 ));
 const active=rows.filter(row=>isDebarmentActive(row,today));
 if(!active.length)return null;
 return {
  active:true as const,
  reasons:[...new Set(active.map(row=>row.reason.trim()).filter(Boolean))],
  untilDate:active.map(row=>row.untilDate).filter((v):v is string=>v!==null).sort().at(-1)??null,
  remainingDrives:active.map(row=>row.untilDrives===null?null:Math.max(0,row.untilDrives-row.drivesCounted))
    .filter((v):v is number=>v!==null).sort((a,b)=>b-a).at(0)??null,
 };
}
