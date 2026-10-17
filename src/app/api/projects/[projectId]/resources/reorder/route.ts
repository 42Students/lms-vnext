import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {reorderProjectResources} from "@/modules/projects/resource-service";

export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{projectId:string}>}){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const {projectId}=await params;
    const payload:unknown=await request.json();
    const result=await reorderProjectResources(context,projectId,payload);
    return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
