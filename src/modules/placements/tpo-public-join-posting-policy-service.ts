import "server-only";
import {and,eq,gt,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,placementPublicJoinLinks} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {publicJoinTablesReady} from "./public-join/readiness";
import {tpoPublicJoinPostingPolicySchema} from "./tpo-public-join-link-model";
import {TpoPublicJoinLinkError} from "./tpo-public-join-link-service";

async function contextForPolicy(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
   !(hasMembershipRole(context,"TPO")||hasMembershipRole(context,"COLLEGE_ADMIN")))
  throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId:member.collegeId});
 const college=await requirePlacementManageScope(context,member.collegeId);
 if(!await publicJoinTablesReady())throw new TpoPublicJoinLinkError("NOT_REGISTERED");
 return {college,member};
}
function activeLink(collegeId:string,scope:"COLLEGE"|"COMPANY",companyId?:string){
 return and(eq(placementPublicJoinLinks.collegeId,collegeId),
  eq(placementPublicJoinLinks.scope,scope),
  companyId?eq(placementPublicJoinLinks.companyId,companyId):isNull(placementPublicJoinLinks.companyId),
  isNull(placementPublicJoinLinks.revokedAt),gt(placementPublicJoinLinks.expiresAt,new Date()));
}
export async function getPublicJoinPostingPolicy(context:RequestContext,
 scope:"COLLEGE"|"COMPANY",companyId?:string){
 const {college}=await contextForPolicy(context);
 const [row]=await getDb().select({id:placementPublicJoinLinks.id,
   enabled:placementPublicJoinLinks.enabled,postDirect:placementPublicJoinLinks.postWithoutApproval})
   .from(placementPublicJoinLinks).where(activeLink(college.id,scope,companyId)).limit(1);
 if(!row)throw new TpoPublicJoinLinkError("NOT_FOUND");
 return {linkId:row.id,enabled:row.enabled,postDirect:row.postDirect};
}
export async function setPublicJoinPostingPolicy(context:RequestContext,raw:unknown){
 const input=tpoPublicJoinPostingPolicySchema.parse(raw);
 const {college,member}=await contextForPolicy(context);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [row]=await tx.select({id:placementPublicJoinLinks.id,
   enabled:placementPublicJoinLinks.enabled,postDirect:placementPublicJoinLinks.postWithoutApproval})
   .from(placementPublicJoinLinks)
   .where(activeLink(college.id,input.scope,input.scope==="COMPANY"?input.companyId:undefined))
   .for("update").limit(1);
  if(!row)throw new TpoPublicJoinLinkError("NOT_FOUND");
  if(row.id!==input.expectedLinkId)throw new TpoPublicJoinLinkError("STALE");
  if(input.postDirect===null||input.postDirect===row.postDirect)
   return {linkId:row.id,enabled:row.enabled,postDirect:row.postDirect};
  await tx.update(placementPublicJoinLinks).set({postWithoutApproval:input.postDirect})
   .where(eq(placementPublicJoinLinks.id,row.id));
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:member.id,module:"PLACEMENTS",
   eventType:"PLACEMENTS_PUBLIC_JOIN_POST_POLICY_CHANGED",
   subjectType:"placement_public_join_link",subjectId:row.id,
   summary:input.postDirect?"Public join posting policy enabled":"Public join posting policy disabled",
   metadata:{scope:input.scope,postDirect:input.postDirect},
  });
  return {linkId:row.id,enabled:row.enabled,postDirect:input.postDirect};
 });
}
