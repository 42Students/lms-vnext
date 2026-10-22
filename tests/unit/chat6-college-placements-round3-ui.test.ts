import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
describe("College Admin drive UI and graceful failure",()=>{
 it("COL-placements-24 restores placement drives and new drive copy with missing college state",()=>{
  const code=source("src/app/(authenticated)/college/placements/page.tsx");
  expect(code).toContain('title="Placement Drives"');
  expect(code).toContain("New drive");
  expect(code).toContain("All drives");
  expect(code).toContain("Admin not assigned to a college");
 });
 it("COL-placements-25 renders selectable action-capable mobile application and drive cards",()=>{
  const applications=source("src/components/placements/college-application-pipeline-controls.tsx");
  const drives=source("src/app/(authenticated)/college/placements/drives/page.tsx");
  expect(applications).toContain("DataTable");
  expect(applications).toContain('caption="Applications pipeline"');
  expect(applications).toContain('mobilePriority:"primary"');
  expect(applications).toContain('mobilePriority:"action"');
  expect(applications).toContain("CollegeApplicationDetailDrawer");
  expect(applications).toContain("onChange={()=>toggle(row.id)}");
  // The approved UX rollout replaced duplicate mobile/desktop markup
  // with the shared DataTable, retaining row lifecycle and detail actions.
  expect(drives).toContain('caption="College placement jobs"');
  expect(drives).toContain('aria-label="College placement jobs mobile cards"');
  expect(drives).toContain('mobilePriority:"primary"');
  expect(drives).toContain('mobilePriority:"action"');
  expect(drives).toContain("CollegeDriveRowLifecycleAction");
  const shared=source("src/components/ui/data-table.tsx");
  expect(shared).toContain('md:table-row');
  expect(shared).toContain('More details');
 });
 it("GR-04 College Admin pipeline response failures do not display raw error bodies",()=>{
  const code=source("src/components/placements/college-application-pipeline-controls.tsx");
  expect(code).toContain("apiFetch<CollegeApplicationDetail>");
  expect(code).toContain("apiFetch<{moved?:number");
  expect(code).not.toContain("payload.error");
 });
});
