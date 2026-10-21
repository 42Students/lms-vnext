import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {
 listLessonResourceMaterials,
 commandLessonResourceMaterial,
 grantLessonResourceMaterialFile,
 resolveLegacyResourceMaterialId,
} from "@/modules/courses/lesson-resource-materials-service";
import {authorizeOrNotFound} from "@/modules/storage/file-access";
import {StorageFileError} from "@/modules/storage/file-errors";
import {z} from "zod";
import {readResourceMaterialCommandJson} from "@/modules/courses/resource-material-command-json";
import {isSameOriginRequest} from "@/auth/origin";

export const runtime="nodejs";
type Route={params:Promise<{contentId:string}>};
const deliveryQuerySchema=z.strictObject({deliveryId:z.string().uuid().optional()});
const fileGrantQuerySchema=z.strictObject({
 deliveryId:z.string().uuid().optional(),
 openMaterialId:z.string().uuid().optional(),
 legacyMaterialIndex:z.coerce.number().int().min(0).max(2147483647).optional(),
}).refine(query => !(query.openMaterialId && query.legacyMaterialIndex !== undefined),{
 message:"Choose one material reference",
});
function queryParams(request:Request):Record<string,unknown>{
 const raw:Record<string,unknown>={};
 for(const [key,value] of new URL(request.url).searchParams){
  // Duplicate scope/grant keys are invalid, never silently use the first.
  raw[key]=Object.hasOwn(raw,key)?[raw[key],value]:value;
 }
 return raw;
}
/** Signed URLs are never returned from a normal metadata list request.
 * A user click can GET ?openMaterialId={uuid} or ?legacyMaterialIndex={n};
 * both resolve through the same staff/learner scope checks and clean-scan
 * attestation. The response must not be cached or leaked through Referer.
 */
export async function GET(request:Request,{params}:Route){
 try{
  const {contentId:rawContentId}=await params;
  const contentId=z.string().uuid().parse(rawContentId);
  const query=fileGrantQuerySchema.parse(queryParams(request));
  const context=await getCurrentRequestContext();
  const deliveryId=query.deliveryId??null;
  if(query.openMaterialId || query.legacyMaterialIndex !== undefined){
   const grant=await authorizeOrNotFound(async()=>{
    const materialId=query.openMaterialId ??
     await resolveLegacyResourceMaterialId(context,contentId,deliveryId,query.legacyMaterialIndex!);
    if(!materialId)throw new StorageFileError("STORAGE_NOT_FOUND");
    return grantLessonResourceMaterialFile(context,contentId,deliveryId,materialId);
   });
   return Response.json({grant},{headers:{
    "Cache-Control":"private, no-store, max-age=0",
    "Referrer-Policy":"no-referrer",
    "X-Content-Type-Options":"nosniff",
   }});
  }
  const materials=await listLessonResourceMaterials(context,contentId,deliveryId);
  return Response.json({materials},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Route){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {contentId}=await params;
  const input=await readResourceMaterialCommandJson(request);
  const deliveryId=deliveryQuerySchema.parse(queryParams(request)).deliveryId??null;
  const result=await commandLessonResourceMaterial(
   await getCurrentRequestContext(),z.string().uuid().parse(contentId),deliveryId,input);
  return Response.json({result},{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
