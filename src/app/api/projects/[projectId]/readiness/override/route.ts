import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {overrideProjectReadiness} from "@/modules/projects/readiness-override-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};
export async function POST(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const {projectId}=await params;
    const override=await overrideProjectReadiness(context,projectId,await request.json());
    return NextResponse.json({override});
  }catch(error){return apiErrorResponse(error);}
}
