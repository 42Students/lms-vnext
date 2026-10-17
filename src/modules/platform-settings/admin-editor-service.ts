import "server-only";
import {isIP} from "node:net";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges} from "@/db/schema";
import {platformSettingOverrides} from "@/db/schema/platform-setting-overrides";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {LEGACY_TENANT_SETTING_MAP,LEGACY_TENANT_SETTING_SPECS} from "./legacy-setting-specs";

const entry=z.strictObject({key:z.string().min(1).max(120),value:z.string().max(4096),
 expectedVersion:z.number().int().nonnegative()});
const input=z.strictObject({scopeType:z.enum(["GLOBAL","COLLEGE"]),collegeId:z.uuid().optional(),
 confirmedHighImpact:z.boolean().default(false),changes:z.array(entry).min(1).max(31)});
export class TenantSettingEditorError extends Error{
 constructor(readonly code:"SETTINGS_STORAGE_PENDING"|"SETTING_SCOPE_DENIED"|"SETTING_STALE"|"INVALID_SETTING"){
  super(code);this.name="TenantSettingEditorError";
 }
}
function canonical(spec:typeof LEGACY_TENANT_SETTING_SPECS[number],raw:string){
 const trimmed=raw.trim();
 if(trimmed==="")return null;
 if(spec.type==="int"||spec.type==="decimal"){
  const n=Number(trimmed);
  if(!Number.isFinite(n)|| (spec.type==="int"&&!Number.isSafeInteger(n))||
    ("min" in spec&&spec.min!==undefined&&n<spec.min)||
    ("max" in spec&&spec.max!==undefined&&n>spec.max))
   throw new TenantSettingEditorError("INVALID_SETTING");
  return String(n);
 }
 if(trimmed.length>4096)throw new TenantSettingEditorError("INVALID_SETTING");
 if(spec.key==="cookieSameSite"&&!["Strict","Lax","None"].includes(trimmed))
  throw new TenantSettingEditorError("INVALID_SETTING");
 if(["baseDomain","globalHost","cookieDomain"].includes(spec.key)){
  const host=trimmed.replace(/^\./,"");
  if(!/^[a-z0-9](?:[a-z0-9-]*\.)+[a-z]{2,}$/i.test(host)||host.length>253)
   throw new TenantSettingEditorError("INVALID_SETTING");
 }
 if(spec.key==="policy.superadmin.ipAllowlist"){
  for(const rawRange of trimmed.split(",")){
   const [ip,mask,...extra]=rawRange.trim().split("/");
   const version=isIP(ip??"");
   if(!version||extra.length||mask!==undefined&&(!/^\d{1,3}$/.test(mask)||
      Number(mask)<0||Number(mask)>(version===4?32:128)))
    throw new TenantSettingEditorError("INVALID_SETTING");
  }
 }
 return trimmed;
}
async function scope(ctx:RequestContext,scopeType:"GLOBAL"|"COLLEGE",rawCollegeId:string|undefined){
 if(!isSuperAdmin(ctx))throw new AuthorizationError("admin-scope.select");
 requirePermission(ctx,"admin-scope.select");
 if(scopeType==="GLOBAL"){
  if(ctx.adminScope?.collegeId||ctx.adminScope?.organizationId)
   throw new TenantSettingEditorError("SETTING_SCOPE_DENIED");
  return {scopeId:"GLOBAL",collegeId:null,organizationId:null};
 }
 const id=z.uuid().parse(rawCollegeId);
 if(ctx.adminScope?.collegeId!==id)throw new TenantSettingEditorError("SETTING_SCOPE_DENIED");
 const [college]=await getDb().select({id:colleges.id,organizationId:colleges.organizationId}).from(colleges)
  .where(and(eq(colleges.id,id),eq(colleges.status,"ACTIVE"))).limit(1);
 if(!college)throw new TenantSettingEditorError("SETTING_SCOPE_DENIED");
 requirePermission(ctx,"college.manage",{collegeId:id,organizationId:college.organizationId});
 return {scopeId:id,collegeId:id,organizationId:college.organizationId};
}
export async function listAdminTenantSettings(ctx:RequestContext,kind:"GLOBAL"|"COLLEGE",collegeId?:string){
 const selected=await scope(ctx,kind,collegeId);
 const present=await getDb().execute(sql<{ready:boolean}>`select to_regclass('public.platform_setting_overrides') is not null as ready`);
 if(!present.rows[0]?.ready)return {ready:false,scope:kind,scopeId:selected.scopeId,entries:[]};
 const rows=await getDb().select({key:platformSettingOverrides.key,value:platformSettingOverrides.value,
  version:platformSettingOverrides.version}).from(platformSettingOverrides)
  .where(and(eq(platformSettingOverrides.scopeType,kind),eq(platformSettingOverrides.scopeId,selected.scopeId)));
 return {ready:true,scope:kind,scopeId:selected.scopeId,entries:rows};
}
/** Each key is committed and audited independently so unrelated, valid edits
 * survive stale versions or invalid entries. No credentials are accepted. */
