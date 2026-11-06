import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markMentorProjectActivitySeen} from
 "@/modules/projects/mentor-activity-seen-service";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{
 params:Promise<{projectId:string}>;
}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const id=z.string().uuid().parse(projectId);
  const decoded=await readBoundedUtf8Body(request,256);
  if(decoded.kind==="TOO_LARGE")
   return NextResponse.json({error:"INVALID_REQUEST"},{status:413});
  if(decoded.kind!=="OK"||decoded.body.trim().length)
   return NextResponse.json({error:"INVALID_BODY"},{status:400});
  const result=await markMentorProjectActivitySeen(
    await getCurrentRequestContext(),id);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
