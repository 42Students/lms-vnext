import { boundedRequestJson } from "@/lib/bounded-request-json";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 completeLessonResourceFileUpload,removeLessonResourceFile,editLessonResourceFileDetails,
} from "@/modules/courses/lesson-resource-file-upload-service";
import { route } from "@/security/route";

export const runtime="nodejs";
type Route={params:Promise<{contentId:string;materialId:string}>};
const noStore={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"};
const scopeSchema=z.strictObject({deliveryId:z.string().uuid().nullable().optional()});
async function act(request:Request,{params}:Route,action:"COMPLETE"|"REMOVE"|"EDIT"){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const {contentId,materialId}=await params;
  const body:unknown=await boundedRequestJson(request);
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
export const POST = route(
  { auth: "user", permission: "courses.manage" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
async function handleDELETE(request:Request,context:Route){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 return act(request,context,"REMOVE");
}
export const DELETE = route(
  { auth: "user", permission: "courses.manage" },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
async function handlePATCH(request:Request,context:Route){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 return act(request,context,"EDIT");
}
export const PATCH = route(
  { auth: "user", permission: "courses.manage" },
  ({ request, params }) => handlePATCH(request as Parameters<typeof handlePATCH>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePATCH>[1]),
);
