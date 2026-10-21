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
  listMyLearnerContentProgressBatch,
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
    const deliveryId=url.searchParams.get("deliveryId")??"";
    const rawIds=url.searchParams.getAll("contentIds");
    const contentIds=rawIds.flatMap(value=>value.split(",")).map(value=>value.trim()).filter(Boolean);
    if(contentIds.length){
      if(contentIds.length>500)return NextResponse.json({error:"TOO_MANY_CONTENT_IDS",
       message:"Too many lessonContentIds in one request. Split into batches of 500 or fewer."},
       {status:400});
      if(!contentIds.includes(contentId))return NextResponse.json({error:"INVALID_CONTENT_ID",
       message:"The content ID in the URL must be included in contentIds"},{status:400});
      const progress=await listMyLearnerContentProgressBatch(context,deliveryId,contentIds);
      return NextResponse.json({progress,status:"OK",message:"OK",data:progress},
       {headers:{"Cache-Control":"private, no-store"}});
    }
    const progress=await getLearnerContentProgress(context,contentId,deliveryId);

    return NextResponse.json({progress,status:"OK",message:"OK",data:progress},
      {headers:{"Cache-Control":"private, no-store"}});
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
    const body = await request.json().catch(() => null);
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({error:"INVALID_PROGRESS_REQUEST",
        message:"Progress request cannot be null"}, {status:400});
    }
    const progress =
      await saveLearnerContentProgress(
        context,
        contentId,
        body,
      );

    const legacyBody=body as Record<string,unknown>;
    const reportedDuration=typeof legacyBody.durationSeconds==="number"?
     legacyBody.durationSeconds:null;
    const reportedComplete=typeof legacyBody.completed==="boolean"?
     legacyBody.completed:null;
    // Authored server duration and latest persisted progress beat unverified
    // client/player duration and completion hints.
    const playbackReconciled=(reportedDuration!==null&&
      Math.abs(reportedDuration-progress.durationSeconds)>1)||
      (reportedComplete!==null&&(progress.status==="COMPLETED")!==reportedComplete);
    return NextResponse.json({progress,status:"OK",message:"OK",data:progress,
      ...(reportedDuration!==null||reportedComplete!==null?{playbackReconciled}: {})},
      {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** Legacy administrative retake command. A content ID is a scope fence,
 * not permission to overwrite a single previous attempt. The batch creates
 * fresh attempts for that exact Course Offering, preserving historic scores. */
const batchInput=z.strictObject({
 action:z.literal("READ_BATCH"),
 deliveryId:z.uuid(),
 contentIds:z.array(z.uuid()).min(1).max(500),
});

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
  const raw:unknown=await request.json().catch(()=>null);
  if(raw===null || typeof raw!=="object" || Array.isArray(raw))
   return NextResponse.json({error:"INVALID_REQUEST",message:"Progress request cannot be null"},{status:400});
  const action=(raw as Record<string,unknown>).action;
  if(action==="READ_BATCH"){
   const rawIds=(raw as Record<string,unknown>).contentIds;
   if(Array.isArray(rawIds)&&rawIds.length>500)
    return NextResponse.json({error:"RETAKE_TOO_MANY_ITEMS",
      message:"Too many lessonContentIds in one request. Split the request into batches of 500 or fewer."},{status:400});
   const batch=batchInput.safeParse(raw);
   if(!batch.success)
    return NextResponse.json({error:"INVALID_REQUEST",
      message:batch.error.issues[0]?.message??"Check the requested lesson content IDs",
      issues:batch.error.issues},{status:400});
   if(!batch.data.contentIds.includes(contentId))
    return NextResponse.json({error:"INVALID_CONTENT_ID",
      message:"The content ID in the URL must be included in contentIds"},{status:400});
   const progress=await listMyLearnerContentProgressBatch(
    context,batch.data.deliveryId,batch.data.contentIds);
   return NextResponse.json({progress,status:"OK",message:"OK",data:progress},
      {headers:{"Cache-Control":"private, no-store"}});
  }
  const parsed=retakeInput.safeParse(raw);
  if(!parsed.success){
   const issue=parsed.error.issues[0];
   return NextResponse.json({error:"INVALID_REQUEST",
     message:issue?.message??"Invalid retake request",
     fieldErrors:Object.fromEntries(parsed.error.issues.filter(item=>item.path.length>0)
      .map(item=>[item.path.join("."),item.message])),
     issues:parsed.error.issues},{status:400});
  }
  const input=parsed.data;
  const content=await loadLessonContentScope(contentId,true);
  const offeringId=input.offeringId??input.courseId!;
  if(content.offeringId!==offeringId)
   return NextResponse.json({error:"CONTENT_DELIVERY_MISMATCH"},{status:403});
  const result=await startAdminCourseProgressRetake(context,{
   membershipId:input.membershipId??input.learnerId,
   offeringId,expectedAttempt:input.expectedAttempt,confirmed:true,
  });
  return NextResponse.json({...result,status:"OK",
   message:result.alreadyFresh
    ?"This learner has no recorded progress for that course — they are already starting fresh."
    :"Attempt "+result.attempt+" started. The previous attempt is kept as history.",
   data:result,historyPreserved:true,partial:false},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof CourseProgressRetakeError)
   return NextResponse.json({error:error.code,message:
    error.code==="NO_COURSE_CONTENT"?"That course has no content to retake":
    error.code==="RETAKE_STALE"?"Progress has changed. Review the current attempt again.":
    "Too many lessonContentIds in one request. Limit 500."},
    {status:error.code==="RETAKE_STALE"?409:400});
  return apiErrorResponse(error);
 }
}
