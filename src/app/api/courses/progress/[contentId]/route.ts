import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {z} from "zod";
import {loadLessonContentScope} from "@/modules/courses/scope";
import {CourseProgressRetakeError,startAdminCourseProgressRetake}
 from "@/modules/courses/admin-progress-retake-service";
import {
  getLearnerContentProgress,
  saveLearnerContentProgress,
} from "@/modules/courses/progress-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { contentId } = await params;
    const url = new URL(request.url);
    const progress =
      await getLearnerContentProgress(
        context,
        contentId,
        url.searchParams.get("deliveryId") ??
          "",
      );

    return NextResponse.json({ progress }, {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const { contentId } = await params;
    const body = await request.json();
    const progress =
      await saveLearnerContentProgress(
        context,
        contentId,
        body,
      );

    return NextResponse.json({ progress }, {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** Legacy administrative retake command. A content ID is a scope fence,
 * not permission to overwrite a single previous attempt. The batch creates
 * fresh attempts for that exact Course Offering, preserving historic scores. */
const retakeInput=z.strictObject({
 action:z.literal("RETAKE_COURSE"),
 membershipId:z.uuid().optional(),
 learnerId:z.uuid().optional(),
 offeringId:z.uuid().optional(),
 courseId:z.uuid().optional(),
 expectedAttempt:z.number().int().min(0),
 confirmed:z.literal(true),
}).superRefine((value,ctx)=>{
 if(!value.membershipId&&!value.learnerId)
  ctx.addIssue({code:"custom",path:["membershipId"],message:"learnerId is required"});
 if(!value.offeringId&&!value.courseId)
  ctx.addIssue({code:"custom",path:["offeringId"],message:"courseId is required"});
});

export async function POST(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:{"Cache-Control":"private, no-store"}});
 try{
  const context=await getCurrentRequestContext();
  const {contentId}=await params;
  if(!z.uuid().safeParse(contentId).success)
   return NextResponse.json({error:"INVALID_CONTENT_ID",message:"Content ID must be a valid UUID"},{status:400});
  const input=retakeInput.parse(await request.json());
  const content=await loadLessonContentScope(contentId,true);
  const offeringId=input.offeringId??input.courseId!;
  if(content.offeringId!==offeringId)
   return NextResponse.json({error:"CONTENT_DELIVERY_MISMATCH"},{status:403});
  const result=await startAdminCourseProgressRetake(context,{
   membershipId:input.membershipId??input.learnerId,
   offeringId,expectedAttempt:input.expectedAttempt,confirmed:true,
  });
  return NextResponse.json({...result,status:"OK",
   historyPreserved:true,partial:false},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof CourseProgressRetakeError)
   return NextResponse.json({error:error.code,message:
    error.code==="NO_COURSE_CONTENT"?"That course has no content to retake":
    error.code==="RETAKE_STALE"?"Progress has changed. Review the current attempt again.":
    "Too many lessonContentIds in one request."},
    {status:error.code==="RETAKE_STALE"?409:400});
  return apiErrorResponse(error);
 }
}
