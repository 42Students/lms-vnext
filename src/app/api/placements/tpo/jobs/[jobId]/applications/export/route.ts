import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoDriveApplicationsExport} from "@/modules/placements/tpo-drive-applications-export-service";
import {tpoDriveApplicationsExportQuerySchema} from "@/modules/placements/tpo-drive-applications-export-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{jobId:string}>}){
 try{
  const {jobId}=await params;
  const filters=tpoDriveApplicationsExportQuerySchema.omit({jobId:true})
   .parse(Object.fromEntries(new URL(request.url).searchParams));
  const result=await getTpoDriveApplicationsExport(await getCurrentRequestContext(),{jobId,...filters},{exportAll:true});
  return new Response("\uFEFF"+result.csv,{status:200,headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("tpo-drive-applications", "csv") + '"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",Vary:"Cookie",
   "X-Export-Truncated":String(result.truncated),
  }});
 }catch(error){const response=apiErrorResponse(error);response.headers.set("Cache-Control","private, no-store, max-age=0");return response;}
}
