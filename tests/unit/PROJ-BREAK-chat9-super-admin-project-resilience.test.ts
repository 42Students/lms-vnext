import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");

describe("IIT Dharwad Super Admin Projects graceful degradation",()=>{
  it("PROJ-BREAK-admin-resilience-17 optional template failures do not hide the authorized workspace listing",()=>{
    const page=source("src/app/(authenticated)/admin/projects/page.tsx");
    expect(page).toContain("listProjectAdminSnapshots(");
    expect(page).toContain("listAssignedProjectTemplates(context, collegeId)");
    expect(page).toContain(".catch(() => ({ok:false as const}))");
    expect(page).toContain("templatesResult.ok?templatesResult.value:[]");
    expect(page).toContain("<ProjectAdminWorkspaceList");
    expect(page).toContain("Your workspaces are still visible; refresh to try again.");
    expect(page).toContain('role="status"');
    expect(page).not.toMatch(/const \[result, templates\]\s*=\s*await Promise\.all/);
  });
  it("PROJ-BREAK-admin-idor-17 missing selected college cannot attempt either project query",()=>{
    const page=source("src/app/(authenticated)/admin/projects/page.tsx");
    const firstGuard=page.indexOf("if (!collegeId) {");
    const scopeQuery=page.indexOf("listProjectAdminSnapshots(");
    expect(firstGuard).toBeGreaterThan(0);
    expect(scopeQuery).toBeGreaterThan(firstGuard);
    expect(page).toContain('title="No college selected"');
    expect(page).toContain("Pick a college in the header");
  });
});
