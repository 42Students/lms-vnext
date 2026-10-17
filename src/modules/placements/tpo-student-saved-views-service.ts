import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementTpoSavedViews} from "@/db/schema/tpo-collaboration";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {requirePlacementManageScope} from "./scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";

const selection=z.strictObject({
 journeyState:z.string().max(60).optional(),
 branchId:z.uuid().optional(),batchId:z.uuid().optional(),
 search:z.string().max(150).optional(),pageSize:z.number().int().min(10).max(100).default(25),
 columns:z.string().max(800).optional(),
});
export const studentSavedViewMutation=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("CREATE"),name:z.string().trim().min(1).max(100),
   filters:selection,pinned:z.boolean().default(false)}),
 z.strictObject({action:z.literal("UPDATE"),id:z.uuid(),name:z.string().trim().min(1).max(100),
   filters:selection,pinned:z.boolean().default(false)}),
 z.strictObject({action:z.literal("DELETE"),id:z.uuid()}),
 z.strictObject({action:z.literal("OPEN"),id:z.uuid()}),
]);
type Stored={query:z.infer<typeof selection>;pinned:boolean;lastUsedAt?:string;updatedAt?:string};
function viewData(raw:unknown):Stored{
 if(!raw||typeof raw!=="object")return{query:{pageSize:25},pinned:false};
 const obj=raw as Record<string,unknown>;
 const q=selection.safeParse(obj.query);
 return{query:q.success?q.data:{pageSize:25},pinned:obj.pinned===true,
  lastUsedAt:typeof obj.lastUsedAt==="string"?obj.lastUsedAt:undefined,
  updatedAt:typeof obj.updatedAt==="string"?obj.updatedAt:undefined};
}
export async function listTpoStudentSavedViews(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 await requirePlacementManageScope(ctx,collegeId);
 const rows=await getDb().select().from(placementTpoSavedViews)
  .where(and(eq(placementTpoSavedViews.collegeId,collegeId),
   eq(placementTpoSavedViews.userId,ctx.user.id),
   eq(placementTpoSavedViews.scope,"STUDENTS")))
  .orderBy(desc(placementTpoSavedViews.createdAt)).limit(150);
 return rows.map(x=>({id:x.id,name:x.name,createdAt:x.createdAt,
  ...viewData(x.filters)}));
}
export async function mutateTpoStudentSavedView(ctx:RequestContext,raw:unknown){
 const input=studentSavedViewMutation.parse(raw);
 const collegeId=await requireTpoBatchActor(ctx);
 const college=await requirePlacementManageScope(ctx,collegeId);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const all=await tx.select().from(placementTpoSavedViews)
   .where(and(eq(placementTpoSavedViews.collegeId,collegeId),
    eq(placementTpoSavedViews.userId,ctx.user.id),
    eq(placementTpoSavedViews.scope,"STUDENTS")))
   .for("update");
  const existing="id" in input?all.find(row=>row.id===input.id):undefined;
  if("id" in input&&!existing)throw Error("Saved view not found.");
  if(input.action==="DELETE"){
   await tx.delete(placementTpoSavedViews).where(eq(placementTpoSavedViews.id,input.id));
   return{deleted:input.id};
  }
  const now=new Date().toISOString();
  if(input.action==="OPEN"){
   const old=viewData(existing!.filters);
   await tx.update(placementTpoSavedViews).set({
    filters:{...old,lastUsedAt:now},
   }).where(eq(placementTpoSavedViews.id,input.id));
   return{id:input.id,query:old.query};
  }
  const other=all.filter(row=>row.id!==existing?.id);
  const normalized=JSON.stringify(input.filters);
  if(other.some(row=>JSON.stringify(viewData(row.filters).query)===normalized))
   throw Error("You already have a saved view with these filters.");
  const pinned=other.filter(row=>viewData(row.filters).pinned).length;
  if(input.pinned&&pinned>=5)throw Error("Only five views may be pinned.");
  const record:Stored={query:input.filters,pinned:input.pinned,
   lastUsedAt:existing?viewData(existing.filters).lastUsedAt:undefined,updatedAt:now};
  const [saved]=input.action==="CREATE"
   ?await tx.insert(placementTpoSavedViews).values({
     collegeId,userId:ctx.user.id,scope:"STUDENTS",name:input.name,filters:record,
    }).returning({id:placementTpoSavedViews.id})
   :await tx.update(placementTpoSavedViews).set({
     name:input.name,filters:record,
    }).where(eq(placementTpoSavedViews.id,input.id)).returning({id:placementTpoSavedViews.id});
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,
   module:"PLACEMENTS",eventType:"PLACEMENTS_TPO_STUDENT_SAVED_VIEW_CHANGED",
   subjectType:"placement_tpo_saved_view",subjectId:saved.id,
   summary:"TPO student saved view "+(input.action==="CREATE"?"created":"updated"),
   metadata:{scope:"STUDENTS",pinned:input.pinned},
  });
  return{id:saved.id};
 });
}
