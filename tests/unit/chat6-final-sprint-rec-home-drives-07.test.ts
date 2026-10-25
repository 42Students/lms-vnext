import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {hrTodayLiveDriveRows} from "@/modules/placements/hr-today-live-drive-model";
describe("Final sprint recruiter live drive highlight",()=>{
 it("REC-home-drives-07 live drive highlight counts only college-shared applicants",()=>{
  const rows=[
   {collegeId:"college",companyId:"company",job:{id:"late",title:"Later",status:"PUBLISHED",archivedAt:null,applicationDeadline:new Date("2099-08-10T00:00:00Z")}},
   {collegeId:"college",companyId:"company",job:{id:"early",title:"Earlier",status:"PUBLISHED",archivedAt:null,applicationDeadline:new Date("2099-08-02T00:00:00Z")}},
   {collegeId:"college",companyId:"company",job:{id:"closed",title:"Closed",status:"CLOSED",archivedAt:null,applicationDeadline:null}},
   {collegeId:"foreign",companyId:"company",job:{id:"foreign",title:"Foreign",status:"PUBLISHED",archivedAt:null,applicationDeadline:null}},
  ];
  expect(hrTodayLiveDriveRows(rows,"college","company").map(row=>row.job.id)).toEqual(["early","late"]);
  const source=readFileSync("src/app/(authenticated)/hr/home/page.tsx","utf8");
  expect(source).toContain("recruiterVisiblePortfolioCounts(");
  expect(source).toContain("hrTodayLiveDriveRows(jobs,selectedId,recruiter.companyId,1,liveDriveCounts)");
  expect(source).toContain("sharedApplicants:liveDriveCounts?");
  const view=readFileSync("src/components/hr/recruiter-today-prototype.tsx","utf8");
  expect(view).toContain("Shared applicant count unavailable");
  expect(view).toContain("Applications close ");
 });
});
