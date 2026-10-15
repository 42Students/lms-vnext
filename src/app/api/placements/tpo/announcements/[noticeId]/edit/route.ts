import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { AuthorizationError } from "@/modules/permissions/policy";
import { editTpoNotice, editTpoNoticeSchema } from "@/modules/announcements/tpo-placement-edit-service";
export const runtime = "nodejs";
export async function POST(request: Request, {params}: {params: Promise<{noticeId: string}>}) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({error: "INVALID_ORIGIN"}, {status: 403});
  const form = await request.formData().catch(() => null);
  const {noticeId} = await params;
  const token = z.string().regex(/^(0|[1-9][0-9]{0,9})$/).transform(Number)
    .safeParse(form?.get("expectedVersion"));
  if (!token.success)
    return NextResponse.json({error: "INVALID_VERSION"}, {status: 400});
  const parsed = editTpoNoticeSchema.safeParse({
    noticeId, expectedVersion: token.data,
    title: form?.get("title"), message: form?.get("message"),
    pinned: form?.get("pinned") === "on",
  });
  if (!parsed.success)
    return NextResponse.json({error: "INVALID_BODY"}, {status: 400});
  try {
    await editTpoNotice(await getCurrentRequestContext(), parsed.data);
    return NextResponse.redirect(new URL("/tpo/announcements?tab=yours", request.url), 303);
  } catch (error) {
    if (error instanceof AuthorizationError)
      return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
    if (error instanceof z.ZodError)
      return NextResponse.json({error: "INVALID_BODY"}, {status: 400});
    if (error instanceof Error && error.message === "ANNOUNCEMENTS_NOT_REGISTERED")
      return NextResponse.json({error: "ANNOUNCEMENTS_NOT_REGISTERED"}, {status: 503});
    if (error instanceof Error && error.message === "ANNOUNCEMENT_NOT_FOUND")
      return NextResponse.json({error: "NOT_FOUND"}, {status: 404});
    if (error instanceof Error && error.message === "ANNOUNCEMENT_STALE")
      return NextResponse.json({error: "STALE_VERSION"}, {status: 409});
    throw error;
  }
}
