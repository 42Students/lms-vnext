import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const audit=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/audit/page.tsx"),"utf8");
describe("TPO legacy audit page customer-facing copy",()=>{
 it("TPO-settings-audit-96 hides data source implementation labels while retaining legacy copy",()=>{
  expect(audit).toContain("A traceable history of placement decisions, changes, sharing and access across the workspace.");
  expect(audit).toContain("Nothing logged yet");
  expect(audit).toContain("Every drive, decision and setting change your team makes shows up here.");
  expect(audit).toContain("Export audit log CSV");
  expect(audit).not.toContain("Export audit-log CSV (canonical events)");
  expect(audit).not.toContain("current database");
  expect(audit).not.toContain("Historical settings changes without persisted event records");
  expect(audit).toContain("Some sharing activity could not be loaded.");
 });
});
