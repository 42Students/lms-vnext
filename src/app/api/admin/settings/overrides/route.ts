import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listAdminTenantSettings,saveAdminTenantSettings,addUnlistedTenantSetting,removeUnlistedTenantSetting,TenantSettingEditorError}
 from "@/modules/platform-settings/admin-editor-service";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const q=new URL(request.url).searchParams;
  const scope=q.get("scope");
  if(scope!=="GLOBAL"&&scope!=="COLLEGE")
   return NextResponse.json({error:"INVALID_SCOPE"},{status:400});
  return NextResponse.json(await listAdminTenantSettings(await getCurrentRequestContext(),scope,q.get("collegeId")??undefined),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const body=await request.json();
  const result=await saveAdminTenantSettings(await getCurrentRequestContext(),body);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TenantSettingEditorError)return NextResponse.json({error:error.code},{
   status:error.code==="SETTINGS_STORAGE_PENDING"?503:error.code==="SETTING_SCOPE_DENIED"?403:409,
   headers:{"Cache-Control":"private, no-store"}});
  return apiErrorResponse(error);
 }
}

/** SA-tenants-modules-40: separately guarded free-form inventory edits. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await addUnlistedTenantSetting(await getCurrentRequestContext(),await request.json());
  return NextResponse.json(result,{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TenantSettingEditorError)
   return NextResponse.json({error:error.code},{status:error.code==="SETTING_STALE"?409:403});
  return apiErrorResponse(error);
 }
}
export async function DELETE(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await removeUnlistedTenantSetting(await getCurrentRequestContext(),await request.json());
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TenantSettingEditorError)
   return NextResponse.json({error:error.code},{status:error.code==="SETTING_STALE"?409:403});
  return apiErrorResponse(error);
 }
}
