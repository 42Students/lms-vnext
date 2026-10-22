import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const admin=(route:string)=>read("src/app/(authenticated)/admin/"+route+"/page.tsx");

describe("chat-9 last-third scroll and motion: hidden scrollbars require visible cues",()=>{
 it("UX-admin-scroll-motion-01 /admin/projects/templates/[templateId]/versions/[versionId] comparison is keyboard scrollable with a vertical edge",()=>{
  const page=admin("projects/templates/[templateId]/versions/[versionId]");
  expect(page).toContain('aria-label={`${change.label} ${value.label} version content`}');
  expect(page).toContain("overflow-y-auto overscroll-contain");
  expect(page).toContain("[mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)]");
  expect(page).toContain("tabIndex={0}");
 });
 it("UX-admin-scroll-motion-02 /admin/settings high-impact confirmation and outcome lists use named, bounded scroll regions",()=>{
  const page=read("src/components/admin/tenant-settings-editor.tsx");
  for(const label of ["High-impact settings review","Tenant settings change results"])expect(page).toContain(label);
  expect(page.match(/overflow-auto overscroll-contain/g)?.length).toBe(2);
  expect(page.match(/mask-image:linear-gradient\(to_bottom/g)?.length).toBe(2);
  expect(page.match(/tabIndex=\{0\}/g)?.length).toBe(2);
 });
 it("UX-admin-scroll-motion-03 /admin/students import history dialog and table respect dvh and horizontal scroll cues",()=>{
  const page=read("src/components/admin/super-admin-student-import-history.tsx");
  expect(page).toContain("100dvh-2rem");
  expect(page).toContain("overflow-y-auto overscroll-contain");
  expect(page).toContain('aria-label="Bulk import history records"');
  expect(page).toContain("overflow-x-auto overscroll-x-contain");
  expect(page).not.toContain("min-h-10");
 });
 it("UX-admin-scroll-motion-04 /admin/projects workspace table has a labelled, focusable horizontal cue",()=>{
  const page=read("src/components/projects/project-admin-workspace-list.tsx");
  expect(page).toContain('caption="Project workspace table"');
  expect(page).toContain("<DataTable");
  const table=read("src/components/ui/data-table.tsx");
  const cue=read("src/components/ui/scroll-cue.tsx");
  expect(table).toContain('<ScrollCue axis="x"');
  expect(cue).toContain("overflow-x-auto overscroll-x-contain");
  expect(cue).toContain('tabIndex={edges.scrollable ? 0 : -1}');
  expect(cue).toContain('data-scroll-fade="end"');
 });
 it("UX-admin-scroll-motion-05 /admin/projects/templates/[templateId]/resources shared subview tables reveal more columns",()=>{
  const page=read("src/components/projects/super-admin-template-subview-page.tsx");
  expect(page).toContain('caption="Project template records"');
  expect(page).toContain("<DataTable");
  expect(read("src/components/ui/data-table.tsx")).toContain('<ScrollCue axis="x"');
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
 });
 it("UX-admin-scroll-motion-06 /admin/projects/submissions unsubmitted table has horizontal edge and keyboard focus",()=>{
  const page=read("src/components/projects/project-admin-submissions-page.tsx");
  expect(page).toContain('caption="Unsubmitted project workspaces"');
  expect(page).toContain("<DataTable");
  expect(read("src/components/ui/data-table.tsx")).toContain('<ScrollCue axis="x"');
  expect(read("src/components/ui/scroll-cue.tsx")).toContain('tabIndex={edges.scrollable ? 0 : -1}');
 });
 it("UX-admin-scroll-motion-07 /admin/projects/workspaces/new creator preflight and results have vertical cues",()=>{
  const page=read("src/components/projects/class-team-workspace-creator.tsx");
  expect(page).toContain('aria-label="Learner creation preflight details"');
  expect(page).toContain('aria-label="Per-learner creation results"');
  expect(page.match(/overscroll-contain \[mask-image:linear-gradient\(to_bottom/g)?.length).toBe(2);
 });
 it("UX-admin-scroll-motion-08 /admin/projects/templates/[templateId] tab strip peeks to its remaining links",()=>{
  const page=read("src/components/projects/super-admin-template-tabs.tsx");
  expect(page).toContain('aria-label="Project template sections"');
  expect(page).toContain("overflow-x-auto overscroll-x-contain");
  expect(page).toContain("mask-image:linear-gradient(to_right");
  expect(page).toContain("min-h-11");
  expect(page).not.toContain("min-h-10");
 });
 it("UX-admin-scroll-motion-09 /admin/settings and /admin/semesters share a focusable responsive DataTable scroller",()=>{
  const page=read("src/components/ui/data-table.tsx");
  expect(page).toContain('<ScrollCue axis="x"');
  expect(page).toContain('label={caption ? caption+" scrollable columns"');
  const cue=read("src/components/ui/scroll-cue.tsx");
  expect(cue).toContain("overflow-x-auto overscroll-x-contain");
  expect(cue).toContain('role={edges.scrollable ? "region" : undefined}');
  expect(cue).toContain("tabIndex={edges.scrollable ? 0 : -1}");
  expect(cue).toContain('data-scroll-fade="end"');
  expect(cue).toContain("pointer-events-none");
 });
 it("UX-admin-scroll-motion-10 all audited custom cues avoid hardcoded duration and animation of layout size",()=>{
  const paths=[
   "src/components/projects/project-admin-workspace-list.tsx",
   "src/components/projects/super-admin-template-tabs.tsx",
   "src/components/admin/tenant-settings-editor.tsx",
   "src/components/admin/super-admin-student-import-history.tsx",
  ];
  for(const file of paths){
   const page=read(file);
   expect(page).not.toMatch(/duration-\[?\d+(?:ms|s)?\]?/);
   expect(page).not.toMatch(/transition-(?:all|width|height)/);
  }
  const css=read("src/app/globals.css");
  expect(css).toContain("--lms-motion-fast: 150ms");
  expect(css).toContain("--lms-motion-base: 200ms");
  expect(css).toContain("prefers-reduced-motion");
 });
 it("UX-admin-scroll-motion-11 /admin/projects/readiness and /admin/projects/templates use responsive tables without hidden raw scroll traps",()=>{
  const page=read("src/components/projects/project-admin-readiness-page.tsx");
  expect(page.match(/<DataTable</g)?.length).toBe(2);
  expect(page).not.toMatch(/<table\\b/);
  expect(page).not.toContain("overflow-x-auto");
  expect(page).toContain('mobilePriority:"action"');
  expect(page).toContain("No workspace overrides match these filters.");
 });
 it("UX-admin-scroll-motion-12 /admin/students bulk selection gives 25 learners a scroll cue and full touch targets",()=>{
  const page=read("src/components/admin/super-admin-student-bulk-access.tsx");
  expect(page).toContain('aria-label="Bulk student selection"');
  expect(page).toContain("overscroll-contain");
  expect(page).toContain("[mask-image:linear-gradient(to_bottom");
  expect(page).toContain("min-h-11");
  expect(page).not.toContain("min-h-9");
  expect(page).not.toContain("min-h-10");
 });

});
