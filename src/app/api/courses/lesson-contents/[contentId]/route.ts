import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { listLessonContents,updateLessonContent } from "@/modules/courses/lesson-content-service";
import {loadLessonContentScope} from "@/modules/courses/scope";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

/** Legacy fetchById maps to this read-only, scoped metadata projection.
 * Video playback grants remain a separate short-lived authorization path. */
export async function GET(_request:Request,{params}:RouteContext){
 try{
  const context=await getCurrentRequestContext();
  const {contentId}=await params;
  const scope=await loadLessonContentScope(contentId);
  const rows=await listLessonContents(context,scope.lessonId,scope.deliveryId);
  const content=rows.find(row=>row.id===contentId);
  if(!content)return NextResponse.json({error:"LESSON_CONTENT_NOT_FOUND"},
    {status:404,headers:{"Cache-Control":"private, no-store"}});
  return NextResponse.json({content,status:"OK",reason:"OK"},
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}

export async function PATCH(
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
    const context = await getCurrentRequestContext();
    const { contentId } = await params;
    const body = await request.json();
    const content = await updateLessonContent(
      context,
      contentId,
      body,
    );

    return NextResponse.json({ content, status: "OK", reason: "OK" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** Legacy clients used PUT; share the same permission-checked update path. */
export const PUT = PATCH;
