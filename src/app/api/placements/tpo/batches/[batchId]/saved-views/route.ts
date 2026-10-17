import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoBatchSavedViews,mutateTpoBatchSavedView}
 from "@/modules/placements/tpo-batch-saved-view-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Params={params:Promise<{batchId:string}>};
export async function GET(_request:Request,{params}:Params){
 try{
  const {batchId}=await params;
  return NextResponse.json(await listTpoBatchSavedViews(await getCurrentRequestContext(),batchId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {batchId}=await params;
  return NextResponse.json(await mutateTpoBatchSavedView(await getCurrentRequestContext(),batchId,await request.json()),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
