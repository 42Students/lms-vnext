import "server-only";
import {sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {ENGAGE_COLUMNS} from "./tpo-recruiter-table-view-model";

const viewBody=z.strictObject({
 action:z.enum(["CREATE","UPDATE","DELETE","PIN"]),
 id:z.string().uuid().optional(),
 name:z.string().trim().min(1).max(100).optional(),
 note:z.string().trim().max(500).nullable().optional(),
 query:z.record(z.string().max(64),z.string().max(250)).optional(),
 columns:z.array(z.enum(ENGAGE_COLUMNS)).max(ENGAGE_COLUMNS.length).optional(),
 pinned:z.boolean().optional(),
});
export class TpoSavedViewError extends Error{
 constructor(readonly code:"STORAGE_PENDING"|"VIEW_NOT_FOUND"|"VIEW_LIMIT"|"PIN_LIMIT"|"BAD_ACTION"|"DUPLICATE_NAME"){
  super(code);
 }
}
async function scope(context:RequestContext){
 if(!context.membership||context.membership.status!=="ACTIVE"||
  !hasMembershipRole(context,"TPO")||context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("placements.manage");
 return requirePlacementManageScope(context,context.membership.collegeId);
}
export async function listTpoRecruiterSavedViews(context:RequestContext){
 const college=await scope(context),db=getDb();

 const result=await db.execute<{
  id:string;name:string;note:string|null;query_json:Record<string,string>;
  columns_json:string[];pinned:boolean;updated_at:Date;
 }>(sql`SELECT id,name,note,query_json,columns_json,pinned,updated_at
 FROM placement_tpo_recruiter_saved_views WHERE college_id=${college.id}::uuid
 AND owner_user_id=${context.user.id}::uuid ORDER BY pinned DESC,updated_at DESC LIMIT 100`);
 return {ready:true as const,views:result.rows};
}
export async function changeTpoRecruiterSavedView(context:RequestContext,raw:unknown){
 const input=viewBody.parse(raw),college=await scope(context),db=getDb();

 return db.transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  // Serializes pin-count and unique-name decisions for one actor.
  await tx.execute(sql`SELECT id FROM users WHERE id=${context.user.id}::uuid FOR UPDATE`);
  const owner=sql`college_id=${college.id}::uuid AND owner_user_id=${context.user.id}::uuid`;
  if(input.action==="DELETE"){
   if(!input.id)throw new TpoSavedViewError("BAD_ACTION");
   const deleted=await tx.execute<{id:string}>(sql`DELETE FROM placement_tpo_recruiter_saved_views
    WHERE ${owner} AND id=${input.id}::uuid RETURNING id`);
   if(!deleted.rows.length)throw new TpoSavedViewError("VIEW_NOT_FOUND");
   return {deleted:true as const,id:input.id};
  }
  if(input.action==="CREATE"&&!input.name)throw new TpoSavedViewError("BAD_ACTION");
  if(input.action!=="CREATE"&&!input.id)throw new TpoSavedViewError("BAD_ACTION");
  const pinned=input.action==="PIN"?input.pinned??false:input.pinned??false;
  if(pinned){
   const existing=await tx.execute<{count:number}>(sql`SELECT count(*)::integer as count
    FROM placement_tpo_recruiter_saved_views WHERE ${owner} AND pinned=true
    ${input.id?sql`AND id<>${input.id}::uuid`:sql``}`);
   if((existing.rows[0]?.count??0)>=5)throw new TpoSavedViewError("PIN_LIMIT");
  }
  if(input.action==="CREATE"){
   const total=await tx.execute<{count:number}>(sql`SELECT count(*)::integer as count
    FROM placement_tpo_recruiter_saved_views WHERE ${owner}`);
   if((total.rows[0]?.count??0)>=100)throw new TpoSavedViewError("VIEW_LIMIT");
   try{
    const result=await tx.execute<{id:string}>(sql`INSERT INTO placement_tpo_recruiter_saved_views
     (college_id,owner_user_id,name,note,query_json,columns_json,pinned)
     VALUES (${college.id}::uuid,${context.user.id}::uuid,${input.name!}::varchar,
      ${input.note??null}::varchar,${JSON.stringify(input.query??{})}::jsonb,
      ${JSON.stringify(input.columns??[])}::jsonb,${pinned})
     RETURNING id`);
    return {id:result.rows[0]?.id};
   }catch(error){
    if((error as {code?:string}).code==="23505")throw new TpoSavedViewError("DUPLICATE_NAME");
    throw error;
   }
  }
  if(input.action==="PIN"){
   const result=await tx.execute<{id:string}>(sql`UPDATE placement_tpo_recruiter_saved_views
    SET pinned=${pinned},updated_at=now() WHERE ${owner}
    AND id=${input.id!}::uuid RETURNING id`);
   if(!result.rows.length)throw new TpoSavedViewError("VIEW_NOT_FOUND");
   return {id:input.id};
  }
  const result=await tx.execute<{id:string}>(sql`UPDATE placement_tpo_recruiter_saved_views SET
   name=coalesce(${input.name??null}::varchar,name),
   note=${input.note??null}::varchar,
   query_json=${JSON.stringify(input.query??{})}::jsonb,
   columns_json=${JSON.stringify(input.columns??[])}::jsonb,
   updated_at=now()
   WHERE ${owner} AND id=${input.id!}::uuid RETURNING id`);
  if(!result.rows.length)throw new TpoSavedViewError("VIEW_NOT_FOUND");
  return {id:input.id};
 });
}
