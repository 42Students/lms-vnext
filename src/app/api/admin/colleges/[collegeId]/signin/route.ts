import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readAdminSignInRequestBody,AdminSignInRequestError} from "@/modules/colleges/admin-signin-request-body";
import {CollegeSignInPolicyError,readAdminCollegeSignInPolicy,saveAdminCollegeSignInPolicy} from "@/modules/colleges/admin-signin-policy-service";
export const runtime="nodejs";
/** Legacy branding readers consume data.branding.loginMethods or
 * data.data.branding.loginMethods; do not expose unrelated tenant branding.
 */
export async function GET(_request:Request,{params}:{params:Promise<{collegeId:string}>}){
 try{
  const {collegeId}=await params;
  const state=await readAdminCollegeSignInPolicy(await getCurrentRequestContext(),collegeId);
  if(state.policy.kind==="MIGRATION_PENDING")
   return NextResponse.json({error:"SIGNIN_STORAGE_PENDING"},{status:503,
    headers:{"Cache-Control":"private, no-store"}});
  if(state.policy.kind==="INVALID_POLICY")
   return NextResponse.json({error:"SIGNIN_POLICY_INVALID"},{status:409,
    headers:{"Cache-Control":"private, no-store"}});
  const legacyMethod=state.policy.method==="EMAIL_AND_PHONE"?"EMAIL_PHONE"
   :state.policy.method==="PHONE_AND_EMAIL"?"PHONE_EMAIL"
   :state.policy.method??"EMAIL_PHONE";
  const branding={loginMethods:legacyMethod};
  return NextResponse.json({
   branding,data:{branding},policy:state.policy,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function PUT(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const body=await readAdminSignInRequestBody(request);
  const {collegeId}=await params;
  if(!body||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const record=body as Record<string,unknown>;
  // Old clients submitted {branding:{loginMethods}}. Translate only this
  // field; do not overwrite a college's logos, colors or any other branding.
  // Even a legacy update requires a known version (body or If-Match), never
  // a blind overwrite of a concurrent administrator's policy.
  const branding=record.branding;
  const legacy=branding&&typeof branding==="object"&&!Array.isArray(branding)
    ?(branding as Record<string,unknown>).loginMethods:undefined;
  const token=request.headers.get("if-match");
  const ifMatch=token&&/^(?:W\/)?\"?[0-9]{1,9}\"?$/.test(token)
    ?Number(token.replace(/[^0-9]/g,"")):null;
  const expected=record.expectedVersion??ifMatch;
  if(legacy!==undefined&&(expected===null||expected===undefined))
   return NextResponse.json({error:"SIGNIN_POLICY_VERSION_REQUIRED",
      message:"Refresh sign-in settings before saving this college."},{status:428});
  const payload=legacy!==undefined
    ?{collegeId,method:legacy,expectedVersion:expected}
    :record;
  if(!("collegeId" in payload)||payload.collegeId!==collegeId)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const policy=await saveAdminCollegeSignInPolicy(context,payload);
  return NextResponse.json({policy},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof AdminSignInRequestError)return NextResponse.json({error:"INVALID_REQUEST"},{
   status:error.code==="BODY_TOO_LARGE"?413:400,
   headers:{"Cache-Control":"private, no-store"},
  });
  if(error instanceof CollegeSignInPolicyError)return NextResponse.json({error:error.code},{
   status:error.code==="SIGNIN_STORAGE_PENDING"?503:409});
  return apiErrorResponse(error);
 }
}
