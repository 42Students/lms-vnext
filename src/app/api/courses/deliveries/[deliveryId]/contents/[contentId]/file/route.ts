import {getCurrentRequestContext} from "@/auth/request-context";
import {getPrivateR2Config} from "@/modules/storage/r2-config";
import {headObject,presignUrl} from "@/modules/storage/s3-client";
import {apiErrorResponse} from "@/lib/api-error";
import {getLearnerCourseFileReference} from "@/modules/courses/learner-course-file-reference-service";

export const runtime="nodejs";
type RouteContext={params:Promise<{deliveryId:string;contentId:string}>};
function fileName(key:string){
 return (key.split("/").filter(Boolean).at(-1)??"course-file").replace(/[^A-Za-z0-9._-]/g,"_");
}

/** The browser handles full downloads and HTTP Range on the signed R2 URL.
 * No file bytes are proxied through Next.js. Every request authenticates and
 * authorizes one material before issuing a fifteen-minute GET capability. */
export async function GET(request:Request,{params}:RouteContext){
 const {deliveryId,contentId}=await params;
 let key:string|null;
 try{
  key=await getLearnerCourseFileReference(await getCurrentRequestContext(),deliveryId,contentId);
 }catch(error){return apiErrorResponse(error);}
 if(!key)return Response.json({error:"COURSE_FILE_NOT_FOUND"},{status:404});
 let config:ReturnType<typeof getPrivateR2Config>;
 try{
  config=getPrivateR2Config();
  const existing=await headObject(config,key);
  if(!existing||!existing.sizeBytes||existing.sizeBytes<=0)
   return Response.json({error:"COURSE_FILE_NOT_FOUND"},{status:404});
 }catch{
  return Response.json({error:"COURSE_FILE_UNAVAILABLE",
   message:"The course file is not available from storage."},{status:503});
 }
 const download=new URL(request.url).searchParams.get("download")==="1";
 const query=download?{"response-content-disposition":'attachment; filename="'+fileName(key)+'"'}:undefined;
 const signed=presignUrl(config,{method:"GET",key,expiresSeconds:900,query});
 return new Response(null,{status:302,headers:{
  Location:signed,
  "Cache-Control":"private, no-store",
  "Referrer-Policy":"no-referrer",
 }});
}
