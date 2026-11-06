import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {saveProjectResourceLibrary} from "@/modules/projects/project-resource-library-service";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
async function handlePATCH(request:Request,{
 params,
}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const input:unknown=await request.json();
  const result=await saveProjectResourceLibrary(await getCurrentRequestContext(),projectId,input);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const PATCH = secured(handlePATCH, { csrf: "enforce" });
