import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { listLessonContents,updateLessonContent } from "@/modules/courses/lesson-content-service";
import {loadLessonContentScope} from "@/modules/courses/scope";

export const runtime = "nodejs";

/** Legacy fetchById maps to this read-only, scoped metadata projection.
 * Video playback grants remain a separate short-lived authorization path. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {contentId}=params;
    const scope=await loadLessonContentScope(contentId);
    const rows=await listLessonContents(context,scope.lessonId,scope.deliveryId);
    const content=rows.find(row=>row.id===contentId);
    if(!content)return NextResponse.json({error:"LESSON_CONTENT_NOT_FOUND"},
    {status:404,headers:{"Cache-Control":"private, no-store"}});
    return NextResponse.json({content,status:"OK",reason:"OK"},
    {headers:{"Cache-Control":"private, no-store"}});
  },
);

export const PATCH = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { contentId } = params;
    const body = await request.json();
    const content = await updateLessonContent(
      context,
      contentId,
      body,
    );
    return NextResponse.json({ content, status: "OK", reason: "OK" });
  },
);

/** Legacy clients used PUT; share the same permission-checked update path. */
export const PUT = PATCH;
