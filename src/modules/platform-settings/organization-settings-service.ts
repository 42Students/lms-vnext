import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,organizations} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {LEGACY_TENANT_SETTING_MAP} from "./legacy-setting-specs";

const organizationIdSchema=z.uuid();
const keySchema=z.string().trim().min(1).max(120).regex(/^[A-Za-z][A-Za-z0-9._-]*$/);
const change=z.strictObject({
 key:keySchema,value:z.string().max(4096),expectedVersion:z.number().int().nonnegative(),
});
const update=z.strictObject({
 scopeType:z.literal("ORG"),organizationId:organizationIdSchema,
 changes:z.array(change).min(1).max(50),
});
const remove=z.strictObject({
 scopeType:z.literal("ORG"),organizationId:organizationIdSchema,
 key:keySchema,expectedVersion:z.number().int().positive(),
});
export class OrganizationSettingsError extends Error{
 constructor(readonly code:"SETTING_SCOPE_DENIED"|"SETTING_STALE"|"INVALID_SETTING"|"SETTINGS_STORAGE_PENDING"){
  super(code);this.name="OrganizationSettingsError";
 }
}
const prohibited=/secret|token|password|credential|api[._-]?key|private[._-]?key/i;
function safeKey(k:string){
 if(prohibited.test(k)||LEGACY_TENANT_SETTING_MAP.has(k)||
  /^(?:module[._-])?courses(?:[._-]|$)/i.test(k))
  throw new OrganizationSettingsError("INVALID_SETTING");
 return k;
}
async function authorize(ctx:RequestContext,raw:string){
 const organizationId=organizationIdSchema.parse(raw);
 if(!isSuperAdmin(ctx)||ctx.adminScope?.collegeId||
  (ctx.adminScope?.organizationId&&ctx.adminScope.organizationId!==organizationId))
  throw new AuthorizationError("organization.manage");
 requirePermission(ctx,"organization.manage",{organizationId});
 const [org]=await getDb().select({id:organizations.id}).from(organizations)
  .where(and(eq(organizations.id,organizationId),eq(organizations.status,"ACTIVE"))).limit(1);
 if(!org)throw new OrganizationSettingsError("SETTING_SCOPE_DENIED");
 return organizationId;
}
async function available(){
 const result=await getDb().execute(sql<{ready:boolean}>`select to_regclass('public.organization_setting_overrides') is not null as ready`);
 return Boolean(result.rows[0]?.ready);
}
export async function listOrganizationTenantSettings(ctx:RequestContext,rawId:string){
 const organizationId=await authorize(ctx,rawId);
 if(!(await available()))return {ready:false,scope:"ORG" as const,scopeId:organizationId,entries:[],
  reason:"SETTINGS_STORAGE_PENDING" as const,operationalReader:false};
 const rows=await getDb().execute(sql<{key:string;value:string;version:number}>`
  select key,value,version from organization_setting_overrides
  where organization_id=${organizationId}::uuid order by key`);
 return {ready:true,scope:"ORG" as const,scopeId:organizationId,
  operationalReader:false,entries:rows.rows.map(row=>({
   ...row,value:prohibited.test(row.key)?"[redacted]":row.value,
  })),note:"Organization settings are stored for review; no runtime service inherits these values automatically."};
}
export async function saveOrganizationTenantSettings(ctx:RequestContext,raw:unknown){
 const input=update.parse(raw);
 const organizationId=await authorize(ctx,input.organizationId);
 if(!(await available()))throw new OrganizationSettingsError("SETTINGS_STORAGE_PENDING");
 const seen=new Set<string>();
 const results:{key:string;status:"SAVED"|"DELETED"|"FAILED";version?:number;message:string}[]=[];
 for(const row of input.changes){
  try{
   const k=safeKey(row.key);
   if(seen.has(k))throw new OrganizationSettingsError("INVALID_SETTING");
   seen.add(k);
   const value=row.value.trim();
   const next=await getDb().transaction(async tx=>{
    await assertPersistedPlatformPermission(tx,ctx,"organization.manage",{organizationId});
    const [active]=await tx.select({id:organizations.id}).from(organizations)
      .where(and(eq(organizations.id,organizationId),eq(organizations.status,"ACTIVE")))
      .for("share").limit(1);
    if(!active)throw new OrganizationSettingsError("SETTING_SCOPE_DENIED");
    const current=await tx.execute(sql<{version:number}>`
      select version from organization_setting_overrides
      where organization_id=${organizationId}::uuid and key=${k} for update`);
    const version=Number(current.rows[0]?.version??0);
    if(version!==row.expectedVersion)throw new OrganizationSettingsError("SETTING_STALE");
    if(!value){
      await tx.execute(sql`delete from organization_setting_overrides where
       organization_id=${organizationId}::uuid and key=${k}`);
    }else if(version===0){
      await tx.execute(sql`insert into organization_setting_overrides
       (organization_id,key,value,version,updated_by_user_id)
       values (${organizationId}::uuid,${k},${value},1,${ctx.user.id}::uuid)`);
    }else{
      await tx.execute(sql`update organization_setting_overrides set
       value=${value},version=version+1,updated_by_user_id=${ctx.user.id}::uuid,
       updated_at=now() where organization_id=${organizationId}::uuid and key=${k}`);
    }
    const newVersion=value?version+1:0;
    await tx.insert(activityEvents).values({
     module:"PLATFORM",eventType:"platform.setting.updated",organizationId,
     collegeId:null,actorUserId:ctx.user.id,subjectType:"organization_setting",
     subjectId:k,summary:"Organization setting changed",
     metadata:{scope:"ORG",action:value?"OVERRIDE":"DELETE",version:newVersion,
      runtimeInheritance:false},
    });
    return newVersion;
   });
   results.push({key:k,status:value?"SAVED":"DELETED",version:next,
    message:value?"Stored only; no runtime reader is activated.":"Organization override removed."});
  }catch(error){
   results.push({key:row.key,status:"FAILED",
    message:error instanceof OrganizationSettingsError?error.code:"Could not save this organization setting"});
  }
 }
 return {scope:"ORG" as const,results,
  saved:results.filter(row=>row.status!=="FAILED").length,
  failed:results.filter(row=>row.status==="FAILED").length,operationalReader:false};
}
export async function removeOrganizationTenantSetting(ctx:RequestContext,raw:unknown){
 const input=remove.parse(raw);
 const result=await saveOrganizationTenantSettings(ctx,{
  scopeType:"ORG",organizationId:input.organizationId,
  changes:[{key:input.key,value:"",expectedVersion:input.expectedVersion}],
 });
 if(result.failed)throw new OrganizationSettingsError("SETTING_STALE");
 return {status:"DELETED" as const,key:input.key};
}
