import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {parseCollegeRoleDirectoryExportQuery} from "@/modules/people/college-role-directory-export";
import {exportCollegeRoleDirectoryCsv} from "@/modules/people/college-role-directory-export-service";

export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const {kind,filter}=parseCollegeRoleDirectoryExportQuery(new URL(request.url).searchParams);
  const report=await exportCollegeRoleDirectoryCsv(await getCurrentRequestContext(),kind,filter);
  return new Response(report.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="college-'+(kind==="FACULTY"?"faculty":"students")+'-filtered.csv"',
   "Cache-Control":"private, no-store",
   "X-Export-Total":String(report.total),
   "X-Export-Truncated":String(report.truncated),
  }});
 }catch(error){
  if(error instanceof Error&&error.message==="INVALID_ROLE_DIRECTORY_EXPORT")
   return NextResponse.json({error:"INVALID_ROLE_DIRECTORY_EXPORT"},{status:400});
  return apiErrorResponse(error);
 }
}
