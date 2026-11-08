import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { legacyClassWorkspaceCreateHref } from "@/modules/projects/legacy-class-workspace-create-query";

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
