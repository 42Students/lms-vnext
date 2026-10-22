import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 completeLessonResourceFileUpload,removeLessonResourceFile,
} from "@/modules/courses/lesson-resource-file-upload-service";

export const runtime="nodejs";
type Route={params:Promise<{contentId:string;materialId:string}>};
const noStore={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"};
const scopeSchema=z.strictObject({deliveryId:z.string().uuid().nullable().optional()});
async function act(request:Request,{params}:Route,action:"COMPLETE"|"REMOVE"){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const {contentId,materialId}=await params;
  const {deliveryId}=scopeSchema.parse(await request.json());
  const context=await getCurrentRequestContext();
  const result=action==="COMPLETE"?
   await completeLessonResourceFileUpload(context,contentId,materialId,deliveryId??null):
   await removeLessonResourceFile(context,contentId,materialId,deliveryId??null);
  return Response.json({result},{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,context:Route){
 return act(request,context,"COMPLETE");
}
export async function DELETE(request:Request,context:Route){
 return act(request,context,"REMOVE");
}
