import { route } from "@/security/route";
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

import { CACHE } from "@/security/responses";
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
/** Legacy callers supplied id, lessonContentId or lesson_content_id.
 * An alias may repeat the canonical scoped UUID, but historical integer IDs
 * are never guessed: a verified college-specific import must map them first. */
function normalizeContentAliases(
 contentId:string,raw:Record<string,unknown>,
):Record<string,unknown>{
 const {id,lessonContentId,lesson_content_id,...params}=raw;
 for(const alias of [id,lessonContentId,lesson_content_id]){
  if(alias===undefined)continue;
  if(typeof alias!=="string"||!z.string().uuid().safeParse(alias).success||
     alias!==contentId)throw new StorageFileError("STORAGE_NOT_FOUND");
 }
 return params;
}
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
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    const {contentId:rawContentId}=params;
    const contentId=z.string().uuid().parse(rawContentId);
    const query=fileGrantQuerySchema.parse(normalizeContentAliases(contentId,queryParams(request)));
    const deliveryId=query.deliveryId??null;
    if(query.openMaterialId || query.legacyMaterialIndex !== undefined){
   const grant=await authorizeOrNotFound(async()=>{
    const materialId=query.openMaterialId ??
     await resolveLegacyResourceMaterialId(context,contentId,deliveryId,query.legacyMaterialIndex!);
    if(!materialId)throw new StorageFileError("STORAGE_NOT_FOUND");
    return grantLessonResourceMaterialFile(context,contentId,deliveryId,materialId);
   });
   return Response.json({grant},{headers:{
    "Cache-Control":CACHE.PRIVATE_STRICT,
    "Referrer-Policy":"no-referrer",
    "X-Content-Type-Options":"nosniff",
   }});
  }
    const materials=await listLessonResourceMaterials(context,contentId,deliveryId);
    return Response.json({materials},{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {contentId:rawContentId}=params;
    const contentId=z.string().uuid().parse(rawContentId);
    const input=await readResourceMaterialCommandJson(request);
    const deliveryId=deliveryQuerySchema.parse(normalizeContentAliases(contentId,queryParams(request))).deliveryId??null;
    const result=await commandLessonResourceMaterial(
   __ctx,contentId,deliveryId,input);
    return Response.json({result},{status:201,headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
