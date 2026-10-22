import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getLegacyTpoPendingRequests} from "@/modules/placements/tpo-global-requests-service";
export const runtime="nodejs";
export async function GET(){
 try{
  const requests=await getLegacyTpoPendingRequests(await getCurrentRequestContext());
  return NextResponse.json(requests,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof RangeError)return NextResponse.json({error:"PENDING_REQUESTS_PAGINATION_REQUIRED"},{status:409});
  return apiErrorResponse(error);
 }
}
