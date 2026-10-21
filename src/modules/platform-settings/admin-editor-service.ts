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
import {PLACEMENT_POLICY_FIELDS,placementPolicyValidate} from "@/modules/placements/platform-placement-policy-model";

/** Historical TEXT settings above the storage limit require explicit archival; never truncate. */
export const TENANT_SETTING_STORAGE_MAX_CHARS=4096;
export const TENANT_SETTING_MAX_CHANGES=31;
const sensitiveSettingKey=(key:string)=>/secret|token|password|credential|api[._-]?key|private[._-]?key/i.test(key);
const entry=z.strictObject({key:z.string().min(1).max(120),value:z.string().max(TENANT_SETTING_STORAGE_MAX_CHARS),
 expectedVersion:z.number().int().nonnegative()});
const input=z.strictObject({scopeType:z.enum(["GLOBAL","COLLEGE"]),collegeId:z.uuid().optional(),
 confirmedHighImpact:z.boolean().default(false),changes:z.array(entry).min(1).max(TENANT_SETTING_MAX_CHANGES)});
export class TenantSettingEditorError extends Error{
 constructor(readonly code:"SETTINGS_STORAGE_PENDING"|"SETTING_SCOPE_DENIED"|"SETTING_STALE"|"INVALID_SETTING"|"EMPTY_BODY"|"CORE_COURSES_PROTECTED"){
  super(code);this.name="TenantSettingEditorError";
 }
}
/** No runtime hierarchy is inferred from this GLOBAL/COLLEGE override table. */
export const LEGACY_TENANT_SCOPES_READ_ONLY=["ORGANIZATION","DEPARTMENT","PROGRAM","BATCH","CLASS","LEARNER"] as const;
/** Legacy organization overrides are retired, never promoted to a college scope.
 * Historical cleanup requires a separately authorized migration/archive review;
 * this editor deliberately issues no writes to historic app_setting rows. */
export const RETIRED_LEGACY_SCOPE_POLICY={
 alias:"ORG",normalized:"ORGANIZATION",mode:"ARCHIVE_REVIEW_ONLY",
 warning:"Legacy organization and lower-level overrides are read-only historical scopes; no operational values are silently inherited.",
} as const;
export function normalizeLegacySettingScope(input:string|null|undefined){
 const scope=(input??"GLOBAL").trim().toUpperCase();
 return scope==="ORG"?"ORGANIZATION":scope||"GLOBAL";
}
export function tenantSettingActivationMessage(key:string):string {
  if(PLACEMENT_POLICY_FIELDS.some(field=>field.key===key))
    return "Placement policy reader connected; verify each consuming workflow.";
  if(LEGACY_TENANT_SETTING_MAP.get(key)?.dangerous)
    return "Deployment review required; saving does not reconfigure live authentication or SMS.";
  return "Stored setting only; runtime activation has not been verified.";
}
export function legacySettingRangeMessage(key:string,value:string):string|null{
  const spec=LEGACY_TENANT_SETTING_MAP.get(key);
  if(!spec||value.trim()===""||(spec.type!=="int"&&spec.type!=="decimal"))return null;
  const numeric=Number(value.trim());
  if(!Number.isFinite(numeric)||(spec.type==="int"&&!Number.isSafeInteger(numeric))||
    ("min" in spec&&spec.min!==undefined&&numeric<spec.min)||
    ("max" in spec&&spec.max!==undefined&&numeric>spec.max))
    return "Must be between "+("min" in spec?spec.min:0)+" and "+("max" in spec?spec.max:0);
  return null;
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
  return spec.type==="decimal"?trimmed:String(n);
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
 if(!present.rows[0]?.ready)return {ready:false,scope:kind,scopeId:selected.scopeId,entries:[],
  reason:"SETTINGS_STORAGE_PENDING" as const,unsupportedScopes:LEGACY_TENANT_SCOPES_READ_ONLY,
  legacyScopePolicy:RETIRED_LEGACY_SCOPE_POLICY,maxChangesPerRequest:TENANT_SETTING_MAX_CHANGES};
 const rows=await getDb().select({key:platformSettingOverrides.key,value:platformSettingOverrides.value,
  version:platformSettingOverrides.version}).from(platformSettingOverrides)
  .where(and(eq(platformSettingOverrides.scopeType,kind),eq(platformSettingOverrides.scopeId,selected.scopeId)));
 const stored=new Map(rows.map(row=>[row.key,row]));
 const entries=LEGACY_TENANT_SETTING_SPECS.filter(spec=>spec.scope===kind).map(spec=>{
  const row=stored.get(spec.key);
  return {key:spec.key,value:row?sensitiveSettingKey(row.key)?"[redacted]":row.value:"",
    version:row?.version??0,source:row?"OVERRIDE" as const:"DEFAULT" as const,
    inherited:!row,group:spec.group,activationMessage:tenantSettingActivationMessage(spec.key)};
 });
 const unlisted=rows.filter(row=>!LEGACY_TENANT_SETTING_MAP.has(row.key)).map(row=>({
  ...row,value:sensitiveSettingKey(row.key)?"[redacted]":row.value,
  source:"OVERRIDE" as const,inherited:false,group:"Unlisted",
  activationMessage:tenantSettingActivationMessage(row.key),
 }));
 return {ready:true,scope:kind,scopeId:selected.scopeId,
  unsupportedScopes:LEGACY_TENANT_SCOPES_READ_ONLY,legacyScopePolicy:RETIRED_LEGACY_SCOPE_POLICY,
  entries:[...entries,...unlisted],maxChangesPerRequest:TENANT_SETTING_MAX_CHANGES,
  changedCount:rows.length,groupCounts:[...new Set([...entries,...unlisted].map(row=>row.group))].map(group=>({
   group,count:[...entries,...unlisted].filter(row=>row.group===group&&row.source==="OVERRIDE").length,
  }))};
}
/** Each key is committed and audited independently so unrelated, valid edits
 * survive stale versions or invalid entries. No credentials are accepted. */
