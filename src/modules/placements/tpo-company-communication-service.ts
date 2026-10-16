import "server-only";
import {sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {requirePlacementManageScope} from "./scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
const companySchema=z.strictObject({
 key:z.string().trim().min(1).max(180),
 status:z.enum(["NOT_CONTACTED","EMAILED","REPLIED","MEETING_SET","NOT_INTERESTED"]),
});
export class CompanyCommunicationUnavailable extends Error{}
async function scope(ctx:RequestContext){
 if(!ctx.membership||ctx.membership.status!=="ACTIVE"||
  !hasMembershipRole(ctx,"TPO"))throw new AuthorizationError("placements.manage");
 return requirePlacementManageScope(ctx,ctx.membership.collegeId);
}
async function tableReady(){
 const value=await getDb().execute<{ready:boolean}>(sql`
  select to_regclass('public.placement_tpo_company_communication') is not null as ready`);
 return value.rows[0]?.ready===true;
}
export async function listCompanyCommunication(ctx:RequestContext){
 const college=await scope(ctx);
 if(!await tableReady())return {ready:false as const,items:[]};
 const result=await getDb().execute<{company_key:string;status:string}>(sql`
  select company_key,status from placement_tpo_company_communication
  where college_id=${college.id}::uuid order by company_key limit 10000`);
 return {ready:true as const,items:result.rows};
}
export async function updateCompanyCommunication(ctx:RequestContext,raw:unknown){
 const input=companySchema.parse(raw),college=await scope(ctx);
 if(!await tableReady())throw new CompanyCommunicationUnavailable();
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  // Company key is already canonicalized by the scoped Companies view.
  // Never accept cross-college identifiers from a client.
  await tx.execute(sql`
   insert into placement_tpo_company_communication
   (college_id,company_key,status,updated_by_user_id)
   values(${college.id}::uuid,${input.key},${input.status},${ctx.user.id}::uuid)
   on conflict(college_id,company_key) do update set
   status=excluded.status,updated_by_user_id=excluded.updated_by_user_id,
   updated_at=now()`);
  return {key:input.key,status:input.status};
 });
}
