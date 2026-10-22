import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { alertEnvironment } from "@/modules/log-alerts/signature";
import { cloudPollSettings } from "@/modules/log-alerts/scheduler";
import { cloudLoggingAccessToken, readCloudLogErrorPage } from "@/modules/log-alerts/cloud-log-reader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.strictObject({
  from: z.iso.datetime({ offset: true }),
  to: z.iso.datetime({ offset: true }),
  minimumSeverity: z.enum(["WARNING", "ERROR"]).default("WARNING"),
});
const HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
} as const;

/**
 * Download a redacted 31-day NDJSON range without buffering Cloud Logging
 * history in the web process or the browser. The provider still pages at 12
 * rows; each one-day segment exhausts its cursor before the next begins.
 * A partial provider failure writes a truthful, terminal incomplete _meta
 * record, never a false success or a retry of ambiguous provider cursors.
 */
export async function GET(request: Request) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context) || context.user.platformStatus !== "ACTIVE" ||
      context.adminScope?.collegeId || context.adminScope?.organizationId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: HEADERS });
  }
  requirePermission(context, "admin-scope.select");
  const url = new URL(request.url);
  if ([...url.searchParams.keys()].some(key =>
      url.searchParams.getAll(key).length !== 1)) {
    return NextResponse.json({ error: "INVALID_EXPORT_RANGE" }, { status: 400, headers: HEADERS });
  }
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_EXPORT_RANGE" }, { status: 400, headers: HEADERS });
  }
  const start = new Date(parsed.data.from);
  const end = new Date(parsed.data.to);
  const durationMs = end.getTime() - start.getTime();
  if (!Number.isFinite(durationMs) || durationMs <= 0 ||
      durationMs > 31 * 86_400_000 || end.getTime() > Date.now() + 30_000) {
    return NextResponse.json({ error: "INVALID_EXPORT_RANGE" }, { status: 400, headers: HEADERS });
  }
  const config = cloudPollSettings();
  if (!config) {
    return NextResponse.json({ error: "LOG_CONFIGURATION_UNAVAILABLE" },
      { status: 503, headers: HEADERS });
  }
  let token: string;
  try {
    token = await cloudLoggingAccessToken();
  } catch {
    return NextResponse.json({ error: "LOG_AUTH_UNAVAILABLE" },
      { status: 503, headers: HEADERS });
  }

  const environment = alertEnvironment();
  const encoder = new TextEncoder();
  let cancelled = false;
  let cursorMs = start.getTime();
  let pageToken: string | undefined;
  let count = 0;
  let finished = false;
  const trailer = (complete: boolean) => JSON.stringify({
    _meta: {
      environment, since: start.toISOString(), until: end.toISOString(),
      count, complete, truncated: !complete,
      source: "REDACTED_CLOUD_LOGGING",
      ...(complete ? {} : { error: "LOG_PROVIDER_UNAVAILABLE" }),
    },
  }) + "\n";
  const stream = new ReadableStream<Uint8Array>({
    // pull is backpressure-aware: at most one 12-entry provider page is
    // enqueued per downstream read, including for 31 days of log history.
    // Async start() would eagerly load the entire range into memory.
    async pull(controller) {
      if (finished) return;
      if (cancelled || request.signal.aborted) {
        finished = true;
        controller.close();
        return;
      }
      if (cursorMs >= end.getTime()) {
        finished = true;
        controller.enqueue(encoder.encode(trailer(true)));
        controller.close();
        return;
      }
      const untilMs = Math.min(end.getTime(), cursorMs + 86_400_000);
      try {
        const page = await readCloudLogErrorPage({
          project: config.project, namespace: config.namespace,
          start: new Date(cursorMs === start.getTime() ? cursorMs - 1 : cursorMs),
          end: new Date(untilMs), token,
          minimumSeverity: parsed.data.minimumSeverity,
          ...(pageToken ? { pageToken } : {}),
        });
        if (cancelled || request.signal.aborted) {
          finished = true;
          controller.close();
          return;
        }
        for (const entry of page.errors) {
          const at = entry.timestamp.getTime();
          if (at < start.getTime() || at > end.getTime()) continue;
          controller.enqueue(encoder.encode(JSON.stringify({
            timestamp: entry.timestamp.toISOString(),
            event: entry.event, message: entry.message, route: entry.path,
            reference: entry.requestId ?? null, component: entry.component ?? null,
          }) + "\n"));
          count++;
        }
        if (page.nextPageToken) {
          if (page.nextPageToken === pageToken) throw new Error("LOG_CURSOR_STALLED");
          pageToken = page.nextPageToken;
        } else {
          pageToken = undefined;
          cursorMs = untilMs;
        }
        if (cursorMs >= end.getTime()) {
          finished = true;
          controller.enqueue(encoder.encode(trailer(true)));
          controller.close();
        }
      } catch {
        // Provider errors mid-stream cannot modify HTTP status. The terminal
        // incomplete record prevents truncated files being mistaken for full.
        finished = true;
        if (!cancelled && !request.signal.aborted) {
          controller.enqueue(encoder.encode(trailer(false)));
        }
        controller.close();
      }
    },
    cancel() { cancelled = true; },
  });
  const suffix = start.toISOString().slice(0, 10) + "_" + end.toISOString().slice(0, 10);
  return new Response(stream, {
    status: 200,
    headers: {
      ...HEADERS,
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"lms-logs_" + environment + "_" + suffix + ".ndjson\"",
    },
  });
}
