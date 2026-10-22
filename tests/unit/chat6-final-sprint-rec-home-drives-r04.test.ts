import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {buildHrDriveOverview} from "@/modules/placements/hr-drive-overview-model";
describe("Final sprint recruiter closed drive access",()=>{
 it("REC-home-drives-R04 closed drives keep read-only history and hide write actions",()=>{
  const base={applicants:{all:1,shortlisted:0,withdrawn:0},offers:[],rounds:[]};
  const now=new Date("2099-01-01T00:00:00Z");
  expect(buildHrDriveOverview({...base,job:{status:"CLOSED",applicationDeadline:null}},now).readOnly).toBe(true);
  expect(buildHrDriveOverview({...base,job:{status:"PUBLISHED",applicationDeadline:null}},now).readOnly).toBe(false);
  const page=readFileSync("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx","utf8");
  expect(page).toContain("This drive is finished, so slots and results can no longer be sent.");
  expect(page).toContain("This drive is finished. Results can no longer be sent.");
  expect(page).toContain("Historical hiring rounds and applied outcomes remain readable. New results and interview slots are disabled.");
  expect(page).toContain("driveOverview.readOnly");
  expect(page).toContain("Add, change or remove rounds");
  expect(page).toContain("Interview slots");
 });
});
