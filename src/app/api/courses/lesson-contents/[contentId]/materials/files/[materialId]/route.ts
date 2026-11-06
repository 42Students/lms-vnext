import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 completeLessonResourceFileUpload,removeLessonResourceFile,editLessonResourceFileDetails,
} from "@/modules/courses/lesson-resource-file-upload-service";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
type Route={params:Promise<{contentId:string;materialId:string}>};
const noStore={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"};
const scopeSchema=z.strictObject({deliveryId:z.string().uuid().nullable().optional()});
async function act(request:Request,{params}:Route,action:"COMPLETE"|"REMOVE"|"EDIT"){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const {contentId,materialId}=await params;
  const body:unknown=await request.json();
  const context=await getCurrentRequestContext();
  const result=action==="EDIT"?
   await editLessonResourceFileDetails(context,contentId,materialId,body):
   action==="COMPLETE"?
   await completeLessonResourceFileUpload(context,contentId,materialId,
    scopeSchema.parse(body).deliveryId??null):
   await removeLessonResourceFile(context,contentId,materialId,
    scopeSchema.parse(body).deliveryId??null);
  return Response.json({result},{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
async function handlePOST(request:Request,context:Route){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 return act(request,context,"COMPLETE");
}
export const POST = secured(handlePOST);
async function handleDELETE(request:Request,context:Route){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 return act(request,context,"REMOVE");
}
export const DELETE = secured(handleDELETE);
async function handlePATCH(request:Request,context:Route){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 return act(request,context,"EDIT");
}
export const PATCH = secured(handlePATCH);
