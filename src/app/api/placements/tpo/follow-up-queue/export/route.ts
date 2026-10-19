import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoFollowupQueueCsv} from "@/modules/placements/tpo-followup-queue-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 if(process.env.DB09_TPO_API_READY!=="DB09_VERIFIED")
  return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503,
   headers:{"Cache-Control":"private, no-store, max-age=0"}});
 try{
  const query=Object.fromEntries(new URL(request.url).searchParams.entries());
  const result=await getTpoFollowupQueueCsv(await getCurrentRequestContext(),query);
  return new Response("\uFEFF"+result.csv,{status:200,headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("tpo-recruiter-followups", "csv") + '"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff","Vary":"Cookie",
   "X-Export-Truncated":String(result.truncated),
  }});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
