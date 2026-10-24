import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const form=read("src/components/projects/project-final-delivery-controls.tsx");
const workspace=read("src/components/projects/project-workspace.tsx");
const legacyA=read("docs/audit/legacy-copy-A.md");
const legacyB=read("docs/audit/legacy-copy-B.md");
const mentor=read("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
const learner=read("src/app/(authenticated)/learn/projects/[projectId]/page.tsx");
const college=read("src/components/projects/project-admin-nav.tsx");
describe("PR-S2-07 registered 0091 final delivery links and Project page copy",()=>{
 it("preserves reviewed attachments and submits additional links to registered 0091 service",()=>{
  expect(form).toContain("safeDraftAttachments(draft?.attachments)");
  expect(form).toContain("attachments,");
  for(const value of ["Additional files & links","Add link","Save draft"]){
    expect(legacyA).toContain(value);expect(form).toContain(value.replace("&","&amp;")===value?value:value.replace("&","&amp;"));
  }
  expect(form).toContain('kind:"LINK"');
 });
 it("keeps one account-level tab strip and legacy labels",()=>{
  expect(workspace.match(/ariaLabel="Project workspace sections"/g)).toHaveLength(1);
  expect(mentor).toContain("<MentorProjectTabs");
  expect(learner).toContain("<LearnerProjectTabs");
  expect(college).toContain('if (basePath === "/college/projects") return null;');
  expect(college).not.toContain('basePath === "/admin/projects") return null');
  expect(college).toContain('styles["legacy"]');
  expect(college).toContain('ariaLabel="Projects"');
  for(const label of ["Workspaces","At Risk","Readiness","Submissions","Templates","Audit"]){
   expect(legacyA).toContain('label: "'+label+'"');
   expect(legacyB).toContain('label: "'+label+'"');
  }
  expect(workspace).not.toContain("Versioned submissions, immutable review history");
 });
});