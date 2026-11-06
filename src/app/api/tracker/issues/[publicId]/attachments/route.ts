import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {listTrackerAttachments} from "@/modules/bug-tracker/attachment-storage-service";
import {bugTrackerApiError} from "@/lib/bug-tracker-api-error";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handleGET(_request:Request,{params}:{params:Promise<{publicId:string}>}){
 if(!trackerAdminRuntimeEnabled())
  return NextResponse.json({error:"DB10_TRACKER_MIGRATIONS_PENDING"},{status:503});
 try{
  const {publicId}=await params;
  const items=await listTrackerAttachments(await getCurrentRequestContext(),publicId);
  return NextResponse.json({items},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return bugTrackerApiError(error);}
}
export const GET = secured(handleGET);
