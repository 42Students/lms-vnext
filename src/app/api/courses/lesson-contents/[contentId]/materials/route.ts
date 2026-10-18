import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listLessonResourceMaterials,commandLessonResourceMaterial} from "@/modules/courses/lesson-resource-materials-service";
import {z} from "zod";
import {readResourceMaterialCommandJson} from "@/modules/courses/resource-material-command-json";
import {isSameOriginRequest} from "@/auth/origin";

export const runtime="nodejs";
type Route={params:Promise<{contentId:string}>};
const deliveryQuerySchema=z.strictObject({deliveryId:z.string().uuid().optional()});
function delivery(request:Request){
 const raw:Record<string,unknown>={};
 for(const [key,value] of new URL(request.url).searchParams){
  // URLSearchParams.get() silently ignores repeated audience selectors.
  // Turn repeats into an invalid shape before parsing a strict scope.
  raw[key]=Object.hasOwn(raw,key)?[raw[key],value]:value;
 }
 return deliveryQuerySchema.parse(raw).deliveryId??null;
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
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {contentId}=await params;
  const input=await readResourceMaterialCommandJson(request);
  const result=await commandLessonResourceMaterial(
   await getCurrentRequestContext(),z.string().uuid().parse(contentId),delivery(request),input);
  return Response.json({result},{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
