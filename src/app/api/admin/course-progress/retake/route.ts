import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 CourseProgressRetakeError,previewAdminCourseProgressRetake,startAdminCourseProgressRetake,
} from "@/modules/courses/admin-progress-retake-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const cache={"Cache-Control":"private, no-store"};
function failure(error:unknown){
 if(error instanceof CourseProgressRetakeError){
  const code=error.code;
  return NextResponse.json({error:code,message:
    code==="NO_COURSE_CONTENT"?"That course has no content to retake":
    code==="RETAKE_STALE"?"Progress has changed. Review the current attempt again.":
      "Too many course content items to begin a retake."},
   {status:code==="NO_COURSE_CONTENT"?400:code==="RETAKE_STALE"?409:422,headers:cache});
 }
 return apiErrorResponse(error);
}
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  if([...url.searchParams.keys()].some(k=>!["offeringId","membershipId"].includes(k)) ||
     url.searchParams.getAll("offeringId").length!==1 ||
     url.searchParams.getAll("membershipId").length!==1)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:cache});
  const context=await getCurrentRequestContext();
  const state=await previewAdminCourseProgressRetake(context,{
   offeringId:url.searchParams.get("offeringId"),
   membershipId:url.searchParams.get("membershipId"),
  });
  return NextResponse.json(state,{headers:cache});
 }catch(error){return failure(error);}
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:cache});
 try{
  const context=await getCurrentRequestContext();
  const contentLength=Number(request.headers.get("content-length")??"0");
  if(!Number.isFinite(contentLength)||contentLength>2048)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:cache});
  const body=await request.text();
  if(body.length>2048)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:cache});
  const result=await startAdminCourseProgressRetake(context,JSON.parse(body));
  return NextResponse.json(result,{headers:cache});
 }catch(error){return failure(error);}
}
