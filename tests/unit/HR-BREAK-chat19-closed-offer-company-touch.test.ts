import {describe,expect,it} from "vitest";
import {prioritizeRecruiterOfferFollowups,HR_FOLLOWUP_JOB_STATUSES}
 from "@/modules/placements/hr-today-offer-followup-model";
import {readFileSync} from "node:fs";
describe("HR-BREAK-CLOSED-OFFER-41: recruiter follow-ups continue after closing a hiring drive",()=>{
 it("includes published and closed drives but never draft, cancelled or archived ones",()=>{
  expect([...HR_FOLLOWUP_JOB_STATUSES]).toEqual(["PUBLISHED","CLOSED"]);
  const source=readFileSync("src/modules/placements/hr-today-offer-actions-service.ts","utf8");
  expect(source).toContain("inArray(placementJobs.status,[...HR_FOLLOWUP_JOB_STATUSES])");
  expect(source).toContain('eq(placementApplications.status,"SUBMITTED")');
  expect(source).toContain('eq(placementApplicationScreenings.status,"SHORTLISTED")');
  expect(source).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(source).toContain('isNull(placementJobs.archivedAt)');
 });
 it("surfaces an outstanding offer before resolved offer history",()=>{
  const rows=[
   {jobId:"a",jobTitle:"A",status:"DECLINED",count:2},
   {jobId:"b",jobTitle:"B",status:"ACCEPTED",count:1},
   {jobId:"c",jobTitle:"C",status:"ISSUED",count:3},
   {jobId:"d",jobTitle:"D",status:"ISSUED",count:0},
  ];
  expect(prioritizeRecruiterOfferFollowups(rows).map(x=>x.jobId)).toEqual(["c","b","a"]);
  expect(rows[0]?.jobId).toBe("a");
 });
 it("caps grouping and ignores invalid or zero aggregate counts",()=>{
  const rows=Array.from({length:35},(_,i)=>({
   jobId:String(i),jobTitle:"Role"+i,status:"ISSUED",count:1,
  }));
  expect(prioritizeRecruiterOfferFollowups(rows)).toHaveLength(30);
  expect(prioritizeRecruiterOfferFollowups(rows,0)).toHaveLength(0);
  expect(prioritizeRecruiterOfferFollowups([...rows,{jobId:"invalid",jobTitle:"Bad",status:"ISSUED",count:NaN}])).toHaveLength(30);
 });
});
describe("UX-HR-COMPANY-TOUCH-42 keyboard accessible company/team tabs and college selector",()=>{
 it("provides phone-sized tab links, college selectors and focus-visible recovery",()=>{
  const source=readFileSync("src/app/(authenticated)/hr/company/page.tsx","utf8");
  expect(source).toContain('<Tabs renderPanel={false} ariaLabel="Company and team sections"');
  expect(source).toContain('{value:"team",label:"Team",href:base+"&tab=team"}');
  expect(source).toContain('<NeedsDoingChips label="College access:"');
  const tabs=readFileSync("src/components/ui/tabs.tsx","utf8");
  expect(tabs).toContain("inline-flex min-h-11");
  expect(tabs).toContain("focus-visible:outline-2");
  expect(source).toContain("focus-visible:outline-2");
  expect(source).toContain('title="Company & Team"');
 });
});
