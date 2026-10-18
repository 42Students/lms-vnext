import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-tracker-logs-01",()=>{
 it("preserves original wording, permissions and supported accessible UX",()=>{
  const code=source("src/app/(authenticated)/tracker/logs/page.tsx");
  expect(code).toContain("isSuperAdmin(context)");
  expect(code).toContain("context.adminScope?.collegeId");
  expect(code).toContain("<TrackerLiveLogsExplorer");
  expect(code).toContain("<KnownErrorsWorkspace");
  expect(code).toContain("<TrackerTelegramManualPanel");
  expect(code).toContain("<ErrorState");
  expect(code).toContain("Reset filter");
  expect(code).toContain("aria-label=\"Log environment\"");
  expect(code).toContain("aria-current={environment === value");
  expect(code).toContain("min-h-11");


 });
});