export async function saveAdminTenantSettings(ctx:RequestContext,raw:unknown){
 const parsed=input.parse(raw);
 const target=await scope(ctx,parsed.scopeType,parsed.collegeId);
 const seen=new Set<string>();
 const updates:{key:string;status:"SAVED"|"DELETED"|"FAILED";message:string;version?:number}[]=[];
 const present=await getDb().execute(sql<{ready:boolean}>`select to_regclass('public.platform_setting_overrides') is not null as ready`);
 if(!present.rows[0]?.ready)throw new TenantSettingEditorError("SETTINGS_STORAGE_PENDING");
 for(const change of parsed.changes){
  try{
   const spec=LEGACY_TENANT_SETTING_MAP.get(change.key);
   if(!spec||spec.scope!==parsed.scopeType||seen.has(change.key))
    throw new TenantSettingEditorError("INVALID_SETTING");
   seen.add(change.key);
   if(spec.dangerous&&!parsed.confirmedHighImpact)throw new TenantSettingEditorError("INVALID_SETTING");
   const value=canonical(spec,change.value);
   const outcome=await getDb().transaction(async tx=>{
    await assertPersistedPlatformPermission(tx,ctx,
     target.collegeId?"college.manage":"admin-scope.select",
     target.collegeId?{collegeId:target.collegeId,organizationId:target.organizationId!}:undefined);
    const [current]=await tx.select({version:platformSettingOverrides.version,
      value:platformSettingOverrides.value}).from(platformSettingOverrides)
     .where(and(eq(platformSettingOverrides.scopeType,parsed.scopeType),
       eq(platformSettingOverrides.scopeId,target.scopeId),eq(platformSettingOverrides.key,spec.key)))
     .for("update").limit(1);
    if((current?.version??0)!==change.expectedVersion)
     throw new TenantSettingEditorError("SETTING_STALE");
    let version=current?.version??0;
    if(value===null){
     await tx.delete(platformSettingOverrides).where(and(eq(platformSettingOverrides.scopeType,parsed.scopeType),
      eq(platformSettingOverrides.scopeId,target.scopeId),eq(platformSettingOverrides.key,spec.key)));
     version=0;
    }else{
     version++;
     await tx.insert(platformSettingOverrides).values({scopeType:parsed.scopeType,
       scopeId:target.scopeId,key:spec.key,value,version,updatedByUserId:ctx.user.id})
      .onConflictDoUpdate({target:[platformSettingOverrides.scopeType,platformSettingOverrides.scopeId,platformSettingOverrides.key],
       set:{value,version,updatedByUserId:ctx.user.id,updatedAt:new Date()}});
    }
    await tx.insert(activityEvents).values({module:"PLATFORM",eventType:"platform.setting.updated",
      organizationId:target.organizationId,collegeId:target.collegeId,actorUserId:ctx.user.id,
      subjectType:"platform_setting",subjectId:spec.key,summary:"Tenant setting changed",
      metadata:{key:spec.key,scope:parsed.scopeType,action:value===null?"DEFAULT":"OVERRIDE",
       previousVersion:current?.version??0,version,requiresDeployment:spec.dangerous},
    });
    return version;
   });
   updates.push({key:spec.key,status:value===null?"DELETED":"SAVED",
    message:value===null?"Restored source default":"Override saved (activation depends on consumer)",version:outcome});
  }catch(error){updates.push({key:change.key,status:"FAILED",message:error instanceof TenantSettingEditorError?
    error.code:"Could not save this setting"});}
 }
 return {results:updates,saved:updates.filter(item=>item.status!=="FAILED").length,failed:updates.filter(item=>item.status==="FAILED").length};
}


