import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {archiveOwnLearnerNotification} from "@/modules/activity/learner-notification-read-service";
import { route } from "@/security/route";

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
async function handleDELETE(request:Request,context:RouteContext){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  return archive(request,context,false);
}
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
async function handlePOST(request:Request,context:RouteContext){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  return archive(request,context,true);
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
