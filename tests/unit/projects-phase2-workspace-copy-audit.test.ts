import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const legacyA=read("docs/audit/legacy-copy-A.md");
const legacyB=read("docs/audit/legacy-copy-B.md");
const workspace=read("src/components/projects/project-workspace.tsx");
const resourceList=read("src/components/projects/project-resource-list.tsx");
const college=read("src/components/projects/project-admin-nav.tsx");
const mentor=read("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
const learner=read("src/app/(authenticated)/learn/projects/[projectId]/page.tsx");
describe("Phase 2 exact old-LMS Projects headings and empty states",()=>{
  it("uses legacy Team and Resources copy, not implementation language",()=>{
    const words=[
      "Project people","No resources yet. Share the first link or file with your team.",
      "No resources yet. Add the briefs, templates and reference links your team will need.",
      "Back to projects","Not submitted",
    ];
    for(const value of words){
      expect(legacyA).toContain(value);
      // The empty-state copy was moved into the resource directory component.
      // Assert where it renders rather than reintroducing duplicate UI.
      expect(value.startsWith("No resources yet.")?resourceList:workspace).toContain(value);
    }
    for(const stale of ["Canonical college memberships","Template and runtime links available","No active resources."])
      expect(workspace).not.toContain(stale);
  });
  it("keeps one route-level tab strip for each role",()=>{
    expect(mentor).toContain("<MentorProjectTabs");
    expect(mentor).not.toContain("sectionBaseHref=");
    expect(learner).toContain("<LearnerProjectTabs");
    expect(learner).not.toContain("sectionBaseHref=");
    expect(college).toContain('if (basePath === "/college/projects") return null;');
    expect(college).toContain("PROJECT_ADMIN_SECTIONS.map");
    for(const label of ["Workspaces","At Risk","Readiness","Submissions","Templates","Audit"]){
      expect(legacyA).toContain('label: "'+label+'"');
      expect(legacyB).toContain('label: "'+label+'"');
    }
  });
});
