import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateProjectWorkspaceBrief} from "@/modules/projects/workspace-brief-service";
import {z} from "zod";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const context=await getCurrentRequestContext();
  const payload:unknown=await request.json();
  // The historic overview JSON may contain opaque template facts, which
  // remain DB-owned. Never trust caller-supplied unknown keys or a forged
  // selected-college ID; the service locks the scoped project in one TX.
  const legacy=z.strictObject({
   detailsToken:z.iso.datetime({offset:true}),
   overview:z.object({
    goal:z.string().optional(),description:z.string().optional(),
    deliverables:z.array(z.string()).optional(),
    definitionOfDone:z.array(z.string()).optional(),
    personas:z.array(z.string()).optional(),
   }).passthrough(),
  }).safeParse(payload);
  const input=legacy.success?{
   expectedUpdatedAt:legacy.data.detailsToken,
   brief:{
    goal:legacy.data.overview.goal??"",
    description:legacy.data.overview.description??"",
    deliverables:legacy.data.overview.deliverables??[],
    completionConditions:legacy.data.overview.definitionOfDone??[],
    personas:legacy.data.overview.personas??[],
   },
  }:payload;
  return NextResponse.json(await updateProjectWorkspaceBrief(context,projectId,input));
 }catch(error){return apiErrorResponse(error);}
}
