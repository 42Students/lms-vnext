import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {postFacultyDiscussionReply} from "@/modules/courses/faculty-discussion-reply-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{deliveryId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {deliveryId}=await params;
  const message=await postFacultyDiscussionReply(await getCurrentRequestContext(),
   deliveryId,await request.json());
  return NextResponse.json({message},{status:201});
 }catch(error){return apiErrorResponse(error);}
}
