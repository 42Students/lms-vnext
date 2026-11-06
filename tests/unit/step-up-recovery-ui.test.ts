import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sessionExpiredHref } from "@/lib/return-to";

const guard = readFileSync("src/components/auth/session-response-guard.tsx", "utf8");

describe("step-up (recent sign-in) recovery in the browser", () => {
  it("builds a sign-in link with the 'recent' reason and a safe returnTo", () => {
    expect(sessionExpiredHref("/admin/people?tab=roles", "recent")).toBe("/?auth=recent&returnTo=%2Fadmin%2Fpeople%3Ftab%3Droles");
    expect(sessionExpiredHref("https://evil.example/x", "recent")).not.toContain("evil.example");
  });

  it("handles RECENT_SIGN_IN_REQUIRED before the generic 401 path, and ends the still-valid session first", () => {
    const step = guard.indexOf('reason === "RECENT_SIGN_IN_REQUIRED"');
    const generic = guard.indexOf('response.status === 401 || reason === "SESSION_EXPIRED"');
    expect(step).toBeGreaterThan(-1);
    expect(step).toBeLessThan(generic);
    const block = guard.slice(step, generic);
    expect(block).toContain('"/api/auth/session",{method:"DELETE"');
    expect(block).toContain('"recent"');
  });

  it("the sign-in landing page explains a recent sign-in is required", () => {
    expect(readFileSync("src/app/page.tsx", "utf8")).toContain("A recent sign-in is required");
  });

  it("never intercepts the auth endpoints themselves (no loop)", () => {
    expect(guard).toContain('requestUrl.pathname.startsWith("/api/auth/")');
  });
});
