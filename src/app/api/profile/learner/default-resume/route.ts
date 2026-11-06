import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  confirmLearnerDefaultResumeUpload,
  initiateLearnerDefaultResumeUpload,
  listLearnerDefaultResumes,
  selectLearnerDefaultResume,
  viewOwnLearnerResume,
  clearOwnLearnerDefaultResume,
} from "@/modules/placements/learner-default-resume-service";
import { PrivateObjectStorageError } from "@/modules/storage/private-object-storage";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const command = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("INITIATE"),
    contentType: z.literal("application/pdf"),
    sizeBytes: z.number().int().min(1).max(10 * 1024 * 1024),
  }),
  z.strictObject({ action: z.literal("CONFIRM"), objectKey: z.string().min(20).max(700) }),
  z.strictObject({ action: z.literal("SELECT"), receiptId: z.uuid() }),
  z.strictObject({ action: z.literal("VIEW"), receiptId: z.uuid() }),
  z.strictObject({ action: z.literal("CLEAR_DEFAULT") }),
]);

function safeError(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400, headers });
  }
  if (error instanceof Error && error.message === "DEFAULT_RESUME_ACCESS_DENIED") {
    return NextResponse.json({ error: "ACCESS_DENIED" }, { status: 403, headers });
  }
  if (error instanceof Error && error.message === "DEFAULT_RESUME_NOT_VERIFIED") {
    return NextResponse.json({ error: "RESUME_NOT_VERIFIED",
      message: "This resume is not available as a scanned private document." },
      { status: 409, headers });
  }
  if (error instanceof PrivateObjectStorageError) {
    if (error.code === "PRIVATE_STORAGE_OBJECT_NOT_ATTESTED") {
      return NextResponse.json({ error: "SCAN_PENDING",
        message: "Resume scanning is not complete. Try again after the scan finishes." },
        { status: 409, headers });
    }
  }
  return apiErrorResponse(error);
}

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await listLearnerDefaultResumes(
      __ctx), { headers });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    const parsed = command.parse(await request.json());
    if (parsed.action === "INITIATE") {
      return NextResponse.json(await initiateLearnerDefaultResumeUpload(context, parsed),
        { headers });
    }
    if (parsed.action === "CONFIRM") {
      return NextResponse.json(await confirmLearnerDefaultResumeUpload(context, parsed),
        { headers });
    }
    if (parsed.action === "VIEW") {
      return NextResponse.json(await viewOwnLearnerResume(context, parsed.receiptId),
        { headers });
    }
    if (parsed.action === "CLEAR_DEFAULT") {
      return NextResponse.json(await clearOwnLearnerDefaultResume(context),
        { headers });
    }
    return NextResponse.json(await selectLearnerDefaultResume(context, parsed.receiptId),
      { headers });
  },
);
