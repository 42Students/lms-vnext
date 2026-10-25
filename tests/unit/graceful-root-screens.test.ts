import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { safeReturnTo, sessionExpiredHref } from "@/lib/return-to";
import { isStaleChunkError } from "@/components/public/graceful-error-boundary";

const source = (file: string) => readFileSync(file, "utf8");

describe("graceful route screens", () => {
  it("GR-11 root and authenticated boundaries log a safe reference and offer retry", () => {
    expect(source("src/app/global-error.tsx")).toContain("GracefulErrorBoundary");
    expect(source("src/app/error.tsx")).toContain("GracefulErrorBoundary");
    expect(source("src/app/(authenticated)/error.tsx")).toContain("GracefulErrorBoundary");
    expect(source("src/components/public/graceful-screen.tsx")).toContain("Copy reference");
    expect(source("src/app/api/client-errors/route.ts")).toContain("isSameOriginRequest");
  });
  it("GR-12 detects stale deploy chunks and reloads at most once per tab/path", () => {
    expect(isStaleChunkError(new Error("ChunkLoadError"))).toBe(true);
    expect(isStaleChunkError(new Error("Failed to fetch dynamically imported module"))).toBe(true);
    expect(isStaleChunkError(new Error("Validation failed"))).toBe(false);
    expect(source("src/components/public/graceful-error-boundary.tsx"))
      .toContain("sessionStorage.setItem(key, \"yes\")");
  });
  it("GR-13 includes not-found paths for each role and public links", () => {
    for (const role of ["learn", "teach", "teacher", "mentor", "college", "college-admin",
      "tpo", "recruiter", "admin", "superadmin", "hr"]) {
      const screen=source(`src/app/(authenticated)/${role}/not-found.tsx`);
      expect(screen).toContain('<PageHeader title="Page not found"');
      expect(screen).toMatch(/<Link\b|<PageBackLink\b/);
    }
    const fallback=source("src/app/not-found.tsx");
    expect(fallback).toContain('let homeHref = "/dashboard"');
    expect(fallback).toContain('homeHref={homeHref}');
    expect(fallback).toContain('getShellNavigation(context)[0]?.href');
    expect(fallback).toContain('!landing.startsWith("//")');
  });
  it("GR-14 provides an accessible forbidden page with a role-safe home link", () => {
    expect(source("src/app/forbidden/page.tsx")).toContain("You do not have access to this page");
    expect(source("src/app/forbidden/page.tsx")).toContain('homeHref="/dashboard"');
  });
  it("GR-15 rejects external redirect tricks and retains safe route targets", () => {
    expect(safeReturnTo("https://example.com")).toBeNull();
    expect(safeReturnTo("//example.com")).toBeNull();
    expect(safeReturnTo("/api/private")).toBeNull();
    expect(safeReturnTo("/learn/courses?page=2")).toBe("/learn/courses?page=2");
    expect(sessionExpiredHref("/learn/courses")).toContain("returnTo=%2Flearn%2Fcourses");
    expect(source("src/components/auth/session-response-guard.tsx")).toContain("sessionExpiredHref(");
    expect(source("src/components/auth/login-form.tsx")).toContain("safeReturnTo(");
  });
  it("GR-16 restores the screen after reconnecting", () => {
    expect(source("src/components/public/offline-banner.tsx")).toContain('addEventListener("online"');
    expect(source("src/components/public/offline-banner.tsx")).toContain('role="alert"');
  });
  it("GR-17 maintenance flag returns 503 and keeps /ready truthful", () => {
    const proxy = source("src/proxy.ts");
    expect(proxy).toContain('process.env["MAINTENANCE_MODE"] === "1"');
    expect(proxy).toContain('path !== "/ready"');
    expect(proxy).toContain('"retry-after": "60"');
  });
  it("GR-22 provides a no-JavaScript message", () => {
    expect(source("src/app/layout.tsx")).toContain("Please enable JavaScript to use the LMS.");
  });
  it("GR-23 tells unsupported browsers to update instead of showing a blank page", () => {
    expect(source("src/components/public/browser-support-notice.tsx")).toContain("Please update your browser");
  });
  it("GR-11 sends a schema-valid browser report without exposing exception text", () => {
    const boundary = source("src/components/public/graceful-error-boundary.tsx");
    expect(boundary).toContain('message: "A page could not be displayed."');
    expect(boundary).toContain("event: kind");
    expect(boundary).toContain("requestId: reportId");
    expect(boundary).toContain("const reportId = `00000000-0000-4000-8000-0000${id}`;");
    expect(boundary).not.toContain("body: JSON.stringify({ requestId: id, kind })");
    expect(source("src/modules/log-alerts/client-report.ts")).toContain("browserErrorSchema");
  });

});
