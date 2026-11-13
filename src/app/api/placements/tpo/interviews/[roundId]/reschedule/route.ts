import { boundedRequestJson } from "@/lib/bounded-request-json";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {rescheduleTpoInterview} from "@/modules/placements/tpo-interview-reschedule-service";
import { route } from "@/security/route";
import { featureReady } from "@/config/features";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{roundId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({message:"Your session could not be verified. Refresh the page and try again."},{status:403});
  if (!featureReady("tpoApi"))
    return NextResponse.json({message:"Interview scheduling is temporarily unavailable. Ask the placement cell to try again later."},{status:503,
      headers:{"Cache-Control":"private, no-store, max-age=0"}});
 try{
  const {roundId}=await params;
  return NextResponse.json(await rescheduleTpoInterview(await getCurrentRequestContext(),roundId,await boundedRequestJson(request)));
 }catch(error){return apiErrorResponse(error);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
