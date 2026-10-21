import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {handleOwnTrackerAttachment} from "@/modules/bug-tracker/attachment-upload-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{
 params:Promise<{publicId:string}>;
}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const raw:unknown=await request.json().catch(()=>null);
 try{
  return NextResponse.json(await handleOwnTrackerAttachment(
   await getCurrentRequestContext(),(await params).publicId,raw),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  const code=error instanceof Error?error.message:"";
  if(code==="TRACKER_ATTACHMENT_NOT_FOUND")
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(code==="TRACKER_ATTACHMENT_UNAVAILABLE")
   return NextResponse.json({error:"NOT_READY"},{status:503});
  if(code==="TRACKER_ATTACHMENT_LIMIT")
   return NextResponse.json({error:"MAX_THREE_IMAGES"},{status:409});
  if(code==="TRACKER_ATTACHMENT_INVALID"||code==="TRACKER_ATTACHMENT_UNVERIFIED")
   return NextResponse.json({error:"UPLOAD_NOT_VERIFIED"},{status:409});
  if(error instanceof Error&&(
    error.name==="ZodError"||error.name==="BugTrackerAttachmentError"))
   return NextResponse.json({error:"INVALID_UPLOAD"},{status:400});
  throw error;
 }
}
