import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  initiateOwnRecruiterJdUpload, verifyOwnRecruiterJdObject, readOwnRecruiterJd,
} from "@/modules/placements/recruiter-jd-upload-service";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store" };

function failed(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400, headers: noStore });
  if (error instanceof Error && error.message.startsWith("JD_"))
    return NextResponse.json({ error: error.message }, {
      status: error.message === "JD_ACCESS_DENIED" ? 403 :
        error.message === "JD_NOT_FOUND" ? 404 : 400,
      headers: noStore,
    });
  return apiErrorResponse(error);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403, headers: noStore });
  try {
    const body: unknown = await request.json();
    const input = z.discriminatedUnion("action", [
      z.strictObject({ action: z.literal("INITIATE"), collegeId: z.string().uuid(),
        originalName: z.string(), contentType: z.string(), sizeBytes: z.number() }),
      z.strictObject({ action: z.literal("CONFIRM"), collegeId: z.string().uuid(),
        objectKey: z.string() }),
    ]).parse(body);
    const context = await getCurrentRequestContext();
    if (input.action === "INITIATE") {
      const grant = await initiateOwnRecruiterJdUpload(context, input);
      return NextResponse.json(grant, { status: 201, headers: noStore });
    }
    const proof = await verifyOwnRecruiterJdObject(context, input.collegeId, input.objectKey);
    return NextResponse.json({ verified: Boolean(proof), objectKey: proof?.objectKey },
      { headers: noStore });
  } catch (error) { return failed(error); }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = z.strictObject({
      collegeId: z.string().uuid(), objectKey: z.string(),
    }).parse(Object.fromEntries(url.searchParams.entries()));
    if ([...url.searchParams.keys()].some(key => url.searchParams.getAll(key).length !== 1))
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400, headers: noStore });
    const result = await readOwnRecruiterJd(
      await getCurrentRequestContext(), params.collegeId, params.objectKey);
    return NextResponse.json(result, { headers: noStore });
  } catch (error) { return failed(error); }
}
