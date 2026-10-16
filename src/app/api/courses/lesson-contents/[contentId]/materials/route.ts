import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listLessonResourceMaterials,commandLessonResourceMaterial} from "@/modules/courses/lesson-resource-materials-service";
import {z} from "zod";

export const runtime="nodejs";
type Route={params:Promise<{contentId:string}>};
function delivery(request:Request){
 const input=new URL(request.url).searchParams.get("deliveryId");
 return input?z.string().uuid().parse(input):null;
}
export async function GET(request:Request,{params}:Route){
 try{
  const {contentId}=await params;
  const materials=await listLessonResourceMaterials(
   await getCurrentRequestContext(),z.string().uuid().parse(contentId),delivery(request));
  return Response.json({materials},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Route){
 try{
  const {contentId}=await params;
  const input=await request.json();
  const result=await commandLessonResourceMaterial(
   await getCurrentRequestContext(),z.string().uuid().parse(contentId),delivery(request),input);
  return Response.json({result},{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