export async function saveAdminTenantSettings(ctx:RequestContext,raw:unknown){
 if(raw===null||raw===undefined||typeof raw!=="object"||Array.isArray(raw)||
  !("changes" in raw)||!Array.isArray(raw.changes)||raw.changes.length===0)
  throw new TenantSettingEditorError("EMPTY_BODY");

 const parsed=input.parse(raw);
 const target=await scope(ctx,parsed.scopeType,parsed.collegeId);
 const seen=new Set<string>();
 const updates:{key:string;status:"SAVED"|"DELETED"|"FAILED";message:string;version?:number}[]=[];
 const present=await getDb().execute(sql<{ready:boolean}>`select to_regclass('public.platform_setting_overrides') is not null as ready`);
 if(!present.rows[0]?.ready)throw new TenantSettingEditorError("SETTINGS_STORAGE_PENDING");
 for(const change of parsed.changes){
  try{
   const spec=LEGACY_TENANT_SETTING_MAP.get(change.key);
   if(!spec&&/^(?:module[._-])?courses(?:[._-]|$)/i.test(change.key))
    throw new TenantSettingEditorError("CORE_COURSES_PROTECTED");
   if(!spec||spec.scope!==parsed.scopeType||seen.has(change.key))
    throw new TenantSettingEditorError("INVALID_SETTING");
   seen.add(change.key);
   if(spec.dangerous&&!parsed.confirmedHighImpact)throw new TenantSettingEditorError("INVALID_SETTING");
   if(legacySettingRangeMessage(spec.key,change.value))throw new TenantSettingEditorError("INVALID_SETTING");
   const value=canonical(spec,change.value);
   const placementPolicy=parsed.scopeType==="GLOBAL"?PLACEMENT_POLICY_FIELDS.find(field=>field.key===spec.key):undefined;
   if(placementPolicy&&value!==null&&!placementPolicyValidate(placementPolicy.key,Number(value)))
    throw new TenantSettingEditorError("INVALID_SETTING");
   const outcome=await getDb().transaction(async tx=>{
    // The dedicated placement editor shares this exact advisory lock; without
    // it simultaneous edits through the two administrator screens race.
    if(placementPolicy)await tx.execute(sql`select pg_advisory_xact_lock(42, 130038)`);
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
    if(spec.key==="interview.durationMinMinutes"||spec.key==="interview.durationMaxMinutes"){
     const otherKey=spec.key==="interview.durationMinMinutes"?"interview.durationMaxMinutes":"interview.durationMinMinutes";
     const [other]=await tx.select({value:platformSettingOverrides.value}).from(platformSettingOverrides)
      .where(and(eq(platformSettingOverrides.scopeType,"GLOBAL"),eq(platformSettingOverrides.scopeId,"GLOBAL"),
       eq(platformSettingOverrides.key,otherKey))).limit(1);
     const otherDefault=PLACEMENT_POLICY_FIELDS.find(field=>field.key===otherKey)!.defaultValue;
     const selfDefault=PLACEMENT_POLICY_FIELDS.find(field=>field.key===spec.key)!.defaultValue;
     const thisValue=value===null?selfDefault:Number(value);
     const otherValue=other?Number(other.value):otherDefault;
     const minimum=spec.key==="interview.durationMinMinutes"?thisValue:otherValue;
     const maximum=spec.key==="interview.durationMaxMinutes"?thisValue:otherValue;
     if(!placementPolicyValidate("interview.durationMinMinutes",minimum)||
        !placementPolicyValidate("interview.durationMaxMinutes",maximum)||minimum>maximum)
      throw new TenantSettingEditorError("INVALID_SETTING");
    }
    let version=current?.version??0;
    if(value===null){
     if(current)await tx.delete(platformSettingOverrides).where(and(eq(platformSettingOverrides.scopeType,parsed.scopeType),
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
       previousVersion:current?.version??0,version,requiresDeployment:spec.dangerous,
       previousValue:current&&!sensitiveSettingKey(spec.key)?current.value.slice(0,TENANT_SETTING_STORAGE_MAX_CHARS):undefined,
       previousValueRedacted:Boolean(current&&sensitiveSettingKey(spec.key)),
       effectiveSource:value===null?"DEFAULT":"OVERRIDE",unchangedReset:value===null&&!current},
    });
    return version;
   });
   updates.push({key:spec.key,status:value===null?"DELETED":"SAVED",
    message:value===null?"Restored source default (no override remains). "+tenantSettingActivationMessage(spec.key):
     "Override saved. "+tenantSettingActivationMessage(spec.key),version:outcome});
  }catch(error){
   const message=error instanceof TenantSettingEditorError&&error.code==="CORE_COURSES_PROTECTED"
    ?"Courses is a core module and cannot be toggled":
    legacySettingRangeMessage(change.key,change.value)??
    (error instanceof TenantSettingEditorError?error.code:"Could not save this setting");
   updates.push({key:change.key,status:"FAILED",message});
  }
 }
 return {results:updates,saved:updates.filter(item=>item.status!=="FAILED").length,
  failed:updates.filter(item=>item.status==="FAILED").length,
  commitMode:"PER_KEY_PARTIAL" as const,atomicSupported:false,
  maxChangesPerRequest:TENANT_SETTING_MAX_CHANGES,
  note:"Each key commits independently; failed keys do not roll back saved keys. Refresh stored versions and preserve unsaved drafts when reconciling conflicts."};
}


