import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {RECRUITER_CHANGE_SHORTCUTS,recruiterChangeShortcut}
 from "@/modules/placements/recruiter-change-shortcuts-model";
describe("Recruiter prototype change shortcuts",()=>{
 it("maps five choices to existing approved fields",()=>{
  expect(RECRUITER_CHANGE_SHORTCUTS.map(row=>row.key))
   .toEqual(["time","round","eligibility","pay","other"]);
  expect(recruiterChangeShortcut("time")?.field).toBe("ROUNDS");
  expect(recruiterChangeShortcut("eligibility")?.field).toBe("BRANCHES");
  expect(recruiterChangeShortcut("pay")?.field).toBe("CTC");
 });
 it("keeps preselected change requests inside the authorized Requests tab",()=>{
  const code=readFileSync("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx","utf8");
  expect(code).toContain('"?tab=requests&change="+shortcut.key+returnQuery+"#drive-requests"');
  expect(code).toContain('const requestsTab=query.tab==="requests"');
  expect(code).toContain('openInitially={Boolean(changeShortcut)}');
  expect(code).toContain('requestsTab&&requestData?.party==="COMPANY"');
 });
 it("rejects unrecognized and repeated URL values",()=>{
  expect(recruiterChangeShortcut("../admin")).toBeNull();
  expect(recruiterChangeShortcut(["pay","other"])).toBeNull();
  expect(recruiterChangeShortcut("")).toBeNull();
 });
});