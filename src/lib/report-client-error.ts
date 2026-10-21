"use client";

import { redactAlertText, safeAlertPath } from "@/modules/log-alerts/redaction";

/** Privacy-safe browser events: error bodies, request URLs and user input never leave the browser. */
export type ClientErrorEvent = "render" | "api" | "auth" | "video" | "upload" |
  "resource" | "unhandled_rejection" | "console";

const REPORT_WINDOW_MS = 60_000;
const MAX_REPORTS_PER_WINDOW = 8;
const RECENT_DUPLICATE_MS = 60_000;
let reportWindowStart = 0;
let reportWindowCount = 0;
const lastReports = new Map<string, number>();
let installedCleanup: (() => void) | null = null;

function intentionalAbort(error: unknown): boolean {
 if (!(error instanceof Error)) return false;
 return error.name === "AbortError" ||
  /(?:navigation cancelled|route change cancelled|load cancelled)/i.test(error.message);
}

function errorName(error: unknown): string {
 if (!(error instanceof Error)) return "Error";
 return error.name.replace(/[^A-Za-z]/g, "").slice(0, 80) || "Error";
}

function safeMessage(error: unknown): string {
 const raw = error instanceof Error ? error.message :
  typeof error === "string" ? error : "Browser event failed";
 return redactAlertText(raw).slice(0, 300) || "Browser event failed";
}

function submit(event: ClientErrorEvent, error: unknown, component: string, requestId?: string): void {
 if (typeof window === "undefined" || intentionalAbort(error)) return;
 const now = Date.now();
 if (!reportWindowStart || now - reportWindowStart >= REPORT_WINDOW_MS) {
  reportWindowStart = now;
  reportWindowCount = 0;
  lastReports.clear();
 }
 if (reportWindowCount >= MAX_REPORTS_PER_WINDOW) return;
 const message = safeMessage(error);
 const name = errorName(error);
 const path = safeAlertPath(window.location.pathname);
 const signature = [event, name, message, path].join("|");
 const previous = lastReports.get(signature);
 if (previous !== undefined && now - previous < RECENT_DUPLICATE_MS) return;
 reportWindowCount++;
 if (lastReports.size > 64) lastReports.clear();
 lastReports.set(signature, now);
 // Synthetic size bands preserve responsive diagnostics without exact screen data.
 const viewport=window.innerWidth<768?"375x800":
  window.innerWidth<1024?"800x1000":"1440x900";
 const safeComponent = /^(?:root|global|page|widget)$/.test(component) ? component : "global";
 const safeRequestId = requestId && /^(?:[0-9a-f]{8}|[0-9a-f]{8}-[0-9a-f-]{27,})$/i.test(requestId)
  ? requestId : undefined;
 try {
  void fetch("/api/client-errors", {
   method: "POST",
   headers: { "content-type": "application/json" },
   body: JSON.stringify({ event, message, name, component: safeComponent, path, viewport, requestId: safeRequestId }),
   keepalive: true,
   cache: "no-store",
  }).catch(() => undefined);
 } catch {
  // Reporting must never block recovery or trigger another reporting attempt.
 }
}

/** Error boundaries retain their existing API; the payload is now redacted and rate-limited. */
export function reportClientError(error: Error, requestId: string, component = "root"): void {
 submit("render", error, component, requestId);
}

/** For mid-action API, authentication, player and upload failures. Pass no request body or URL. */
export function reportClientEvent(event: Exclude<ClientErrorEvent, "render" | "console" | "resource" | "unhandled_rejection">,
 error: unknown, component = "global"): void {
 submit(event, error, component);
}

/** Named legacy categories avoid reducing all user actions to a render error.
 * No request URLs, posted values, stack traces or arbitrary component names
 * are forwarded to the ingestion endpoint.
 */
export const reportApiFailure=(error:unknown)=>submit("api",error,"global");
export const reportAuthFailure=(error:unknown)=>submit("auth",error,"global");
export const reportVideoFailure=(error:unknown)=>submit("video",error,"widget");
export const reportUploadFailure=(error:unknown)=>submit("upload",error,"widget");

/** Install once from a persistent client root. Console capture is explicitly opt-in. */
export function installClientErrorReporting(options: { captureConsoleErrors?: boolean } = {}): () => void {
 if (typeof window === "undefined") return () => undefined;
 if (installedCleanup) return installedCleanup;
 const onWindowError = (event: Event) => {
  if (event instanceof ErrorEvent) {
   submit("render", event.error instanceof Error ? event.error : new Error("Browser script error"),
    "global");
   return;
  }
  const target = event.target;
  const tag = target instanceof Element ? target.tagName.toLowerCase() : "";
  if (tag === "script" || tag === "link" || tag === "img" || tag === "video" || tag === "audio") {
   submit("resource", new Error(tag + " resource load failed"), "global");
  }
 };
 const onUnhandledRejection = (event: PromiseRejectionEvent) => {
  if (!intentionalAbort(event.reason)) submit("unhandled_rejection", event.reason, "global");
 };
 window.addEventListener("error", onWindowError, true);
 window.addEventListener("unhandledrejection", onUnhandledRejection);

 const originalConsoleError = options.captureConsoleErrors ? console.error : null;
 const wrappedConsoleError: typeof console.error | null = originalConsoleError
  ? (...args: Parameters<typeof console.error>) => {
     originalConsoleError(...args);
     submit("console", args[0] instanceof Error ? args[0] : new Error("Console error"), "global");
    }
  : null;
 if (wrappedConsoleError) console.error = wrappedConsoleError;

 const cleanup = () => {
  window.removeEventListener("error", onWindowError, true);
  window.removeEventListener("unhandledrejection", onUnhandledRejection);
  if (originalConsoleError && wrappedConsoleError && console.error === wrappedConsoleError)
   console.error = originalConsoleError;
  installedCleanup = null;
 };
 installedCleanup = cleanup;
 return cleanup;
}
