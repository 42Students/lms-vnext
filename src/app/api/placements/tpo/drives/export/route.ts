import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {exportTpoDriveLifecycle} from "@/modules/placements/tpo-drive-list-export-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const query={...Object.fromEntries(params),ids:params.getAll("ids")};
  const result=await exportTpoDriveLifecycle(await getCurrentRequestContext(),query);
  return new Response("\uFEFF"+result.csv,{
   status:200,headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="'+result.fileName+'"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"},
  });
 }catch(error){return apiErrorResponse(error);}
}
