/**
 * GR-05/17: Next.js 16 request proxy.
 * MAINTENANCE_MODE=1 serves a standalone safe 503 page before app rendering;
 * /ready remains untouched for real readiness signals and deploy automation.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createRequestId } from "@/lib/request-id";

export function proxy(request: NextRequest) {
  const requestId = createRequestId();
  const path = request.nextUrl.pathname;
  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.set("x-lms-path", path + request.nextUrl.search);
  forwardHeaders.set("x-request-id", requestId);
  if (process.env.MAINTENANCE_MODE === "1" && path !== "/ready" && path !== "/api/hello") {
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>42LMS is temporarily unavailable</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;background:#f8fafc;color:#243246;display:grid;min-height:100vh;place-items:center}main{box-sizing:border-box;max-width:560px;margin:24px;padding:36px;border:1px solid #d6dce4;border-radius:14px;background:white;text-align:center}a{color:#315a8d}</style>
</head><body><main><h1>We are making a quick update</h1>
<p>Please try again in a minute.</p><p>Reference: ${requestId}</p>
<a href="/">Try again</a></main></body></html>`;
    return new NextResponse(html, { status: 503, headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": "60",
      "x-request-id": requestId,
    } });
  }
  // Retired legacy group detail route now lives in the college People area.
  // Temporary same-host redirect neither leaks nor parses obsolete integer IDs.
  if (/^\/college-admin\/student-groups\/[^/]+\/?$/.test(path)) {
    const target=request.nextUrl.clone();
    target.pathname="/college/contacts";
    target.search="";
    const response=NextResponse.redirect(target,307);
    response.headers.set("Cache-Control","no-store");
    response.headers.set("x-request-id",requestId);
    return response;
  }
  const response = NextResponse.next({ request: { headers: forwardHeaders } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
