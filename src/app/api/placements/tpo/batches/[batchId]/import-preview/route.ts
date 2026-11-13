import { boundedRequestJson } from "@/lib/request-body";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getBatchEligibilityImportPreview} from "@/modules/placements/tpo-batch-import-service";
import { route } from "@/security/route";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{batchId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {batchId}=await params;
  const preview=await getBatchEligibilityImportPreview(await getCurrentRequestContext(),batchId,await boundedRequestJson(request, 8 * 1024 * 1024));
  return privateJson(preview);
 }catch(error){return apiErrorResponse(error);}
}
export const POST = route(
  { auth: "user", permission: "placements.manage", stepUp: true },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
