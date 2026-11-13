import { describe, expect, it } from "vitest";
import { legacyCollegeWorkspacesListHref } from "@/modules/projects/legacy-college-workspaces-list-query";
import { legacyClassWorkspaceCreateHref } from "@/modules/projects/legacy-class-workspace-create-query";

/**
 * Old bookmarks redirect through these two helpers. The guarantee that matters is behavioural: whatever the query string
 * says, the result is a same-site path under /college/projects, built only from allowlisted, bounded values. The page
 * files just call them; these tests replace the old checks that searched the page source for inline strings.
 */
const hostile = [
  "//evil.example", "https://evil.example", "/\\evil.example", "javascript:alert(1)", "../../etc/passwd",
  "<script>", "a".repeat(500), "x\r\nSet-Cookie: y=1", "%2F%2Fevil.example",
];

describe("legacyCollegeWorkspacesListHref", () => {
  it("is the plain list when nothing valid is supplied", () => {
    expect(legacyCollegeWorkspacesListHref({})).toBe("/college/projects");
  });

  it("keeps supported, bounded filters", () => {
    const href = legacyCollegeWorkspacesListHref({ q: "capstone", status: "ACTIVE", view: "table", page: "3", pageSize: "20" });
    expect(href.startsWith("/college/projects?")).toBe(true);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(Object.fromEntries(params)).toEqual({ q: "capstone", status: "ACTIVE", view: "table", page: "3", pageSize: "20" });
  });

  it("drops anything outside the allowlists or bounds", () => {
    const href = legacyCollegeWorkspacesListHref({
      q: "<img onerror=1>", status: "ADMIN", view: "grid", page: "0", pageSize: "9999",
      redirect: "https://evil.example", next: "//evil.example", collegeId: "someone-else",
    });
    expect(href).toBe("/college/projects");
  });

  it("never produces anything but a same-site path, whatever the input", () => {
    for (const value of hostile) {
      for (const key of ["q", "status", "view", "page", "pageSize", "next", "redirect", "returnTo", "url"]) {
        const href = legacyCollegeWorkspacesListHref({ [key]: value });
        expect(href, key + "=" + value).toMatch(/^\/college\/projects(\?[A-Za-z0-9%=&_.+~*'()!-]*)?$/);
        expect(href.startsWith("//")).toBe(false);
        expect(href).not.toMatch(/[\r\n]/);
      }
    }
  });

  it("ignores repeated values instead of picking one", () => {
    expect(legacyCollegeWorkspacesListHref({ status: ["ACTIVE", "ARCHIVED"], q: ["a", "b"] })).toBe("/college/projects");
  });
});

describe("legacyClassWorkspaceCreateHref", () => {
  it("always opens team mode and keeps only a safe template id", () => {
    expect(legacyClassWorkspaceCreateHref({})).toBe("/college/projects/create?mode=teams");
    expect(legacyClassWorkspaceCreateHref({ templateId: "tmpl_01-A" })).toBe("/college/projects/create?mode=teams&templateId=tmpl_01-A");
  });

  it("drops unsafe or oversized template ids and extra parameters", () => {
    for (const value of hostile) {
      const href = legacyClassWorkspaceCreateHref({ templateId: value, next: value, mode: "single" });
      expect(href, value).toMatch(/^\/college\/projects\/create\?mode=teams(&templateId=[A-Za-z0-9_-]{1,120})?$/);
    }
    expect(legacyClassWorkspaceCreateHref({ templateId: ["a", "b"] })).toBe("/college/projects/create?mode=teams");
  });
});
