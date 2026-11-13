import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { trustedClientErrorIp } from "@/modules/log-alerts/client-error-ip";
import { logError } from "@/observability/logger";
import { acceptClientErrorRate, browserErrorSchema, safeBrowserComponent } from "@/modules/log-alerts/client-report";
import { redactAlertText, safeAlertPath } from "@/modules/log-alerts/redaction";
import { route } from "@/security/route";

import { env } from "@/config/env";
import { ROLE } from "@/modules/identity/roles";
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

async function handlePOST(request: Request) {
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
  // Resolve the signed-in account before applying limits. A shared college
  // NAT must not exhaust a very small IP-only bucket and suppress all learners.
  const context=await getCurrentRequestContext().catch(()=>null);
  if(!context)return NextResponse.json({error:"AUTHENTICATION_REQUIRED"},{status:401});
  // The load balancer's trusted XFF positions are canonicalized by the
  // shared auth parser; never trust X-Real-IP or the caller's first hop.
  // Unverified ingress still gets the authenticated per-user quota.
  const ip = trustedClientErrorIp(
    request, env.TRUSTED_CLIENT_IP_HEADERS === "true",
  );
  const ipHash=ip?createHash("sha256").update(ip).digest("hex"):null;
  const userHash=createHash("sha256").update(context.user.id).digest("hex");
  const now=Date.now();
  // Limits are process-local best effort; distributed deployments also need a
  // shared gateway limiter. Neither source trusts a browser-supplied user ID.
  if(!acceptClientErrorRate("user:"+userHash,now,10)||
     (ipHash!==null&&!acceptClientErrorRate("ip:"+ipHash,now,100))){
    return NextResponse.json({message:"Too many reports. Please try again later."},
      {status:429,headers:{"Retry-After":"60"}});
  }
  const roleCategory=context.membership?.roles.includes(ROLE.COLLEGE_ADMIN)?"COLLEGE_ADMIN":
    context.membership?.roles.includes(ROLE.FACULTY)?"FACULTY":
    context.membership?.roles.includes(ROLE.LEARNER)?"LEARNER":
    context.recruiter?"RECRUITER":"OTHER";
  const identity={userId:context.user.id,collegeId:context.membership?.collegeId,roleCategory};
  const report = parsed.data;
  // Root error boundaries intentionally send only the category and reference.
  const safeMessage = report.message ??
    (report.kind === "stale_chunk" ? "Browser failed to load updated application code" :
      "Browser rendering failed");
  logError("client.error", new Error(redactAlertText(safeMessage)), {
    ...identity, component: safeBrowserComponent(report),
    path: safeAlertPath(report.path), requestId: report.requestId,
    errorName: safeBrowserComponent(report.name === undefined ? {} : { name: report.name }),
    viewportBand: report.viewport, status: 500,
  });
  // Telemetry is fire-and-forget. 202 is success even for clients that do
  // not await the response; never show this endpoint's errors as a UI toast.
  return NextResponse.json({ received: true }, { status: 202 });
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
