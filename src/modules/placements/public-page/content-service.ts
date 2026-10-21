import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementPublicPageContent} from "@/db/schema/placement-public-page-content";
import {activityEvents} from "@/db/schema/activity";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {DEFAULT_PUBLIC_METRICS,publicPlacementContentInput,
 type PublicPlacementMetricKey,normalizePublicPlacementMetricKeys} from "./content-model";
const ready=()=>placementTableExists("placement_public_page_content");
export async function getPublicPlacementPageContent(collegeId:string){
 if(!await ready())return {ready:false as const,about:"",
  metricKeys:DEFAULT_PUBLIC_METRICS,updatedAt:null};
 const [row]=await getDb().select({
  about:placementPublicPageContent.about,metricKeys:placementPublicPageContent.metricKeys,
  updatedAt:placementPublicPageContent.updatedAt,
 }).from(placementPublicPageContent).where(eq(placementPublicPageContent.collegeId,collegeId)).limit(1);
 return {ready:true as const,about:row?.about??"",
  metricKeys:row?.metricKeys?normalizePublicPlacementMetricKeys(row.metricKeys):DEFAULT_PUBLIC_METRICS,updatedAt:row?.updatedAt.toISOString()??null};
}
export async function saveTpoPublicPlacementContent(context:RequestContext,raw:unknown){
 const input=publicPlacementContentInput.parse(raw);
 const member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,member.collegeId);
 if(!await ready())throw new Error("PUBLIC_CONTENT_NOT_READY");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [existing]=await tx.select({updatedAt:placementPublicPageContent.updatedAt})
   .from(placementPublicPageContent).where(eq(placementPublicPageContent.collegeId,college.id))
   .for("update").limit(1);
  if((existing?.updatedAt.toISOString()??null)!==input.expectedUpdatedAt)
   throw new Error("PUBLIC_CONTENT_STALE");
  const now=new Date();
  let result:{updatedAt:Date}|undefined;
  if(existing){
   const [updated]=await tx.update(placementPublicPageContent).set({
    about:input.about,metricKeys:input.metricKeys as PublicPlacementMetricKey[],updatedAt:now,
   }).where(and(eq(placementPublicPageContent.collegeId,college.id),
    sql`date_trunc('milliseconds', ${placementPublicPageContent.updatedAt})=${input.expectedUpdatedAt}::timestamptz`))
    .returning({updatedAt:placementPublicPageContent.updatedAt});
   result=updated;
  }else{
   const [created]=await tx.insert(placementPublicPageContent).values({
    collegeId:college.id,about:input.about,metricKeys:input.metricKeys as PublicPlacementMetricKey[],
   }).onConflictDoNothing().returning({updatedAt:placementPublicPageContent.updatedAt});
   result=created;
  }
  if(!result)throw new Error("PUBLIC_CONTENT_STALE");
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:member.id,
   module:"PLACEMENTS",eventType:"placements.public_page.content_updated",
   subjectType:"placement_public_page_content",subjectId:college.id,
   summary:"Public placements page content updated",metadata:{metricKeys:input.metricKeys},
  });
  return {about:input.about,metricKeys:input.metricKeys,updatedAt:result.updatedAt.toISOString()};
 });
}
