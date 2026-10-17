import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Project workspace legacy title-only headings across roles",()=>{
 it("renders the real project title and optional persisted summary without invented eyebrow",()=>{
  const ui=readFileSync("src/components/projects/project-workspace.tsx","utf8");
  expect(ui).toContain("title={workspace.project.title}");
  expect(ui).toContain('title={workspace.project.title}');
  expect(ui).toContain('description={mode==="MENTOR"');
  expect(ui).toContain('workspace.project.summary ?? undefined');
  expect(ui).toContain('"Mentor: "');
  expect(ui).not.toContain("Project workspace for execution, review and final delivery.");
  expect(ui).not.toContain("eyebrow={eyebrow}");
 });
 it("does not reinsert a synthetic role eyebrow from Mentor Learner or College Admin routes",()=>{
  const paths=[
   "src/components/projects/admin-project-section-page.tsx",
   "src/app/(authenticated)/mentor/projects/[projectId]/page.tsx",
   "src/app/(authenticated)/learn/projects/[projectId]/page.tsx",
   "src/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx",
   "src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx",
  ];
  for(const path of paths){
   expect(readFileSync(path,"utf8")).not.toMatch(/eyebrow=/);
  }
 });
});
