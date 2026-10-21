import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listAdminTenantSettings,saveAdminTenantSettings,addUnlistedTenantSetting,removeUnlistedTenantSetting,TenantSettingEditorError}
 from "@/modules/platform-settings/admin-editor-service";
import {listOrganizationTenantSettings,saveOrganizationTenantSettings,removeOrganizationTenantSetting,OrganizationSettingsError}
 from "@/modules/platform-settings/organization-settings-service";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const q=new URL(request.url).searchParams;
  const scope=q.get("scope");
  if(scope==="ORG"||scope==="ORGANIZATION")return NextResponse.json(await listOrganizationTenantSettings(
   await getCurrentRequestContext(),q.get("organizationId")??""),
   {headers:{"Cache-Control":"private, no-store","X-Legacy-Org-Settings":"read-only-compat"}});
  if(scope!=="GLOBAL"&&scope!=="COLLEGE")
   return NextResponse.json({error:"INVALID_SCOPE",message:scope==="ORG"||scope==="ORGANIZATION"
    ?"Organization overrides are not writable in the registered GLOBAL/COLLEGE settings schema. Select a college or global scope.":"Select a global or college scope."},{status:400});
  return NextResponse.json(await listAdminTenantSettings(await getCurrentRequestContext(),scope,q.get("collegeId")??undefined),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const body:unknown=await request.json();
  if(!body||typeof body!=="object"||Array.isArray(body)||
     !("changes" in body)||!Array.isArray(body.changes)||body.changes.length===0)
   return NextResponse.json({error:"EMPTY_BODY",message:"Select at least one setting to save.",
    fieldErrors:{changes:"Add at least one setting change."}},{status:400});
  const result=(body as {scopeType?:unknown}).scopeType==="ORG"
   ?await saveOrganizationTenantSettings(await getCurrentRequestContext(),body)
   :await saveAdminTenantSettings(await getCurrentRequestContext(),body);
  return NextResponse.json({...result,
   perKeyErrors:"results" in result&&Array.isArray(result.results)
    ?result.results.filter((row:{status:string})=>row.status==="FAILED"):[],
   partial:"failed" in result&&typeof result.failed==="number"&&result.failed>0,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof OrganizationSettingsError)
   return NextResponse.json({error:error.code},{
    status:error.code==="SETTINGS_STORAGE_PENDING"?503:error.code==="SETTING_SCOPE_DENIED"?403:409,
    headers:{"Cache-Control":"private, no-store"}});
  if(error instanceof TenantSettingEditorError)return NextResponse.json({error:error.code},{
   status:error.code==="SETTINGS_STORAGE_PENDING"?503:error.code==="SETTING_SCOPE_DENIED"?403:error.code==="EMPTY_BODY"?400:409,
   headers:{"Cache-Control":"private, no-store"}});
  return apiErrorResponse(error);
 }
}

/** Legacy TenantSettings PUT adapter: an arbitrary map is NOT accepted
 * without explicit per-key versions and the current verified scope. Convert
 * at most 31 fields to independently auditable and recoverable PATCH commands.
 * Unlisted setting creation and deletion remain POST/DELETE respectively. */
export async function PUT(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw:unknown=await request.json();
  if(!raw||typeof raw!=="object"||Array.isArray(raw))
   return NextResponse.json({error:"INVALID_REQUEST",message:"Supply a versioned settings map."},{status:400});
  const body=raw as Record<string,unknown>;
  const settings=body.settings,versions=body.expectedVersions;
  if(!settings||typeof settings!=="object"||Array.isArray(settings)||
     !versions||typeof versions!=="object"||Array.isArray(versions))
   return NextResponse.json({error:"INVALID_REQUEST",message:"settings and expectedVersions maps are required."},{status:400});
  const pairs=Object.entries(settings);
  if(pairs.length<1||pairs.length>31)
   return NextResponse.json({error:"INVALID_REQUEST",message:"Save 1–31 settings at a time."},{status:400});
  const changes=pairs.map(([key,value])=>({
   key,value,expectedVersion:(versions as Record<string,unknown>)[key],
  }));
  if(changes.some(row=>!Object.hasOwn(versions,row.key)||
    typeof row.value!=="string"||typeof row.expectedVersion!=="number"||
    !Number.isSafeInteger(row.expectedVersion)||row.expectedVersion<0))
   return NextResponse.json({error:"INVALID_REQUEST",message:"Each setting needs a string value and current numeric version."},{status:400});
  const result=await saveAdminTenantSettings(await getCurrentRequestContext(),{
   scopeType:body.scopeType,collegeId:body.collegeId,
   confirmedHighImpact:body.confirmedHighImpact===true,changes,
  });
  return NextResponse.json({...result,perKeyErrors:result.results.filter(row=>row.status==="FAILED"),
   partial:result.failed>0,legacyCompatibility:"VERSIONED_MAP"},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}

/** SA-tenants-modules-40: separately guarded free-form inventory edits. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await addUnlistedTenantSetting(await getCurrentRequestContext(),await request.json());
  return NextResponse.json({...result,message:"Tenant setting added successfully"},
   {status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TenantSettingEditorError)
   return NextResponse.json({error:error.code},{status:error.code==="SETTING_STALE"?409:403});
  return apiErrorResponse(error);
 }
}
export async function DELETE(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const body:unknown=await request.json();
  const result=body&&typeof body==="object"&&!Array.isArray(body)&&
   (body as {scopeType?:unknown}).scopeType==="ORG"
   ?await removeOrganizationTenantSetting(await getCurrentRequestContext(),body)
   :await removeUnlistedTenantSetting(await getCurrentRequestContext(),body);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof OrganizationSettingsError)
   return NextResponse.json({error:error.code},{status:error.code==="SETTING_SCOPE_DENIED"?403:409});
  if(error instanceof TenantSettingEditorError)
   return NextResponse.json({error:error.code},{status:error.code==="SETTING_STALE"?409:403});
  return apiErrorResponse(error);
 }
}
