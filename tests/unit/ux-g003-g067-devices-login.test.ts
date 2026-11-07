import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { safeReturnTo } from "@/lib/return-to";

const read = (path: string) => readFileSync(path, "utf8");

describe("UX-G003 signed-in device page source contracts", () => {
  const page = read("src/app/(authenticated)/account/security/page.tsx");
  const error = read("src/app/(authenticated)/account/security/error.tsx");
  const loading = read("src/app/(authenticated)/account/security/loading.tsx");

  it("requires real first-party session and never broadens tenant/session authorization", () => {
    expect(page).toContain("getCurrentDeviceSession()");
    expect(page).toContain("listActiveSessions(session.userId)");
    expect(page).toContain("redirect(\"/dashboard\")");
    expect(page).toContain("row[\"id\"] === session.sessionId");
    expect(page).not.toContain("getE2eIdentity");
  });

  it("reloads from the origin server rather than a same-URL client route cache", () => {
    expect(page).toContain('<form method="get" action="/account/security">');
    expect(page).toContain("Refresh device list");
    expect(page).not.toContain('href="/account/security"');
  });

  it("distinguishes empty, read failure, and real device sessions", () => {
    expect(page).toContain("rows === null");
    expect(page).toContain("rows.length === 0");
    expect(page).toContain("Unable to load signed-in devices");
    expect(page).toContain("No active sessions returned");
    expect(page).toContain("<DeviceList");
    expect(page).toContain('role="note"');
    expect(page).not.toContain("No active devices");
  });

  it("preserves bounded loading and safe in-shell error reporting", () => {
    expect(loading).toContain("Loading signed-in devices…");
    expect(loading).toContain("GracefulPageLoading");
    expect(error).toContain("GracefulErrorBoundary");
    expect(error).toContain("insideShell");
    expect(error).toContain("reset={reset}");
  });
});

describe("UX-G067 direct sign-in page and recovery", () => {
  const page = read("src/app/login/page.tsx");
  const error = read("src/app/login/error.tsx");
  const loading = read("src/app/login/loading.tsx");

  it("inherits canonical verified host login and keeps credential entry out of search indexes", () => {
    expect(page).toContain('export { default } from "../page"');
    expect(page).toContain("sharedLoginMetadata(args)");
    expect(page).toContain("robots: { index: false, follow: false, noarchive: true }");
  });

  it("shows a direct fresh-OTP action without exposing caught error messages", () => {
    expect(error).toContain('href="/login"');
    expect(error).toContain("Start a fresh secure sign-in");
    expect(error).toContain("GracefulErrorBoundary");
    expect(error).toContain("reset={reset}");
    expect(error).toContain("insideShell");
    expect(error).not.toContain("{error.message}");
    expect(error).not.toContain("{error.digest}");
  });

  it("announces the secure sign-in loading screen by name", () => {
    expect(loading).toContain("Preparing secure sign-in…");
    expect(loading).toContain("PublicPageLoading");
  });

  it("rejects off-site return destinations and login loops", () => {
    expect(safeReturnTo("//evil.example")).toBeNull();
    expect(safeReturnTo("/login")).toBeNull();
    expect(safeReturnTo("/api/auth/devices")).toBeNull();
    expect(safeReturnTo("/account/security")).toBe("/account/security");
  });
});
