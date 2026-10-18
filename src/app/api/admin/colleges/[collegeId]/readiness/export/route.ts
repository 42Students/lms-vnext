import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminCollegeReadiness} from "@/modules/colleges/readiness-service";
import {buildSuperAdminReadinessCsv} from "@/modules/colleges/admin-readiness-export-model";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{collegeId:string}>}){
 try {
  const {collegeId}=await params;
  const id=z.uuid().parse(collegeId);
  const data=await getSuperAdminCollegeReadiness(await getCurrentRequestContext(),id);
  if(!data)return NextResponse.json({error:"NOT_FOUND",message:"College readiness evidence was not found."},{
   status:404,headers:{"Cache-Control":"private, no-store",Vary:"Cookie"},
  });
  return new Response(buildSuperAdminReadinessCsv(data.college,data.evaluation),{
   headers:{"content-type":"text/csv; charset=utf-8",
    "content-disposition":'attachment; filename="college-readiness-evidence.csv"',
    "cache-control":"private, no-store",
    "x-content-type-options":"nosniff",Vary:"Cookie"}
  });
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store");
  response.headers.set("Vary","Cookie");
  return response;
 }
}
