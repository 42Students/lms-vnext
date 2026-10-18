import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {prioritizeRecruiterOfferFollowups} from "@/modules/placements/hr-today-offer-followup-model";

describe("HR-BREAK-TODAY-OFFERS-18: urgent employer offer follow-ups are never lost to unsorted caps",()=>{
 const make=(index:number,status:string,count=1)=>({
  jobId:"job-"+index,jobTitle:"Job "+String(index).padStart(3,"0"),
  status,count,
 });
 it("keeps late-arriving ISSUED items visible ahead of 40 already ACCEPTED groups",()=>{
  const historical=Array.from({length:40},(_,i)=>make(i,"ACCEPTED"));
  const events=[...historical,make(100,"ISSUED"),make(101,"ISSUED")];
  const visible=prioritizeRecruiterOfferFollowups(events);
  expect(visible).toHaveLength(30);
  expect(visible.slice(0,2).map(row=>row.jobId)).toEqual(["job-100","job-101"]);
  expect(visible.some(row=>row.jobId==="job-100")).toBe(true);
  expect(visible.filter(row=>row.status==="ACCEPTED")).toHaveLength(28);
 });
 it("uses stable job ordering within status and excludes zero/invalid counts",()=>{
  const rows=[make(10,"DECLINED"),make(8,"ISSUED"),make(4,"ACCEPTED"),
   make(2,"ISSUED"),make(3,"ISSUED",0),make(7,"ISSUED",NaN)];
  expect(prioritizeRecruiterOfferFollowups(rows,4).map(row=>row.jobId))
   .toEqual(["job-2","job-8","job-4","job-10"]);
 });
 it("never changes its authorized input array or widens to a different college's offers",()=>{
  const rows=[make(1,"ACCEPTED"),make(2,"ISSUED")];
  const initial=JSON.stringify(rows);
  expect(prioritizeRecruiterOfferFollowups(rows,1)).toEqual([rows[1]]);
  expect(JSON.stringify(rows)).toBe(initial);
  expect(prioritizeRecruiterOfferFollowups([],30)).toEqual([]);
 });
 it("scoped service uses priority projection after employer/college/shortlist joins",()=>{
  const source=readFileSync("src/modules/placements/hr-today-offer-actions-service.ts","utf8");
  expect(source).toContain("prioritizeRecruiterOfferFollowups(");
  expect(source).toContain("eq(placementJobs.collegeId,collegeId)");
  expect(source).toContain('eq(placementApplicationScreenings.status,"SHORTLISTED")');
  expect(source).toContain("inArray(placementJobs.id,ids)");
  expect(source).not.toContain(".filter(row=>row.count>0).slice(0,30)");
 });
});
