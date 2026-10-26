import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {COLLEGE_LEGACY_GROUPS,collegeLegacyGroupForPath,collegeLegacyTabActive} from "@/modules/people/college-legacy-tabs-model";
import {SUPER_ADMIN_LEGACY_GROUPS,superAdminLegacyGroupForPath,superAdminLegacyTabActive} from "@/modules/people/super-admin-legacy-tabs-model";
import {TPO_SETTINGS_NAV_GROUPS} from "@/components/placements/tpo-settings-nav";
const source=(file:string)=>readFileSync(join(process.cwd(),file),"utf8");

describe("chat-9 Round 9: legacy labels survive UX rollout",()=>{
  it("UX-admin-legacy-academic-01 keeps only ten academic tabs and routes the overview through Departments",()=>{
    expect(COLLEGE_LEGACY_GROUPS[0]?.tabs.map(t=>t.label)).toEqual([
      "Departments","Programs","Semesters","Semester–Course Mapping",
      "Batches","Classes","Batch Promotion","Lecture Halls","Electives","Attendance"
    ]);
    expect(collegeLegacyGroupForPath("/college/academics")?.title).toBe("Academic Setup");
    expect(collegeLegacyTabActive("/college/academics","/college/departments")).toBe(true);
    expect(superAdminLegacyGroupForPath("/admin/academics")?.title).toBe("Academic Setup");
    expect(superAdminLegacyTabActive("/admin/academics","/admin/departments")).toBe(true);
    expect(SUPER_ADMIN_LEGACY_GROUPS[1]?.tabs.some(t=>t.label==="Academic periods")).toBe(false);
  });
  it("UX-admin-projects-labels-01 preserves the original College Project copy and scope recovery",()=>{
    const workspaces=source("src/app/(authenticated)/college/projects/page.tsx");
    const risk=source("src/components/projects/project-admin-at-risk-page.tsx");
    expect(workspaces).toContain('title="Project workspaces"');
    expect(workspaces).toContain('<ProjectAdminNav basePath="/college/projects" active="workspaces"');
    expect(workspaces).toContain('title="No college selected"');
    expect(workspaces).toContain("Bulk reassign mentor");
    expect(workspaces).toContain('role="alert"');
    expect(workspaces).toContain("Bulk reassign mentor");
    expect(risk).toContain('description="Workspaces with no recent activity, an active blocker, or a pending review."');
    expect(risk).toContain("Workspace blocker data is unavailable");
  });
  it("UX-admin-recruiters-label-01 keeps the Super Admin tab and editor title identical",()=>{
    const title=source("src/components/admin/super-admin-hr-accounts.tsx");
    expect(title).toContain('title="Recruiter accounts"');
    expect(title).toContain('description="Recruiter accounts:');
    expect(title).toContain("<DataTable");
    expect(SUPER_ADMIN_LEGACY_GROUPS[4]?.tabs.find(t=>t.href==="/admin/recruiters")?.label).toBe("Recruiter accounts");
  });
  it("UX-admin-tpo-settings-label-01 keeps the exact Recruiters settings tab",()=>{
    const labels=TPO_SETTINGS_NAV_GROUPS.flatMap(group=>group.items.map(item=>item.label));
    expect(labels).toContain("Recruiters");
    expect(labels).toEqual([
      "Placement rules","Job types","After college","Placement team","Recruiters",
    ]);
    const overview=source("src/app/(authenticated)/tpo/settings/page.tsx");
    expect(overview).toContain('import TpoPlacementRulesSettingsPage from "./rules/page"');
    const ruleScreen=source("src/app/(authenticated)/tpo/settings/rules/page.tsx");
    expect(ruleScreen).toContain(">Placement rules</h2>");
    expect(overview).toContain('href="/tpo/settings/public-page"');
  });
});
