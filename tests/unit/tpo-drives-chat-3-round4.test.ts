import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
import {defaultTpoDriveView} from "@/modules/placements/tpo-drive-lifecycle-list-model";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-3 Drives round 4",()=>{
 it("TPO-drives-04 review-first default and persistent badge counts",()=>{
  expect(defaultTpoDriveView(2)).toBe("REQUESTS");
  expect(defaultTpoDriveView(0)).toBe("LIVE");
  expect(defaultTpoDriveView(2,"ALL")).toBe("ALL");
  const service=source("src/modules/placements/tpo-drive-lifecycle-list-service.ts");
  const page=source("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(service).toContain("needsReviewCount");
  expect(service).toContain("statusCounts");
  expect(page).toContain("data.statusCounts.drafts");
  expect(page).toContain("data.needsReviewCount");
  expect(page).toContain('aria-current={data.view===view?"page":undefined}');
 });
 it("TPO-drives-45 IST wall time is not the browser local time",()=>{
  expect(driveDeadlineIstToIso("2099-11-05T23:59")).toBe("2099-11-05T18:29:00.000Z");
  expect(driveDeadlineIstToIso("2099-01-01T00:00")).toBe("2098-12-31T18:30:00.000Z");
  expect(source("src/components/placements/placement-job-create-form.tsx")).toContain("applicationDeadline: deadlineIso");
 });
 it("TPO-drives-45 malformed and impossible local deadlines are rejected",()=>{
  for(const input of ["2099-02-29T10:00","2099-13-01T10:00","2099-01-32T10:00","2099-01-01T24:00","garbage"])
   expect(()=>driveDeadlineIstToIso(input)).toThrow("Enter a valid application deadline in IST.");
 });
});
