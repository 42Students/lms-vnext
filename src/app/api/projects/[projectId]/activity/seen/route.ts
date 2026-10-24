import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markMentorProjectActivitySeen} from
 "@/modules/projects/mentor-activity-seen-service";

export const runtime="nodejs";
export async function POST(request:Request,{params}:{
 params:Promise<{projectId:string}>;
}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const id=z.string().uuid().parse(projectId);
  if(Number(request.headers.get("content-length")??0)>256)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:413});
  if((await request.text()).trim().length)
   return NextResponse.json({error:"INVALID_BODY"},{status:400});
  const result=await markMentorProjectActivitySeen(
    await getCurrentRequestContext(),id);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
