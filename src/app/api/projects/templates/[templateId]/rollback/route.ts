import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {rollbackProjectTemplate} from "@/modules/projects/template-rollback-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{templateId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {templateId}=await params;
  return NextResponse.json(await rollbackProjectTemplate(await getCurrentRequestContext(),
    templateId,await request.json()),{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
