import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-11 college and mentor interaction contracts",()=>{
 it("COL-academic-setup-16 uses styled confirmation for class lifecycle and recurring schedules",()=>{
  const lifecycle=src("src/components/academics/college-section-lifecycle-action.tsx");
  const recurring=src("src/components/academics/college-recurring-preview.tsx");
  expect(lifecycle).toContain("<ConfirmDialog");
  expect(lifecycle).not.toContain("window.confirm");
  expect(lifecycle).toContain('await apiFetch(');
  expect(recurring).toContain("confirmExecute");
  expect(recurring).toContain("Create recurring sessions?");
  expect(recurring).not.toContain("window.confirm");
 });
 it("COL-academic-setup-19 retains owner-approved archive and dependency blocking",()=>{
  expect(src("docs/audit/owner-decisions-resolved.md")).toContain("archive instead of delete");
  const action=src("src/components/admin/department-actions.tsx");
  expect(action).toContain("hasDependencies");
  expect(action).toContain("Move or remove its programs, courses, faculty before deleting.");
  expect(action).toContain("Retry delete");
 });
 it("MEN-projects-meetings-57 shows Open link and guards invalid or blocked resource windows",()=>{
  const open=src("src/components/projects/project-resource-open-link.tsx");
  expect(open).toContain('linkText="Open resource ↗"');
  expect(open).toContain("Your browser blocked the new tab. Allow pop-ups for this site to open resources.");
  expect(open).toContain("This resource\'s link is not a valid web address, so it can\'t be opened.");
  expect(src("src/components/projects/project-workspace.tsx")).toContain("<ProjectResourceList projectId=");
  expect(src("src/components/projects/project-resource-list.tsx")).toContain('linkText={mode==="LEARNER"?"Open resource ↗":"Open link"}');
  expect(src("src/components/projects/project-resource-controls.tsx")).toContain('"Resource added."');
 });
 it("MEN-projects-meetings-65 uses submission decision wording and exact feedback",()=>{
  const control=src("src/components/projects/project-final-delivery-controls.tsx");
  expect(control).toContain("Accept submission");
  expect(control).toContain("Submission accepted.");
  expect(control).toContain("Review submission");
  expect(control).toContain("Changes requested.");
 });
});
