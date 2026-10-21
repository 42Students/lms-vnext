import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {presignTrackerAttachment} from "@/modules/bug-tracker/attachment-storage-service";
import {bugTrackerApiError} from "@/lib/bug-tracker-api-error";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{publicId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 if(!trackerAdminRuntimeEnabled())
  return NextResponse.json({error:"DB10_TRACKER_MIGRATIONS_PENDING"},{status:503});
 try{
  const raw:unknown=await request.json();
  const {publicId}=await params;
  const result=await presignTrackerAttachment(
    await getCurrentRequestContext(),publicId,raw);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return bugTrackerApiError(error);}
}
