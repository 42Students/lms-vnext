import {getCurrentRequestContext} from "@/auth/request-context";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {lessonContentMaterials} from "@/db/schema/lesson-content-materials";
import {listLessonResourceMaterials,resolveLegacyResourceMaterialId} from "@/modules/courses/lesson-resource-materials-service";
import {getPrivateR2Config} from "@/modules/storage/r2-config";
import {headObject,presignUrl} from "@/modules/storage/s3-client";
import {apiErrorResponse} from "@/lib/api-error";
import {getLearnerCourseFileReference,validCourseResourceStorageKey} from "@/modules/courses/learner-course-file-reference-service";
import {loadCourseSectionDeliveryScope} from "@/modules/courses/scope";

export const runtime="nodejs";
type RouteContext={params:Promise<{deliveryId:string;contentId:string}>};
function fileName(key:string){
 return (key.split("/").filter(Boolean).at(-1)??"course-file").replace(/[^A-Za-z0-9._-]/g,"_").slice(0,180)||"course-file";
}

/** The browser handles full downloads and HTTP Range on the signed R2 URL.
 * No file bytes are proxied through Next.js. Every request authenticates and
 * authorizes one material before issuing a fifteen-minute GET capability. */
export async function GET(request:Request,{params}:RouteContext){
 const url=new URL(request.url);
 const values=url.searchParams.getAll("download");
 const materialValues=url.searchParams.getAll("materialId");
 const rawMaterialId=materialValues[0]??null;
 const ordinalValues=url.searchParams.getAll("index");
 const rawOrdinal=ordinalValues[0]??null;
 if([...url.searchParams.keys()].some(key=>key!=="download"&&key!=="materialId"&&key!=="index") ||
   values.length>1 || materialValues.length>1 || ordinalValues.length>1 ||
   (rawMaterialId!==null&&rawOrdinal!==null) ||
   (rawOrdinal!==null&&!/^(?:0|[1-9]\d{0,8})$/.test(rawOrdinal)) ||
   (values.length===1&&!["0","1"].includes(values[0]!)) ||
   (rawMaterialId!==null&&!/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(rawMaterialId)))
  return Response.json({error:"INVALID_REQUEST"},{status:400,headers:{
   "Cache-Control":"private, no-store",
  }});
 const {deliveryId,contentId}=await params;
 let key:string|null;
 let displayName:string|null=null;
 try{
  const context=await getCurrentRequestContext();
  const selectedMaterialId=rawMaterialId??(rawOrdinal!==null
    ?await resolveLegacyResourceMaterialId(context,contentId,deliveryId,Number(rawOrdinal)):null);
  if(rawMaterialId!==null||rawOrdinal!==null){
   if(!selectedMaterialId)return Response.json({error:"COURSE_FILE_NOT_FOUND",message:"Resource file not found"},
     {status:404,headers:{"Cache-Control":"private, no-store"}});
   const visible=await listLessonResourceMaterials(context,contentId,deliveryId);
   const selected=visible.find(row=>row.id===selectedMaterialId&&row.kind==="FILE"&&
     row.uploadStatus==="READY");
   if(!selected)return Response.json({error:"COURSE_FILE_NOT_FOUND",message:"Resource not found"},
     {status:404,headers:{"Cache-Control":"private, no-store"}});
   const [material]=await getDb().select({
    key:lessonContentMaterials.storageKey,name:lessonContentMaterials.originalName,
    generation:lessonContentMaterials.objectGeneration,
    verifiedSize:lessonContentMaterials.verifiedSizeBytes,
    attested:lessonContentMaterials.scanAttestedAt,
   }).from(lessonContentMaterials).where(and(
    eq(lessonContentMaterials.lessonContentId,contentId),
    eq(lessonContentMaterials.id,selectedMaterialId),
    eq(lessonContentMaterials.kind,"FILE"),
    eq(lessonContentMaterials.uploadStatus,"READY"),
    eq(lessonContentMaterials.scanStatus,"CLEAN"),
   )).limit(1);
   const scope=await loadCourseSectionDeliveryScope(deliveryId,true);
   key=material?.generation&&material.attested&&material.verifiedSize&&
     validCourseResourceStorageKey(material.key,scope.collegeId)?material.key:null;
   displayName=material?.name??selected.title;
  }else{
   key=await getLearnerCourseFileReference(context,deliveryId,contentId);
  }
 }catch(error){return apiErrorResponse(error);}
 if(!key)return Response.json({error:"COURSE_FILE_NOT_FOUND",message:"Resource file not found"},{status:404,headers:{"Cache-Control":"private, no-store"}});
 let config:ReturnType<typeof getPrivateR2Config>;
 try{
  config=getPrivateR2Config();
  const existing=await headObject(config,key);
  if(!existing||!existing.sizeBytes||existing.sizeBytes<=0)
   return Response.json({error:"COURSE_FILE_NOT_FOUND",message:"Resource file not found"},{status:404,headers:{"Cache-Control":"private, no-store"}});
 }catch{
  return Response.json({error:"COURSE_FILE_UNAVAILABLE",
   message:"The course file is not available from storage."},{status:503});
 }
 const download=values[0]==="1";
 const query=download?{"response-content-disposition":'attachment; filename="'+fileName(displayName??key)+'"'}:undefined;
 const signed=presignUrl(config,{method:"GET",key,expiresSeconds:900,query});
 // Legacy clients can opt into an authorized JSON link response; browser
 // navigation retains the download/playback redirect and R2 Range support.
 if(request.headers.get("accept")?.includes("application/json"))
  return Response.json({status:"OK",message:"Resource ready",data:{url:signed}},
   {headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
 return new Response(null,{status:302,headers:{
  Location:signed,
  "Cache-Control":"private, no-store",
  "Referrer-Policy":"no-referrer",
 }});
}
