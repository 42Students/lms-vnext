import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { templateDirectoryQuerySchema, TEMPLATE_DIRECTORY_PAGE_SIZE } from
  "@/modules/projects/super-admin-template-directory-model";
import { countTemplateBlueprintItems } from "@/modules/projects/template-subview-model";
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("IIT Dharwad Projects: Super Admin template scale and graceful college creator", () => {
  it("PROJ-BREAK-scale-22 loads only the current version of each paged template for directory counts", () => {
    const source = read("src/modules/projects/super-admin-template-directory-service.ts");
    const list = source.slice(source.indexOf("const versions=items.length"));
    expect(list).toContain(".innerJoin(projectTemplates,and(");
    expect(list).toContain("eq(projectTemplateVersions.templateId,projectTemplates.id)");
    expect(list).toContain("eq(projectTemplateVersions.version,projectTemplates.currentVersion)");
    expect(list).toContain("inArray(projectTemplates.id,items.map(x=>x.id))");
    expect(source).toContain(".limit(TEMPLATE_DIRECTORY_PAGE_SIZE)");
    expect(TEMPLATE_DIRECTORY_PAGE_SIZE).toBe(20);
    expect(countTemplateBlueprintItems({
      releases: [{}], sprints: [{}, {}], tasks: [{}, {}, {}], resources: [],
    })).toEqual({ releases: 1, sprints: 2, tasks: 3, resources: 0 });
  });
  it("PROJ-BREAK-scale-23 rejects an unbounded or malformed Super Admin template page", () => {
    for (const page of [0, -1, 1001, 1.5, "Infinity", "NaN", "0x10", "1e2", " 2 ", ["1"]]) {
      expect(templateDirectoryQuerySchema.safeParse({page}).success).toBe(false);
    }
    expect(templateDirectoryQuerySchema.safeParse({page:1000}).success).toBe(true);
    expect(templateDirectoryQuerySchema.safeParse({q:"x".repeat(101)}).success).toBe(false);
    expect(templateDirectoryQuerySchema.safeParse({unknownFilter:"active"}).success).toBe(false);
  });
  it("PROJ-BREAK-ux-14 invalid or revoked college creation scope shows friendly recovery without template data", () => {
    const code = read("src/app/(authenticated)/admin/projects/workspaces/new/page.tsx");
    expect(code).toContain("if (!collegeId) return");
    expect(code).toContain("await requireTeamCreationAuthority(context, collegeId)");
    expect(code).toContain("templates = await listAssignedProjectTemplates(context, collegeId)");
    expect(code).toContain("<ErrorState");
    expect(code).toContain("Project creation access denied");
    expect(code).toContain("Project setup unavailable");
    expect(code).toContain("No workspace was created.");
    expect(code).toContain('href="/admin/projects/workspaces/new"');
    const guard = code.indexOf("await requireTeamCreationAuthority(context, collegeId)");
    const readIndex = code.indexOf("templates = await listAssignedProjectTemplates(context, collegeId)");
    expect(guard).toBeGreaterThan(0);
    expect(readIndex).toBeGreaterThan(guard);
  });
});
