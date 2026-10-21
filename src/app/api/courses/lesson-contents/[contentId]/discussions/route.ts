import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createLessonContentDiscussion, lessonContentDiscussionsEnabled,
  listLessonContentDiscussions,
} from "@/modules/courses/lesson-content-discussion-service";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store" };
type RouteContext = { params: Promise<{contentId:string}> };

/** Separate, gated legacy lesson-content feed, not delivery classroom chat. */
export async function GET(request:Request,{params}:RouteContext){
  if(!lessonContentDiscussionsEnabled())
    return NextResponse.json({error:"DB05_NOT_READY"},
      {status:503,headers:noStore});
  try{
    const context=await getCurrentRequestContext();
    const {contentId}=await params;
    const messages=await listLessonContentDiscussions(
      context,contentId,Object.fromEntries(new URL(request.url).searchParams.entries()));
    return NextResponse.json(messages,{headers:noStore});
  }catch(error){return apiErrorResponse(error);}
}

export async function POST(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
  if(!lessonContentDiscussionsEnabled())
    return NextResponse.json({error:"DB05_NOT_READY"},
      {status:503,headers:noStore});
  try{
    const context=await getCurrentRequestContext();
    const {contentId}=await params;
    const message=await createLessonContentDiscussion(
      context,contentId,await request.json());
    return NextResponse.json({message},{status:201,headers:noStore});
  }catch(error){return apiErrorResponse(error);}
}
