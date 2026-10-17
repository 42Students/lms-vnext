import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {retryQueuedAttendanceParentSmsForCollege} from "@/modules/attendance/parent-sms-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const input=z.object({collegeId:z.string().uuid()}).strict().parse(await request.json());
  const result=await retryQueuedAttendanceParentSmsForCollege(await getCurrentRequestContext(),input.collegeId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
