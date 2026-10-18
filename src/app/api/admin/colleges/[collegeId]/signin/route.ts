import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readAdminSignInRequestBody,AdminSignInRequestError} from "@/modules/colleges/admin-signin-request-body";
import {CollegeSignInPolicyError,saveAdminCollegeSignInPolicy} from "@/modules/colleges/admin-signin-policy-service";
export const runtime="nodejs";
export async function PUT(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const body=await readAdminSignInRequestBody(request);
  const {collegeId}=await params;
  if(!body||typeof body!=="object"||Array.isArray(body)||
     !("collegeId" in body)||body.collegeId!==collegeId)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const policy=await saveAdminCollegeSignInPolicy(context,body);
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
