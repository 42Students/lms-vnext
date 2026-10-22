import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const ui=readFileSync("src/app/(authenticated)/admin/placements/interviews/page.tsx","utf8");
const service=readFileSync("src/modules/admin-ui/super-admin-placement-interviews-service.ts","utf8");
describe("chat-12 legacy interview roster parity",()=>{
 it("shows the eight exact legacy columns with usable job and appointment actions",()=>{
  for(const [key,label] of [["job","Job"],["candidate","Candidate"],["type","Type"],
    ["status","Status"],["date","Date & Time"],["interviewer","Interviewer"],
    ["mode","Mode"],["actions","Actions"]]){
   expect(ui).toContain('key:"'+key+'",header:"'+label+'"');
  }
  expect(ui).toContain("encodeURIComponent(item.jobId)");
  expect(ui).toContain('"/applications?collegeId="');
  expect(ui).toContain("Open appointment");
 });
 it("reads appointment status and interview detail from selected-college scoped data",()=>{
  expect(service).toContain("jobId:row.jobId");
  expect(service).toContain("requireSuperAdminSelectedCollege");
  expect(service).toContain('["SCHEDULED","CONFIRMED","RESCHEDULE_REQUESTED"]');
  expect(service).toContain('legacyInterviewStatus');
 });
});
