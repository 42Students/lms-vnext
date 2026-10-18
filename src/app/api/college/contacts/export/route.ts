import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {parseCollegeContactsExportParams} from "@/modules/people/college-contacts-export-model";
import {exportCollegeContactsCsv} from "@/modules/people/college-contacts-export-service";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const input=parseCollegeContactsExportParams(new URL(request.url).searchParams);
  const report=await exportCollegeContactsCsv(await getCurrentRequestContext(),input);
  return new Response(report.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="college-contacts.csv"',
   "Cache-Control":"private, no-store",
   "X-Export-Total":String(report.total),
   "X-Export-Truncated":String(report.truncated),
  }});
 }catch(error){
  if(error instanceof Error&&error.message==="INVALID_CONTACT_EXPORT")
   return NextResponse.json({
    error:"INVALID_CONTACT_EXPORT",
    message:"Contact export filters are invalid. Clear the filters and try again.",
   },{status:400,headers:{"Cache-Control":"private, no-store",Vary:"Cookie"}});
  return apiErrorResponse(error);
 }
}
