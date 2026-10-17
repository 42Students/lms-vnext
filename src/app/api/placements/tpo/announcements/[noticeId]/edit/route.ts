import { NextResponse } from "next/server";
import {noticePostError} from "../../form-error-response";
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
    return noticePostError(request,"INVALID_VERSION",400);
  const parsed = editTpoNoticeSchema.safeParse({
    noticeId, expectedVersion: token.data,
    title: form?.get("title"), message: form?.get("message"),
    buttonLabel:String(form?.get("buttonLabel")??"").trim()||undefined,
    buttonUrl:String(form?.get("buttonUrl")??"").trim()||undefined,
    pinned: form?.get("pinned") === "on",
    notifyChanged:form?.get("notifyChanged")==="on",
    sendAt:form?.has("sendAt")?String(form.get("sendAt")??""):undefined,
    showUntil:form?.has("showUntil")?String(form.get("showUntil")??""):undefined,
  });
  if (!parsed.success)
    return noticePostError(request,
      parsed.error.issues.some(issue=>issue.path.includes("buttonUrl"))?"BUTTON_URL_INVALID":"INVALID_BODY",400);
  try {
    await editTpoNotice(await getCurrentRequestContext(), parsed.data);
    return NextResponse.redirect(new URL("/tpo/announcements?tab=yours", request.url), 303);
  } catch (error) {
    if (error instanceof AuthorizationError)
      return noticePostError(request,"FORBIDDEN",403);
    if (error instanceof z.ZodError)
      return noticePostError(request,"INVALID_BODY",400);
    if (error instanceof Error && error.message === "ANNOUNCEMENTS_NOT_REGISTERED")
      return noticePostError(request,"ANNOUNCEMENTS_NOT_REGISTERED",503);
    if(error instanceof Error && error.message==="TPO_NOTICE_INVALID_TIME")
      return noticePostError(request,"INVALID_TIME",400);
    if (error instanceof Error && error.message === "ANNOUNCEMENT_NOT_FOUND")
      return noticePostError(request,"NOT_FOUND",404);
    if (error instanceof Error && error.message === "ANNOUNCEMENT_STALE")
      return noticePostError(request,"STALE_VERSION",409);
    throw error;
  }
}
