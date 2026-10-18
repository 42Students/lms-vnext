import "server-only";
import {randomUUID} from "node:crypto";
import {and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,colleges} from "@/db/schema";
import {placementTpoSavedViews} from "@/db/schema/tpo-collaboration";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {
 tpoAuditSavedViewCommandSchema,tpoAuditStoredView,
 type TpoAuditSavedView,type TpoAuditSavedViewCommand,
} from "./tpo-audit-saved-view-model";

export class TpoAuditSavedViewError extends Error{
 constructor(readonly code:"STORAGE_PENDING"|"VIEW_NOT_FOUND"|"VIEW_LIMIT"|"PIN_LIMIT"|"DUPLICATE_NAME"|"VIEW_STALE"){
  super(code);this.name="TpoAuditSavedViewError";
 }
}
const ownerScope=(collegeId:string,userId:string)=>and(
 eq(placementTpoSavedViews.collegeId,collegeId),
 eq(placementTpoSavedViews.userId,userId),
 eq(placementTpoSavedViews.scope,"AUDIT"),
);
function visible(rows:readonly (typeof placementTpoSavedViews.$inferSelect)[]):TpoAuditSavedView[]{
 return rows.flatMap(row=>{
  const parsed=tpoAuditStoredView(row.filters);
  return parsed?[{id:row.id,name:row.name,filters:parsed.query,
   pinned:parsed.pinned,usedAt:parsed.usedAt,revision:parsed.revision,
   createdAt:row.createdAt.toISOString()}]:[];
 }).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||
  (b.usedAt??b.createdAt).localeCompare(a.usedAt??a.createdAt));
}
async function currentTpoCollege(ctx:RequestContext){
 if(!hasMembershipRole(ctx,"TPO"))throw new AuthorizationError("placements.manage");
 return requireTpoBatchActor(ctx);
}
export async function listTpoAuditSavedViews(ctx:RequestContext){
 const collegeId=await currentTpoCollege(ctx);
 if(!await placementTableExists("placement_tpo_saved_views"))
  return {ready:false as const,views:[] as TpoAuditSavedView[]};
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.manage");
  const persisted=await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  if(!hasMembershipRole(persisted,"TPO"))throw new AuthorizationError("placements.manage");
  const rows=await tx.select().from(placementTpoSavedViews)
   .where(ownerScope(collegeId,ctx.user.id))
   .orderBy(desc(placementTpoSavedViews.createdAt)).limit(100);
  return {ready:true as const,views:visible(rows)};
 });
}
export async function changeTpoAuditSavedView(ctx:RequestContext,raw:unknown){
 const input:TpoAuditSavedViewCommand=tpoAuditSavedViewCommandSchema.parse(raw);
 const collegeId=await currentTpoCollege(ctx);
 if(!await placementTableExists("placement_tpo_saved_views"))
  throw new TpoAuditSavedViewError("STORAGE_PENDING");
 return getDb().transaction(async tx=>{
  // Serialize per-college count/unique-name/pin decisions and actor revocation
  // before even a successful no-op response. No client-supplied college/user ID.
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.manage");
  const persisted=await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  if(!hasMembershipRole(persisted,"TPO"))throw new AuthorizationError("placements.manage");
  const rows=await tx.select().from(placementTpoSavedViews)
   .where(ownerScope(collegeId,ctx.user.id)).for("update");
  const all=rows.flatMap(row=>{
   const stored=tpoAuditStoredView(row.filters);
   return stored?[{row,stored}]:[];
  });
  let changedId:string;
  if(input.action==="CREATE"){
   const duplicate=all.some(({row})=>row.name.toLocaleLowerCase("en-IN")===
    input.name.toLocaleLowerCase("en-IN"));
   if(duplicate)throw new TpoAuditSavedViewError("DUPLICATE_NAME");
   if(rows.length>=12)throw new TpoAuditSavedViewError("VIEW_LIMIT");
   const [saved]=await tx.insert(placementTpoSavedViews).values({
    collegeId,userId:ctx.user.id,scope:"AUDIT",name:input.name,
    filters:{query:input.filters,pinned:false,usedAt:null,revision:randomUUID()},
   }).returning({id:placementTpoSavedViews.id});
   if(!saved)throw new TpoAuditSavedViewError("STORAGE_PENDING");
   changedId=saved.id;
  }else{
   const existing=all.find(item=>item.row.id===input.id);
   if(!existing)throw new TpoAuditSavedViewError("VIEW_NOT_FOUND");
   if(input.action==="OPEN"){
    await tx.update(placementTpoSavedViews)
     .set({filters:{...existing.stored,usedAt:new Date().toISOString()}})
     .where(and(ownerScope(collegeId,ctx.user.id),eq(placementTpoSavedViews.id,input.id)));
    return {id:input.id,filters:existing.stored.query};
   }
   if(existing.stored.revision!==input.expectedRevision)
    throw new TpoAuditSavedViewError("VIEW_STALE");
   if(input.action==="DELETE"){
    await tx.delete(placementTpoSavedViews).where(and(
     ownerScope(collegeId,ctx.user.id),eq(placementTpoSavedViews.id,input.id)));
    changedId=input.id;
   }else if(input.action==="PIN"){
    if(input.pinned&&all.filter(row=>row.row.id!==input.id&&row.stored.pinned).length>=5)
     throw new TpoAuditSavedViewError("PIN_LIMIT");
    await tx.update(placementTpoSavedViews).set({
     filters:{...existing.stored,pinned:input.pinned,revision:randomUUID()},
    }).where(and(ownerScope(collegeId,ctx.user.id),eq(placementTpoSavedViews.id,input.id)));
    changedId=input.id;
   }else{
    if(all.some(({row})=>row.id!==input.id&&
       row.name.toLocaleLowerCase("en-IN")===input.name.toLocaleLowerCase("en-IN")))
     throw new TpoAuditSavedViewError("DUPLICATE_NAME");
    await tx.update(placementTpoSavedViews).set({
     name:input.name,filters:{...existing.stored,revision:randomUUID()},
    }).where(and(ownerScope(collegeId,ctx.user.id),eq(placementTpoSavedViews.id,input.id)));
    changedId=input.id;
   }
  }
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:ctx.user.id,
   actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",
   eventType:"PLACEMENTS_TPO_AUDIT_SAVED_VIEW_CHANGED",
   subjectType:"placement_tpo_saved_view",subjectId:changedId,
   summary:"TPO changed a private saved audit view",
   metadata:{scope:"AUDIT",action:input.action},
  });
  return {id:changedId};
 });
}
