import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createAdminTaskPlanItem} from "@/modules/projects/admin-task-plan-create-service";

export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};

export async function POST(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const body:unknown=await request.json();
  const result=await createAdminTaskPlanItem(
   await getCurrentRequestContext(),projectId,body);
  return NextResponse.json(result,{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
