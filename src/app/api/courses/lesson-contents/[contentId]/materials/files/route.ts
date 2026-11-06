import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {beginLessonResourceFileUpload} from "@/modules/courses/lesson-resource-file-upload-service";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
type Route={params:Promise<{contentId:string}>};
const noStore={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"};

async function handlePOST(request:Request,{params}:Route){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const {contentId}=await params;
  const result=await beginLessonResourceFileUpload(
   await getCurrentRequestContext(),contentId,await request.json());
  return Response.json(result,{status:201,headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST);
