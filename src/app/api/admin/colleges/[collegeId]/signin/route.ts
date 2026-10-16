import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {CollegeSignInPolicyError,saveAdminCollegeSignInPolicy} from "@/modules/colleges/admin-signin-policy-service";
export const runtime="nodejs";
export async function PUT(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const body=await request.json();
  const {collegeId}=await params;
  if(body?.collegeId!==collegeId)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const policy=await saveAdminCollegeSignInPolicy(await getCurrentRequestContext(),body);
  return NextResponse.json({policy},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof CollegeSignInPolicyError)return NextResponse.json({error:error.code},{
   status:error.code==="SIGNIN_STORAGE_PENDING"?503:409});
  return apiErrorResponse(error);
 }
}
