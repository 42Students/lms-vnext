import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-college-projects-create-01 /college/projects/create",()=>{
  const route="src/app/(authenticated)/college/projects/create/page.tsx";
  it("keeps college membership scope before fetching assigned templates or showing creation",()=>{
    const page=read(route);
    expect(page).toContain("await getCurrentRequestContext()");
    expect(page).toContain("const collegeId=getProjectAdminCollegeId(context)");
    expect(page).toContain("if(!collegeId)");
    expect(page.indexOf("if(!collegeId)")).toBeLessThan(page.indexOf("listAssignedProjectTemplates(context,collegeId)"));
    const guard=read("src/modules/projects/admin-college-scope.ts");
    expect(guard).toContain("isSuperAdmin(context)");
    expect(guard).toContain("context.adminScope?.collegeId ?? null");
    expect(guard).toContain("context.membership?.collegeId ?? null");
    expect(guard).toContain('can(context, "projects.manage"');
    expect(guard).toContain("organizationId,");
    expect(page).toContain("listAssignedProjectTemplates(context,collegeId)");
  });
  it("renders accessible recovery for missing membership and preserves a real creation form",()=>{
    const page=read(route);
    const control=read("src/components/projects/project-create-control.tsx");
    expect(page).toContain("Select a college to continue.");
    expect(page).toContain('role="alert"');
    expect(page).toContain('href="/college/projects"');
    expect(page).toContain('title="Create workspace"');
    expect(page).toContain("<CreateProjectControl standalone");
    expect(page).toContain("templates={templates.map(");
    expect(control).toContain('import { Dialog } from "@/components/ui/dialog"');
    expect(control).toContain('import { Button } from "@/components/ui/button"');
    expect(control).toContain("submitLock.current");
    expect(control).toContain("disabled=");
  });
});
