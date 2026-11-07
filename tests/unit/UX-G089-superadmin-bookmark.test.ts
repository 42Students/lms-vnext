import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { redirect } from "next/navigation";
import LegacyBookmark, { metadata } from "@/app/superadmin-login/page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => { throw new Error("REDIRECT:" + href); }),
}));
const load = (name: string) => readFileSync("src/app/superadmin-login/" + name, "utf8");

describe("UX-G089 retired Super Admin bookmark", () => {
  it("only redirects to the canonical first-party OTP flow, no privilege shortcut", () => {
    expect(() => LegacyBookmark()).toThrow("REDIRECT:/login?legacy=superadmin");
    expect(vi.mocked(redirect)).toHaveBeenCalledWith("/login?legacy=superadmin");
    const src = load("page.tsx");
    expect(src).not.toContain("createSession");
    expect(src).not.toContain("E2E_AUTH");
    expect(src).not.toContain("setCookie");
    expect(src).not.toContain("SUPER_ADMIN");
    expect(metadata).toMatchObject({ robots: { index: false, follow: false } });
  });
  it("keeps a non-disclosing recovery state with the correct sign-in destination", () => {
    const src = load("error.tsx"), pending = load("loading.tsx");
    expect(src).toContain('role="alert"');
    expect(src).toContain("onClick={reset}");
    expect(src).toContain('href="/login?legacy=superadmin"');
    expect(src).toContain("min-h-11");
    expect(src).not.toContain("{error.message}");
    expect(src).not.toContain("{error.digest}");
    expect(pending).toContain("Opening secure sign-in...");
  });
});