/** SA-tenants-modules-40: free-form stored values are deliberately NOT
 * executable configuration; never store credentials here. */
const unlistedKey=z.string().min(1).max(120).regex(/^[A-Za-z][A-Za-z0-9._-]*$/);
const unlistedBase=z.strictObject({
 scopeType:z.enum(["GLOBAL","COLLEGE"]),collegeId:z.uuid().optional(),key:unlistedKey,
});
const unlistedCreate=unlistedBase.extend({value:z.string().trim().min(1).max(TENANT_SETTING_STORAGE_MAX_CHARS)});
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
  const [current]=await tx.select({version:platformSettingOverrides.version,value:platformSettingOverrides.value})
   .from(platformSettingOverrides).where(where).for("update").limit(1);
  if(!current||current.version!==input.expectedVersion)
   throw new TenantSettingEditorError("SETTING_STALE");
  await tx.delete(platformSettingOverrides).where(where);
  await tx.insert(activityEvents).values({
   module:"PLATFORM",eventType:"platform.setting.updated",
   organizationId:target.organizationId,collegeId:target.collegeId,actorUserId:ctx.user.id,
   subjectType:"platform_setting",subjectId:input.key,summary:"Unlisted tenant setting removed",
   metadata:{key:input.key,scope:input.scopeType,action:"REMOVED_UNLISTED",
    previousVersion:current.version,operationalReader:false,
    previousValue:sensitiveSettingKey(input.key)?undefined:current.value.slice(0,TENANT_SETTING_STORAGE_MAX_CHARS),
    previousValueRedacted:sensitiveSettingKey(input.key)},
  });
  return {key:input.key,status:"DELETED" as const};
 });
}

/** Explicit single-key read status: absent override != unavailable storage. */
export async function getAdminTenantSettingState(
 context:RequestContext,kind:"GLOBAL"|"COLLEGE",key:string,collegeId?:string,
):Promise<{state:"UNAVAILABLE"|"UNSET"|"OVERRIDDEN";value?:string;version?:number;activationMessage?:string}> {
 const selected=await scope(context,kind,collegeId);
 const present=await getDb().execute(sql<{ready:boolean}>`select to_regclass('public.platform_setting_overrides') is not null as ready`);
 if(!present.rows[0]?.ready)return {state:"UNAVAILABLE"};
 const [entry]=await getDb().select({value:platformSettingOverrides.value,version:platformSettingOverrides.version})
  .from(platformSettingOverrides).where(and(
   eq(platformSettingOverrides.scopeType,kind),eq(platformSettingOverrides.scopeId,selected.scopeId),
   eq(platformSettingOverrides.key,key))).limit(1);
 if(!entry)return {state:"UNSET",activationMessage:tenantSettingActivationMessage(key)};
 return {state:"OVERRIDDEN",version:entry.version,
   value:sensitiveSettingKey(key)?"[redacted]":entry.value,
   activationMessage:tenantSettingActivationMessage(key)};
}
