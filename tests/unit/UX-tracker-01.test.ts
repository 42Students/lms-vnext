import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-tracker-01",()=>{
 it("preserves canonical route, scoped data and the audited mobile/action states",()=>{
  const source=read("src/app/(authenticated)/tracker/page.tsx");
  expect(source).toContain("<PageHeader");
  expect(source).toContain("\"What went wrong?\"");
  expect(source).toContain("<TrackerReportForm");
  expect(source).toContain("trackerAdminRuntimeEnabled()");
  expect(source).toContain("isSuperAdmin(context)");
  expect(source).toContain("My reports");
  expect(source).not.toContain("window.open");
 });
});
