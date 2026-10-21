import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createCourseTeachingAssignmentsBatch} from "@/modules/courses/teaching-assignment-batch-service";

export const runtime="nodejs";

/** SA-academics-people-101: create 1–10 faculty/course grants atomically.
 * Missing/invalid authenticated session is handled by apiErrorResponse (401).
 * Same-origin CSRF failures remain 403 even if the old endpoint returned 401.
 */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  let body:unknown;
  try{body=await request.json();}
  catch{return NextResponse.json({error:"INVALID_REQUEST"},{status:400});}
  if(body&&typeof body==="object"&&!Array.isArray(body)){
    const fields=body as Record<string,unknown>;
    if(fields.courseId!==undefined||fields.courseIds!==undefined)
      return NextResponse.json({error:"DELIVERY_IDS_REQUIRED",
        message:"Select a Section and its course deliveries before assigning faculty."},
        {status:400});
  }
  const assignments=await createCourseTeachingAssignmentsBatch(context,body);
  return NextResponse.json({assignments,createdCount:assignments.length,
    message:assignments.length===1?"Association created successfully.":
      "Created "+assignments.length+" teaching assignments for this class."},{status:201,
    headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  return apiErrorResponse(error);
 }
}
