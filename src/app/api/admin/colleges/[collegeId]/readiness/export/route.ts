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
  if(!data)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  return new Response(buildSuperAdminReadinessCsv(data.college,data.evaluation),{
   headers:{"content-type":"text/csv; charset=utf-8",
    "content-disposition":'attachment; filename="college-readiness-evidence.csv"',
    "cache-control":"private, no-store"}
  });
 }catch(error){return apiErrorResponse(error);}
}
