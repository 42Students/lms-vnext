import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {archiveOwnLearnerNotification} from "@/modules/activity/learner-notification-read-service";

export const runtime="nodejs";
type RouteContext={params:Promise<{notificationId:string}>};
async function archive(request:Request,{params}:RouteContext,alias:boolean){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const {notificationId}=await params;
    const result=await archiveOwnLearnerNotification(
      await getCurrentRequestContext(),notificationId,
    );
    return NextResponse.json({
      ...result,
      message:alias?"Deleted notification successfully":result.message,
    },{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
export async function DELETE(request:Request,context:RouteContext){
  return archive(request,context,false);
}
export async function POST(request:Request,context:RouteContext){
  return archive(request,context,true);
}
