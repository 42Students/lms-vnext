import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { readBoundedJsonRequest } from "@/lib/bounded-json-request";
import { updateCourseDisplayContentSchema } from "@/modules/courses/course-display-validation";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getAdminCourseDisplayContent,
  updateCourseDisplayContent,
} from "@/modules/courses/course-display-service";
import { courseDisplayRuntimeEnabled } from "@/modules/courses/course-display-readiness";
import { route } from "@/security/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" } as const;
function privateError(error: unknown) {
  const response = apiErrorResponse(error);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", "Cookie");
  return response;
}

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

function pending() {
  return NextResponse.json(
    {
      error:
        "DB05_COURSE_DISPLAY_MIGRATIONS_PENDING",
    },
    { status: 503, headers: privateHeaders },
  );
}

async function handleGET(
  _request: Request,
  { params }: RouteContext,
) {
  if (!courseDisplayRuntimeEnabled()) {
    return pending();
  }
  try {
    const context =
      await getCurrentRequestContext();
    const { courseId } = await params;
    const display =
      await getAdminCourseDisplayContent(
        context,
        courseId,
      );
    return NextResponse.json({ display }, { headers: privateHeaders });
  } catch (error) {
    return privateError(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);

async function handlePUT(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403, headers: privateHeaders },
    );
  }
  if (!courseDisplayRuntimeEnabled()) {
    return pending();
  }
  try {
    const context =
      await getCurrentRequestContext();
    const { courseId } = await params;
    // Rich course text and up to 30 takeaways can legitimately be large,
    // but an unbounded request.json() lets a caller allocate arbitrary memory.
    const body = await readBoundedJsonRequest(request, 262144);
    if (!body.ok) return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: 400, headers: privateHeaders,
    });
    const input = updateCourseDisplayContentSchema.parse(body.value);
    const display = await updateCourseDisplayContent(context, courseId, input);
    return NextResponse.json({ display }, { headers: privateHeaders });
  } catch (error) {
    return privateError(error);
  }
}
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePUT(request as Parameters<typeof handlePUT>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePUT>[1]),
);
