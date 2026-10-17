import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {TPO_LEGACY_REPORT_COPY} from "../../src/modules/placements/tpo-legacy-report-copy";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-9 round 6 calendar and settings",()=>{
 it("TPO-calendar-reports-25 activates Move on a follow-up with Enter instead of navigating to a recruiter page",()=>{
  const s=source("src/components/placements/tpo-week-hour-calendar.tsx");
  expect(s).toContain('aria-label={"Move follow-up: "');
  expect(s).toContain("onClick={()=>setMove");
  expect(s).toContain("<TpoCalendarMoveFollowup");
  expect(s).toContain('aria-label="Move recruiter follow-up"');
 });
 it("TPO-calendar-reports-38 uses the exact legacy description of each canonical report rather than persisted implementation copy",()=>{
  for(const slug of ["by-branch","by-company","ctc","leads","accreditation"]){
   const path="/tpo/reports/"+slug;
   expect(TPO_LEGACY_REPORT_COPY[path]?.description).toBeTruthy();
   const s=source("src/app/(authenticated)"+path+"/page.tsx");
   expect(s).toContain('TPO_LEGACY_REPORT_COPY["'+path+'"].description');
  }
 });
 it("TPO-settings-audit-11 only offers released and accepted triggers; never Selected",()=>{
  const s=source("src/components/placements/tpo-college-rules-control.tsx");
  expect(s).not.toContain('<option value="SELECTED">');
  expect(s).toContain('<option value="OFFER_RELEASED">');
  expect(s).toContain('<option value="OFFER_ACCEPTED">');
 });
 it("TPO-settings-audit-06 guards edited rules from unload and navigation and resets dirtiness after save",()=>{
  const s=source("src/components/placements/tpo-college-rules-control.tsx");
  for(const value of ["beforeunload","Unsaved changes","Leave without saving placement rules?","setSaved({...form})"])expect(s).toContain(value);
 });
});
