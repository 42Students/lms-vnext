import { boundedRequestJson } from "@/lib/request-body";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {confirmTrackerAttachment} from "@/modules/bug-tracker/attachment-storage-service";
import {bugTrackerApiError} from "@/lib/bug-tracker-api-error";
import { route } from "@/security/route";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{publicId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 if(!trackerAdminRuntimeEnabled())
  return NextResponse.json({error:"DB10_TRACKER_MIGRATIONS_PENDING"},{status:503});
 try{
  const raw:unknown=await boundedRequestJson(request);
  const {publicId}=await params;
  const result=await confirmTrackerAttachment(
    await getCurrentRequestContext(),publicId,raw);
  return privateJson(result);
 }catch(error){return bugTrackerApiError(error);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
