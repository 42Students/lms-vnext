import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { legacyClassWorkspaceCreateHref } from "@/modules/projects/legacy-class-workspace-create-query";
import { legacyCollegeWorkspacesListHref } from "@/modules/projects/legacy-college-workspaces-list-query";

describe("UX-G041 legacy college class-workspace creation handoff", () => {
  const templateId = "e81d25aa-26f7-43ae-9e72-d429b7e82ae1";

  it("keeps an existing authorized-template deep link in team creation mode", () => {
    const url = new URL(legacyClassWorkspaceCreateHref({
      templateId, mode: "single", returnTo: "https://malicious.example",
    }), "https://local.test");
    expect(url.pathname).toBe("/college/projects/create");
    expect(url.searchParams.get("mode")).toBe("teams");
    expect(url.searchParams.get("templateId")).toBe(templateId);
    expect([...url.searchParams.keys()]).toEqual(["mode", "templateId"]);
  });

  it("rejects ambiguous or unsafe template inputs without breaking creation", () => {
    for (const templateId of [["one", "two"], "bad/id", "<script>", "x".repeat(121), "", undefined]) {
      const url = new URL(legacyClassWorkspaceCreateHref({ templateId }), "https://local.test");
      expect(url.search).toBe("?mode=teams");
    }
  });

  it("keeps college assignment validation and the template through mode switches", () => {
    const src = readFileSync(join(process.cwd(),
      "src/app/(authenticated)/college/projects/create/page.tsx"), "utf8");
    expect(src).toContain("getProjectAdminCollegeId(context)");
    expect(src).toContain("listAssignedProjectTemplates(context,collegeId)");
    expect(src).toContain("templates.some(template=>template.templateId===requested)");
    expect(src).toContain("initialTemplateId={selectedTemplateId}");
    expect(src).toContain('encodeURIComponent(selectedTemplateId)');
  });
});

describe("UX-G041 legacy workspace list bookmarks", () => {
  it.each(["PLANNED","ACTIVE","IN_PROGRESS","READY","BLOCKED","COMPLETED","ARCHIVED"])(
    "preserves current %s status", status => {
      const url = new URL(legacyCollegeWorkspacesListHref({
        status, q:"backlog", view:"cards", page:"2", pageSize:"50", extra:"ignored",
      }), "https://local.test");
      expect(url.pathname).toBe("/college/projects");
      expect(url.searchParams.get("status")).toBe(status);
      expect(url.searchParams.get("q")).toBe("backlog");
      expect(url.searchParams.get("view")).toBe("cards");
      expect(url.searchParams.get("page")).toBe("2");
      expect(url.searchParams.get("pageSize")).toBe("50");
      expect(url.searchParams.has("extra")).toBe(false);
    });

  it("drops obsolete statuses, repeated values and invalid pagination instead of failing", () => {
    expect(legacyCollegeWorkspacesListHref({
      status:"PAUSED", q:["first","second"], page:"-1",
      pageSize:"1000", view:"all",
    })).toBe("/college/projects");
    expect(legacyCollegeWorkspacesListHref({
      status:"ALL", q:"unsafe<query", page:"100001", pageSize:"10",
    })).toBe("/college/projects?pageSize=10");
    expect(legacyCollegeWorkspacesListHref({q:"line\u0001break"})).toBe("/college/projects");
  });
});
