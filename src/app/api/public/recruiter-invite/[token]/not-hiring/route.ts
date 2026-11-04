import { NextResponse } from "next/server";
import { recruiterInviteNotHiringNoteSchema } from "@/modules/placements/recruiter-invite-not-hiring-note-model";
import { isSameOriginRequest } from "@/auth/origin";
import { readBoundedUtf8Body } from "@/lib/bounded-utf8-body";
import { tpoRecruiterInviteApiErrorResponse } from "@/lib/tpo-recruiter-invite-api-error";
import { markRecruiterInviteNotHiring } from "@/modules/placements/tpo-recruiter-invite-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } as const;
type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  if (process.env["DB09_TPO_API_READY"] !== "DB09_VERIFIED") {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503, headers: noStore });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403, headers: noStore });
  }
  if (new URL(request.url).search) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400, headers: noStore });
  }

  // Legacy clients send no body; modern clients may send only a small
  // optional note. Do not trust Content-Length or silently ignore another
  // content type whose streamed body contains attacker-controlled fields.
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^(0|[1-9]\d*)$/.test(declared) ||
      !Number.isSafeInteger(Number(declared)) || Number(declared) > 2048)) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 413, headers: noStore });
  }
  let payload: unknown = {};
  if (request.body !== null) {
    if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get("content-type") ?? "")) {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 415, headers: noStore });
    }
    const raw = await readBoundedUtf8Body(request, 2048);
    if (raw.kind !== "OK") {
      return NextResponse.json({ error: "INVALID_BODY" }, {
        status: raw.kind === "TOO_LARGE" ? 413 : 400, headers: noStore,
      });
    }
    try {
      payload = JSON.parse(raw.body) as unknown;
    } catch {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400, headers: noStore });
    }
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      Object.keys(payload).some((key) => key !== "note")) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400, headers: noStore });
  }
  const parsed = recruiterInviteNotHiringNoteSchema.safeParse(
    (payload as { note?: unknown }).note,
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400, headers: noStore });
  }
  try {
    const { token } = await params;
    const outcome = parsed.data
      ? await markRecruiterInviteNotHiring(token, new Date(), parsed.data)
      : await markRecruiterInviteNotHiring(token);
    return NextResponse.json(outcome, { headers: noStore });
  } catch (error) {
    return tpoRecruiterInviteApiErrorResponse(error);
  }
}
