import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminCollegeAtGlance} from "@/modules/colleges/admin-college-at-glance-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handleGET(_request:Request,{params}:{params:Promise<{collegeId:string}>}){
 try{
  const {collegeId}=await params;
  const data=await getSuperAdminCollegeAtGlance(await getCurrentRequestContext(),collegeId);
  return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
