import {describe,it,expect} from "vitest";
import {LEARNER_PROJECT_DETAIL_TABS} from "@/modules/projects/learner-project-tab-alias-model";
import {PROJECT_ADMIN_SECTIONS} from "@/modules/projects/project-admin-navigation-model";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const legacyA=read("docs/audit/legacy-copy-A.md");
const legacyB=read("docs/audit/legacy-copy-B.md");
const mentor=read("src/components/projects/mentor-project-tabs.tsx");
const college=read("src/components/projects/project-admin-nav.tsx");
const workspace=read("src/components/projects/project-workspace.tsx");
const mentorPage=read("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
const learnerPage=read("src/app/(authenticated)/learn/projects/[projectId]/page.tsx");
const admin=read("src/components/projects/admin-project-section-page.tsx");
describe("Phase2 exact legacy Projects labels + single tab strip",()=>{
  it("uses only the learner-visible subset of legacy Project section tabs",()=>{
    const labels=LEARNER_PROJECT_DETAIL_TABS.map(tab=>tab.label);
    expect(labels).toEqual(["Overview","People & Meetings","Releases and Sprints","Board","Resources","Activity"]);
    for(const label of labels)expect(legacyA).toContain("prop:label: "+label);
    expect(learnerPage).toContain("Final delivery");
    expect(learnerPage).toContain("<LearnerProjectTabs");
    expect(learnerPage).not.toContain("sectionBaseHref=");
  });
  it("keeps exact Mentor labels and drops obsolete unassigned-task warning",()=>{
    const labels=[...mentor.matchAll(/label: "([^"]+)"/g)].map(match=>match[1]);
    expect(labels).toEqual(["Overview","Board","Sprints & releases","Team & meetings","Performance","Resources","Activity"]);
    expect(mentorPage).not.toContain("does not yet persist task assignee fields");
    expect(mentorPage).not.toContain("sectionBaseHref=");
  });
  it("has one workspace-level Admin tab strip, not the list-level strip too",()=>{
    expect(admin).toContain("sectionBaseHref={");
    // The navigation remains mounted in the explicit recovery state, while
    // the successful workspace has a single scoped section tab strip.
    expect(admin).toContain('<ProjectAdminNav basePath={basePath} active="workspaces"/>');
    expect(admin).toContain("<WorkspaceContextTabs projectId={projectId}");
    expect(workspace).toContain('ariaLabel="Project workspace sections"');
    expect(read("src/components/ui/tabs.tsx")).toContain('aria-label={ariaLabel}');
    expect(PROJECT_ADMIN_SECTIONS.map(section=>[section.suffix,section.label])).toEqual([
      ["","Workspaces"],["/at-risk","At Risk"],["/readiness","Readiness"],
      ["/submissions","Submissions"],["/templates","Templates"],["/audit","Audit"],
    ]);
    expect(college).toContain("items={PROJECT_ADMIN_SECTIONS.map");
    expect(college).toContain('if (basePath === "/college/projects") return null;');
    for(const label of ["Workspaces","At Risk","Readiness","Submissions","Templates","Audit"]){
      expect(legacyA).toContain('label: "'+label+'"');
      expect(legacyB).toContain('label: "'+label+'"');
    }
  });
});
