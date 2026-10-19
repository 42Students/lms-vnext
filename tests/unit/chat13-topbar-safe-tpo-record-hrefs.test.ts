import { describe, expect, it } from "vitest";
import { safeTpoFindResult } from "@/components/shell/topbar/tpo-find-model";

const valid = (href: string) => ({
  group: "Students", label: "Authorized result", href,
});

describe("chat13: topbar TPO authorized suggestion URL boundary", () => {
  it("admits only rooted TPO record links and preserves valid query strings", () => {
    for (const href of [
      "/tpo/students",
      "/tpo/students?q=Alice%20Doe",
      "/tpo/companies/acme?tab=team",
      "/tpo/recruiters?stage=ACTIVE",
    ]) expect(safeTpoFindResult(valid(href)), href).toBe(true);
  });
  it("rejects protocol URLs, other portals, protocol-relative and backslash normalization", () => {
    for (const href of [
      "https://example.com/tpo/students",
      "javascript:alert(1)",
      "data:text/html,alert(1)",
      "//example.com/tpo/students",
      "/admin/people",
      "/tpo//example.com",
      "/tpo/\\\\example.com",
      "/tpo/students\nInjected",
      "/tpo/students\rInjected",
      "/tpo/students\tInjected",
      "/tpo/\u007f",
      "/tpo/x".repeat(400),
    ]) expect(safeTpoFindResult(valid(href)), href).toBe(false);
  });
  it("rejects malformed typed responses and oversized or empty copy", () => {
    const accepted = valid("/tpo/students");
    for (const bad of [
      null, undefined, [], "somewhere", 0, false,
      { ...accepted, group: "" },
      { ...accepted, label: "" },
      { ...accepted, href: 12 },
      { ...accepted, label: "x".repeat(241) },
      { ...accepted, group: "x".repeat(81) },
    ]) expect(safeTpoFindResult(bad)).toBe(false);
  });
});
