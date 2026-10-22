import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {grantCollegeStudentPlacementResume} from "@/modules/placements/college-student-resume-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{membershipId:string}>};

export async function GET(_request:Request,{params}:Context){
 try{
  const context=await getCurrentRequestContext();
  const {membershipId}=await params;
  const grant=await grantCollegeStudentPlacementResume(context,membershipId);
  return NextResponse.redirect(grant.url,{status:303,headers:{
   "Cache-Control":"private, no-store, max-age=0",
   "Referrer-Policy":"no-referrer",
   "X-Content-Type-Options":"nosniff",
  }});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
