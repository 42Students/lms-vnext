import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createLessonContentDiscussion, lessonContentDiscussionsEnabled,
  listLessonContentDiscussions,
} from "@/modules/courses/lesson-content-discussion-service";
import { route } from "@/security/route";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store" };
type RouteContext = { params: Promise<{contentId:string}> };

/** Separate, gated legacy lesson-content feed, not delivery classroom chat. */
async function handleGET(request:Request,{params}:RouteContext){
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
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);

async function handlePOST(request:Request,{params}:RouteContext){
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
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
