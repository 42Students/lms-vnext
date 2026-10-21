import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { logError } from "@/observability/logger";
import { acceptClientErrorRate, browserErrorSchema, safeBrowserComponent } from "@/modules/log-alerts/client-report";
import { redactAlertText, safeAlertPath } from "@/modules/log-alerts/redaction";

export const runtime = "nodejs";
const MAX_BYTES = 4096;

async function readBoundedBody(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "This request could not be verified." }, { status: 403 });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(length) || length > MAX_BYTES) {
    return NextResponse.json({ message: "This report is too large." }, { status: 413 });
  }
  let raw: string | null;
  try { raw = await readBoundedBody(request); }
  catch { return NextResponse.json({ message: "Could not read this report." }, { status: 400 }); }
  if (raw === null) {
    return NextResponse.json({ message: "This report is too large." }, { status: 413 });
  }
  let body: unknown;
  try { body = JSON.parse(raw); }
  catch { return NextResponse.json({ message: "Please check this report." }, { status: 400 }); }
  const parsed = browserErrorSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Please check this report." }, { status: 400 });
  const ip = request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const session = request.headers.get("cookie") ?? "";
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const sessionHash = createHash("sha256").update(ip + "|" + session).digest("hex");
  const now = Date.now();
  if (!acceptClientErrorRate("ip:" + ipHash, now, 20) ||
      !acceptClientErrorRate("session:" + sessionHash, now, 10)) {
    return NextResponse.json(
      { message: "Too many reports. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  // Legacy telemetry requires a signed-in principal. Do not allow an
  // anonymous root error to become an unbounded log injection vector.
  const context=await getCurrentRequestContext().catch(()=>null);
  if(!context)return NextResponse.json({error:"AUTHENTICATION_REQUIRED"},{status:401});
  const identity={userId:context.user.id,collegeId:context.membership?.collegeId};
  const report = parsed.data;
  // Root error boundaries intentionally send only the category and reference.
  const safeMessage = report.message ??
    (report.kind === "stale_chunk" ? "Browser failed to load updated application code" :
      "Browser rendering failed");
  logError("client.error", new Error(redactAlertText(safeMessage)), {
    ...identity, component: safeBrowserComponent(report),
    path: safeAlertPath(report.path), requestId: report.requestId,
    errorName: safeBrowserComponent({ name: report.name }), status: 500,
  });
  // Telemetry is fire-and-forget. 202 is success even for clients that do
  // not await the response; never show this endpoint's errors as a UI toast.
  return NextResponse.json({ received: true }, { status: 202 });
}
