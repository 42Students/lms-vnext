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
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let count = 0;
      let complete = false;
      try {
        for (let cursorMs = start.getTime(); cursorMs < end.getTime();) {
          const untilMs = Math.min(end.getTime(), cursorMs + 86_400_000);
          let cursor: string | undefined;
          do {
            if (cancelled || request.signal.aborted) return;
            const page = await readCloudLogErrorPage({
              project: config.project, namespace: config.namespace,
              start: new Date(cursorMs === start.getTime() ? cursorMs - 1 : cursorMs),
              end: new Date(untilMs), token,
              minimumSeverity: parsed.data.minimumSeverity,
              ...(cursor ? { pageToken: cursor } : {}),
            });
            for (const entry of page.errors) {
              if (cancelled || request.signal.aborted) return;
              const at = entry.timestamp.getTime();
              if (at < start.getTime() || at > end.getTime()) continue;
              controller.enqueue(encoder.encode(JSON.stringify({
                timestamp: entry.timestamp.toISOString(),
                event: entry.event, message: entry.message, route: entry.path,
                reference: entry.requestId ?? null, component: entry.component ?? null,
              }) + "\n"));
              count++;
            }
            cursor = page.nextPageToken;
          } while (cursor);
          cursorMs = untilMs;
        }
        complete = true;
      } catch {
        // Headers have been sent, so the trailer must explicitly identify a
        // partial file. Never include provider response bodies or credentials.
      } finally {
        if (!cancelled && !request.signal.aborted) {
          try {
            controller.enqueue(encoder.encode(JSON.stringify({
              _meta: {
                environment, since: start.toISOString(), until: end.toISOString(),
                count, complete, truncated: !complete,
                source: "REDACTED_CLOUD_LOGGING",
                ...(complete ? {} : { error: "LOG_PROVIDER_UNAVAILABLE" }),
              },
            }) + "\n"));
            controller.close();
          } catch {
            // The consumer disconnected; never attempt another send.
          }
        }
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
