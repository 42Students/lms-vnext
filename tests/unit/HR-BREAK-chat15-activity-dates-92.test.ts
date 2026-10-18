import {describe,expect,it} from "vitest";
import {projectHrJobActivity,hrActivityEventFilter,clampHrActivityPage}
 from "@/modules/placements/hr-job-activity-model";

const jobs=[{id:"own",title:"Authorized hiring drive"}];
const at=new Date("2099-05-01T00:00:00.000Z");
const published={id:"published",subjectId:"own",eventType:"placements.job.published",occurredAt:at};
describe("HR-ACTIVITY-92 job event projection and employer privacy",()=>{
 it("filters non-employer job IDs, unknown events and malformed timestamps",()=>{
  const rows=[published,{...published,id:"foreign",subjectId:"foreign"},
   {...published,id:"other",eventType:"users.private.update"},
   {...published,id:"invalid",occurredAt:new Date(Number.NaN)}];
  expect(projectHrJobActivity(rows,jobs)).toEqual([{
   id:"published",jobId:"own",title:"Authorized hiring drive",
   status:"Published",occurredAt:at,
  }]);
 });
 it("sorts by chronological event and stable descending ID, without mutating rows",()=>{
  const rows=[published,{...published,id:"later"},
   {...published,id:"early",occurredAt:new Date(at.getTime()-1000)}];
  expect(projectHrJobActivity(rows,jobs).map(row=>row.id))
   .toEqual(["published","later","early"]);
  expect(rows.map(row=>row.id)).toEqual(["published","later","early"]);
 });
 it("accepts only allowed published/closed filters",()=>{
  expect(hrActivityEventFilter("PUBLISHED")).toEqual(["placements.job.published"]);
  expect(hrActivityEventFilter("CLOSED")).toEqual(["placements.job.closed"]);
  expect(hrActivityEventFilter("ALL")).toHaveLength(2);
 });
 it("keeps stale deep-link page within employer-scoped count",()=>{
  expect(clampHrActivityPage(999,41,20)).toBe(3);
  expect(clampHrActivityPage(3,0,20)).toBe(1);
  expect(clampHrActivityPage(-1,41,20)).toBe(1);
 });
});