/** SA-tenants-modules-40: free-form stored values are deliberately NOT
 * executable configuration; never store credentials here. */
const unlistedKey=z.string().min(1).max(120).regex(/^[A-Za-z][A-Za-z0-9._-]*$/);
const unlistedBase=z.strictObject({
 scopeType:z.enum(["GLOBAL","COLLEGE"]),collegeId:z.uuid().optional(),key:unlistedKey,
});
const unlistedCreate=unlistedBase.extend({value:z.string().trim().min(1).max(4096)});
const unlistedRemove=unlistedBase.extend({expectedVersion:z.number().int().positive()});
function assertUnlistedSettingKey(key:string){
 if(LEGACY_TENANT_SETTING_MAP.has(key)||
  /secret|token|password|credential|api[._-]?key|private[._-]?key/i.test(key))
  throw new TenantSettingEditorError("INVALID_SETTING");
}
export async function addUnlistedTenantSetting(ctx:RequestContext,raw:unknown){
 const input=unlistedCreate.parse(raw);
 const target=await scope(ctx,input.scopeType,input.collegeId);
 assertUnlistedSettingKey(input.key);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,
   target.collegeId?"college.manage":"admin-scope.select",
   target.collegeId?{collegeId:target.collegeId,organizationId:target.organizationId!}:undefined);
  const [created]=await tx.insert(platformSettingOverrides).values({
   scopeType:input.scopeType,scopeId:target.scopeId,key:input.key,
   value:input.value,updatedByUserId:ctx.user.id,
  }).onConflictDoNothing().returning({key:platformSettingOverrides.key});
  if(!created)throw new TenantSettingEditorError("SETTING_STALE");
  await tx.insert(activityEvents).values({
   module:"PLATFORM",eventType:"platform.setting.updated",
   organizationId:target.organizationId,collegeId:target.collegeId,actorUserId:ctx.user.id,
   subjectType:"platform_setting",subjectId:input.key,summary:"Unlisted tenant setting added",
   metadata:{key:input.key,scope:input.scopeType,action:"ADDED_UNLISTED",operationalReader:false},
  });
  return {key:created.key,status:"SAVED" as const};
 });
}
export async function removeUnlistedTenantSetting(ctx:RequestContext,raw:unknown){
 const input=unlistedRemove.parse(raw);
 const target=await scope(ctx,input.scopeType,input.collegeId);
 const known=LEGACY_TENANT_SETTING_MAP.get(input.key);
 if(known?.scope===input.scopeType)throw new TenantSettingEditorError("INVALID_SETTING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,
   target.collegeId?"college.manage":"admin-scope.select",
   target.collegeId?{collegeId:target.collegeId,organizationId:target.organizationId!}:undefined);
  const where=and(eq(platformSettingOverrides.scopeType,input.scopeType),
   eq(platformSettingOverrides.scopeId,target.scopeId),eq(platformSettingOverrides.key,input.key));
  const [current]=await tx.select({version:platformSettingOverrides.version})
   .from(platformSettingOverrides).where(where).for("update").limit(1);
  if(!current||current.version!==input.expectedVersion)
   throw new TenantSettingEditorError("SETTING_STALE");
  await tx.delete(platformSettingOverrides).where(where);
  await tx.insert(activityEvents).values({
   module:"PLATFORM",eventType:"platform.setting.updated",
   organizationId:target.organizationId,collegeId:target.collegeId,actorUserId:ctx.user.id,
   subjectType:"platform_setting",subjectId:input.key,summary:"Unlisted tenant setting removed",
   metadata:{key:input.key,scope:input.scopeType,action:"REMOVED_UNLISTED",
    previousVersion:current.version,operationalReader:false},
  });
  return {key:input.key,status:"DELETED" as const};
 });
}
