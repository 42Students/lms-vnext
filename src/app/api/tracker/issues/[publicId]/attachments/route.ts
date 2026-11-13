import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {listTrackerAttachments} from "@/modules/bug-tracker/attachment-storage-service";
import {bugTrackerApiError} from "@/lib/bug-tracker-api-error";
import { route } from "@/security/route";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
async function handleGET(_request:Request,{params}:{params:Promise<{publicId:string}>}){
 if(!trackerAdminRuntimeEnabled())
  return NextResponse.json({error:"DB10_TRACKER_MIGRATIONS_PENDING"},{status:503});
 try{
  const {publicId}=await params;
  const items=await listTrackerAttachments(await getCurrentRequestContext(),publicId);
  return privateJson({items});
 }catch(error){return bugTrackerApiError(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
