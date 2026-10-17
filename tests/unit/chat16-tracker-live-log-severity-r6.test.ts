import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {buildCloudErrorFilter} from "@/modules/log-alerts/cloud-log-reader";

describe("chat-16 live log severity and privacy",()=>{
 it("SA-placements-projects-113 allows ERROR/WARNING only and never accepts arbitrary provider filters",()=>{
  const route=readFileSync("src/app/api/tracker/live-logs/route.ts","utf8");
  const model=readFileSync("src/modules/bug-tracker/tracker-cloud-logs.ts","utf8");
  const ui=readFileSync("src/components/tracker/tracker-live-logs-explorer.tsx","utf8");
  expect(route).toContain('const keys=["windowMinutes","pageToken","query","minimumSeverity"]');
  expect(route).toContain("keys.some(key=>url.searchParams.getAll(key).length>1)");
  expect(model).toContain('z.enum(["WARNING","ERROR"]).default("ERROR")');
  expect(ui).toContain('value={minimumSeverity}');
  expect(ui).toContain('minimumSeverity,query:query.trim()');
  expect(ui).toContain('Error and above');
  expect(ui).toContain('Warning and above');
  const start=new Date("2099-10-17T00:00:00Z"),end=new Date("2099-10-17T01:00:00Z");
  expect(buildCloudErrorFilter(start,end,"lms-dev-2026","WARNING")).toContain("severity>=WARNING");
  expect(buildCloudErrorFilter(start,end,"lms-dev-2026","ERROR")).toContain("severity>=ERROR");
 });
});
