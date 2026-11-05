import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("UX expiring legacy waiver remediation",()=>{
 it("confirms irreversible writes using the accessible shared modal, not native popup APIs",()=>{
  for(const p of ["src/components/projects/learner-own-task-controls.tsx","src/components/courses/college-lesson-visibility-controls.tsx","src/components/attendance/admin-attendance-parent-contact-editor.tsx"]){
   const s=read(p);expect(s).not.toContain("window.confirm(");expect(s).toContain("<ConfirmDialog");expect(s).toContain("onConfirm=");
  }
  expect(read("src/components/projects/learner-own-task-controls.tsx")).toContain("setConfirmDelete(false);router.refresh()");
  expect(read("src/components/attendance/admin-attendance-parent-contact-editor.tsx")).toContain("confirmDisabled={!membershipId||retrying}");
 });
 it("renders predictable minimum textarea and touch sizes",()=>{
  expect(read("src/components/projects/super-admin-template-overview-editor.tsx")).toContain('className="mt-1 w-full min-h-16"');
  expect(read("src/components/projects/super-admin-template-resource-editor.tsx")).toContain('className="mt-1 w-full min-h-20"');
  expect(read("src/components/projects/college-project-summary-editor-full.tsx")).toContain('className="mt-1 w-full min-h-24"');
  expect(read("src/components/announcements/announcement-feed.tsx")).toContain('<ButtonLink variant="secondary"');
  expect(read("src/components/ui/button.tsx")).toContain("max-md:min-h-11");
  expect(read("src/components/placements/placement-drive-controls.tsx")).toContain("flex min-h-11 items-center text-sm");
 });
});
