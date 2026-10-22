import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementTpoSavedViews} from "@/db/schema/tpo-collaboration";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {getTpoBatch} from "./tpo-batch-workspace-read-service";
import {requirePlacementManageScope} from "./scope";
import {tpoBatchSavedFilterSchema,tpoBatchSavedViewCommandSchema,type TpoBatchSavedFilter} from "./tpo-batch-saved-view-model";

const uuid=z.string().uuid();
type Saved={query:TpoBatchSavedFilter;pinned:boolean;lastUsedAt?:string;updatedAt?:string};
function parseStored(value:unknown,batchId:string):Saved|null{
 if(!value||typeof value!=="object")return null;
 const row=value as Record<string,unknown>;
 const parsed=tpoBatchSavedFilterSchema.safeParse(row["query"]);
 if(!parsed.success||parsed.data.batchId!==batchId)return null;
 return {query:parsed.data,pinned:row["pinned"]===true,
  ...(typeof row["lastUsedAt"]==="string"?{lastUsedAt:row["lastUsedAt"]}:{}),
  ...(typeof row["updatedAt"]==="string"?{updatedAt:row["updatedAt"]}:{})};
}
async function requireScope(ctx:RequestContext,batchId:string){
 const batch=await getTpoBatch(ctx,batchId);
 const college=await requirePlacementManageScope(ctx,batch.collegeId);
 return {college,batchId};
}
export async function listTpoBatchSavedViews(ctx:RequestContext,rawBatchId:unknown){
 const batchId=uuid.parse(rawBatchId);
 const {college}=await requireScope(ctx,batchId);
 const rows=await getDb().select().from(placementTpoSavedViews).where(and(
  eq(placementTpoSavedViews.collegeId,college.id),
  eq(placementTpoSavedViews.userId,ctx.user.id),
  eq(placementTpoSavedViews.scope,"BATCH_STUDENTS"),
 )).orderBy(desc(placementTpoSavedViews.createdAt)).limit(150);
 return rows.flatMap(row=>{
  const data=parseStored(row.filters,batchId);
  return data?[{id:row.id,name:row.name,createdAt:row.createdAt,...data}]:[];
 });
}
export async function mutateTpoBatchSavedView(ctx:RequestContext,rawBatchId:unknown,rawInput:unknown){
 const batchId=uuid.parse(rawBatchId),input=tpoBatchSavedViewCommandSchema.parse(rawInput);
 const {college}=await requireScope(ctx,batchId);
 if("filters" in input && input.filters.batchId!==batchId)
  throw new Error("Saved view belongs to a different batch.");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const rows=await tx.select().from(placementTpoSavedViews).where(and(
   eq(placementTpoSavedViews.collegeId,college.id),
   eq(placementTpoSavedViews.userId,ctx.user.id),
   eq(placementTpoSavedViews.scope,"BATCH_STUDENTS"),
  )).for("update");
  const valid=rows.flatMap(row=>{
   const stored=parseStored(row.filters,batchId);
   return stored?[{row,stored}]:[];
  });
  const existing="id" in input?valid.find(v=>v.row.id===input.id):undefined;
  if("id" in input&&!existing)throw new Error("Saved batch view not found.");
  if(input.action==="DELETE"){
   await tx.delete(placementTpoSavedViews).where(and(
    eq(placementTpoSavedViews.id,input.id),eq(placementTpoSavedViews.collegeId,college.id),
    eq(placementTpoSavedViews.userId,ctx.user.id)));
   return {id:input.id,deleted:true};
  }
  const now=new Date().toISOString();
  if(input.action==="OPEN"){
   await tx.update(placementTpoSavedViews).set({
    filters:{...existing!.stored,lastUsedAt:now},
   }).where(eq(placementTpoSavedViews.id,input.id));
   return {id:input.id,query:existing!.stored.query};
  }
  const other=valid.filter(item=>item.row.id!==existing?.row.id);
  if(other.some(item=>JSON.stringify(item.stored.query)===JSON.stringify(input.filters)))
   throw new Error("You already saved these batch filters.");
  const pins=other.filter(item=>item.stored.pinned).length;
  if(input.pinned&&pins>=5)throw new Error("Only five batch views may be pinned.");
  const data:Saved={query:input.filters,pinned:input.pinned,updatedAt:now,
   ...(existing?.stored.lastUsedAt!==undefined?{lastUsedAt:existing.stored.lastUsedAt}:{})};
  const [saved]=input.action==="CREATE"
   ?await tx.insert(placementTpoSavedViews).values({
    collegeId:college.id,userId:ctx.user.id,scope:"BATCH_STUDENTS",
    name:input.name,filters:data,
   }).returning({id:placementTpoSavedViews.id})
   :await tx.update(placementTpoSavedViews).set({
    name:input.name,filters:data,
   }).where(and(eq(placementTpoSavedViews.id,input.id),
    eq(placementTpoSavedViews.collegeId,college.id),
    eq(placementTpoSavedViews.userId,ctx.user.id))).returning({id:placementTpoSavedViews.id});
  if(!saved)throw new Error("Saved batch view could not be updated.");
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,
   module:"PLACEMENTS",eventType:"PLACEMENTS_TPO_STUDENT_SAVED_VIEW_CHANGED",
   subjectType:"placement_tpo_saved_view",subjectId:saved.id,
   summary:"Batch students saved view "+(input.action==="CREATE"?"created":"updated"),
   metadata:{scope:"BATCH_STUDENTS",batchId,pinned:input.pinned},
  });
  return {id:saved.id};
 });
}
