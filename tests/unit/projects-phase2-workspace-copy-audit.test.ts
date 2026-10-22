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
    for(const value of ["Project people","Back to projects","Not submitted"]){
      expect(legacyA).toContain(value);
      expect(workspace).toContain(value);
    }
    // The reusable resource directory renders the old-LMS title and
    // role-specific descriptions as separate JSX props.
    expect(resourceList).toContain('title="No resources yet"');
    for(const detail of [
      "Share the first link or file with your team.",
      "Add the briefs, templates and reference links your team will need.",
    ]){
      expect(legacyA).toContain("No resources yet. "+detail);
      expect(resourceList).toContain(detail);
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
