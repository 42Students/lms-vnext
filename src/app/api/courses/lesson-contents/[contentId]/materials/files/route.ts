import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {beginLessonResourceFileUpload} from "@/modules/courses/lesson-resource-file-upload-service";

export const runtime="nodejs";
type Route={params:Promise<{contentId:string}>};
const noStore={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"};

export async function POST(request:Request,{params}:Route){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const {contentId}=await params;
  const result=await beginLessonResourceFileUpload(
   await getCurrentRequestContext(),contentId,await request.json());
  return Response.json(result,{status:201,headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
