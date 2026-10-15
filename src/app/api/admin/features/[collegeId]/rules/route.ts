import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminCollegeFeatureSnapshot} from "@/modules/module-access/admin-college-rule-read";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{collegeId:string}>}){
 try{
  const {collegeId}=await params;
  const result=await getSuperAdminCollegeFeatureSnapshot(await getCurrentRequestContext(),collegeId);
  if(!result)return NextResponse.json({error:"NOT_FOUND"},{status:404,headers:{"cache-control":"private, no-store"}});
  return NextResponse.json(result,{headers:{"cache-control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
