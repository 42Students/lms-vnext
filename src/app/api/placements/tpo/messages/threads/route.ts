import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {openTpoMessageThread,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
import {hasMembershipRole} from "@/modules/identity/context";
const input=z.strictObject({recruiterUserId:z.string().uuid(),jobId:z.string().uuid().nullable().optional()});
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const parsed=input.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 const context=await getCurrentRequestContext(),membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 try{
  const thread=await openTpoMessageThread(context,{
   collegeId:membership.collegeId,...parsed.data,
  });
  return NextResponse.json({threadId:thread.id},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof TpoMessagingError)return NextResponse.json({error:"RECRUITER_ACCESS_UNAVAILABLE"},{status:404});
  throw error;
 }
}
