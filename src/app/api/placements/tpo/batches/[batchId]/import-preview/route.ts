import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getBatchEligibilityImportPreview} from "@/modules/placements/tpo-batch-import-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{batchId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {batchId}=await params;
  const preview=await getBatchEligibilityImportPreview(await getCurrentRequestContext(),batchId,await request.json());
  return NextResponse.json(preview,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
