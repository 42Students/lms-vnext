import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterTodayGreeting} from "@/modules/placements/recruiter-today-greeting-model";
describe("Final sprint recruiter IST date decision",()=>{
 it("REC-home-drives-R07 IST presentation deliberately overrides viewer-local legacy dates",()=>{
  const instant=new Date("2099-01-01T09:00:00Z");
  expect(recruiterTodayGreeting(instant,"Asha","Acme",0).title).toBe("Good afternoon, Asha");
  const paths=[
   "src/app/(authenticated)/hr/home/page.tsx",
   "src/app/(authenticated)/hr/drives/page.tsx",
   "src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx",
  ];
  for(const path of paths){
   const content=readFileSync(path,"utf8");
   expect(content).toContain("Asia/Kolkata");
  }
  const page=readFileSync(paths[0]!,"utf8");
  expect(page).toContain(" IST");
  const detail=readFileSync(paths[2]!,"utf8");
  expect(detail).toContain('timeZone:"Asia/Kolkata"');
  const acceptance=readFileSync("docs/audit/acceptance/recruiter-home-drives-verification.md","utf8");
  expect(acceptance).toContain("REC-home-drives-R07");
  expect(acceptance).toContain("Owner requires India Standard Time");
 });
});
