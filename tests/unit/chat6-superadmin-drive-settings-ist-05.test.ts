import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {driveSettingsIstDate} from "@/modules/placements/admin-drive-settings-date-model";

describe("SA-admin-middle-drive-settings-05 resilient India-local date",()=>{
 it("renders UTC-evening dates in the next IST day, not truncated UTC day",()=>{
  const value=driveSettingsIstDate(new Date("2026-10-18T20:00:00.000Z"));
  expect(value).toContain("19 Oct 2026");
  expect(value).toContain("1:30");
 });
 it("renders invalid ISO, absent and non-date legacy values without throwing",()=>{
  for(const input of [undefined,null,"", "not-a-date",new Date(Number.NaN),{},42]){
   expect(driveSettingsIstDate(input)).toBe("Not configured");
  }
 });
 it("Super Admin drive settings keep scope authorization and all three historic date fields protected",()=>{
  const page=readFileSync("src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx","utf8");
  expect(page).toContain('requireSuperAdminSelectedCollege(context,"placements.manage")');
  expect(page).toContain("driveSettingsIstDate(job.applicationDeadline)");
  expect(page).toContain("driveSettingsIstDate(job.legacyPostingDetails.assessmentDeadline)");
  expect(page).toContain("driveSettingsIstDate(date.at)");
  expect(page).not.toContain("format(new Date(date.at))");
 });
});
