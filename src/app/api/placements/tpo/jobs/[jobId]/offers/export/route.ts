import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoDriveOfferRegisterCsv } from "@/modules/placements/tpo-drive-offer-register-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{
 params:Promise<{jobId:string}>;
}){
 if(process.env.DB09_TPO_API_READY!=="DB09_VERIFIED")return NextResponse.json(
  {error:"DB09_MIGRATIONS_PENDING"},{status:503,headers:{"Cache-Control":"private, no-store, max-age=0"}});
 try{
  const {jobId}=await params;
  const url=new URL(request.url);
  const result=await getTpoDriveOfferRegisterCsv(await getCurrentRequestContext(),
   {jobId,...Object.fromEntries(url.searchParams.entries())});
  return new Response("\uFEFF"+result.csv,{status:200,headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="tpo-drive-offers.csv"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "Vary":"Cookie",
   "X-Export-Truncated":String(result.truncated),
  }});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
