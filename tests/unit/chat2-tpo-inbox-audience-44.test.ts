import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=(file:string)=>readFileSync(file,"utf8");

describe("TPO notice audience choice parity",()=>{
 it("TPO-inbox-team-44 searches published drives and refuses an unselected or missing target",()=>{
  const ui=source("src/components/tpo/tpo-notice-audience-picker.tsx");
  expect(ui).toContain("Search published drives");
  expect(ui).toContain('name="targetId" required');
  expect(ui).toContain("filtered.map(item=><option");
  expect(ui).toContain('onChange={event=>{setSearch(event.target.value);setTarget("");}}');
  expect(ui).toContain("Nothing matches this search");
  expect(ui).toContain("No published drive yet");
 });
 it("TPO-inbox-team-44 supports multiple batch and branch choices without accepting arbitrary IDs as choices",()=>{
  const ui=source("src/components/tpo/tpo-notice-audience-picker.tsx");
  const service=source("src/modules/announcements/tpo-notice-target-options-service.ts");
  expect(ui).toContain('name="targetIds"');
  expect(ui).toContain('multiple value={targets}');
  expect(ui).toContain("No batch is in placements");
  expect(ui).toContain("No student in placements has a branch yet");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain("eq(departments.collegeId,college.id)");
  expect(service).toContain('eq(placementJobs.status,"PUBLISHED")');
  expect(service).toContain("eq(placementJobs.collegeId,college.id)");
 });
});
