/**
 * GR-11/05: same-origin, non-sensitive browser error reports for support.
 * Only category and generated short reference are accepted.
 */
import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import { isRequestId, createRequestId } from "@/lib/request-id";
import { logError } from "@/observability/logger";
import { friendlyApiError } from "@/lib/friendly-error";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: friendlyApiError({ status: 403 }) }, { status: 403 });
  }
  let body: unknown;
  try { body = await request.json(); }
  catch { body = null; }
  const value = body && typeof body === "object"
    ? body as { requestId?: unknown; kind?: unknown } : {};
  if (!isRequestId(value.requestId) || !["stale_chunk", "render"].includes(String(value.kind))) {
    return NextResponse.json({ message: friendlyApiError({ status: 400 }) }, { status: 400 });
  }
  const requestId = value.requestId;
  logError("ui.client_error", new Error("Client page failure"), { requestId, kind: value.kind });
  return NextResponse.json({ ok: true }, { headers: { "x-request-id": requestId } });
}
