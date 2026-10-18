import {describe,expect,it} from "vitest";
import {filterRecruiterDrives,isHrDriveDeadlineToday,recruiterDriveListQuerySchema,
 sortRecruiterDrives,summarizeRecruiterDrives,paginateRecruiterDrives}
 from "@/modules/placements/recruiter-drive-list-model";
import type {RecruiterDriveListItem} from "@/modules/placements/recruiter-drive-list-model";

const now=new Date("2099-02-01T08:00:00.000Z");
const job=(id:string,deadline:Date|null,patch:Partial<RecruiterDriveListItem["job"]>={}):RecruiterDriveListItem=>({
 collegeId:"own",
 job:{id,title:id,status:"PUBLISHED",archivedAt:null,applicationDeadline:deadline,
  createdAt:new Date("2099-01-01T00:00:00.000Z"),...patch},
});
const query=recruiterDriveListQuerySchema.parse({});
describe("HR-JOBS-DEPTH-61: recruiter job list handles persisted damaged timestamps safely",()=>{
 it("invalid deadline never throws while evaluating Today or Due soon",()=>{
  const invalid=new Date(Number.NaN);
  expect(isHrDriveDeadlineToday(invalid,now)).toBe(false);
  expect(isHrDriveDeadlineToday(now,invalid)).toBe(false);
  const rows=[job("invalid",invalid),job("valid",now)];
  expect(filterRecruiterDrives(rows,{...query,deadline:"TODAY"},now).map(x=>x.job.id)).toEqual(["valid"]);
  expect(filterRecruiterDrives(rows,{...query,deadline:"SOON"},now).map(x=>x.job.id)).toEqual(["valid"]);
 });
 it("treats an invalid or absent deadline as unknown, rather than an actionable interview",()=>{
  const rows=[job("invalid",new Date(Number.NaN)),job("missing",null),job("valid",now)];
  expect(filterRecruiterDrives(rows,{...query,deadline:"UNKNOWN"},now).map(x=>x.job.id))
   .toEqual(["invalid","missing"]);
  expect(filterRecruiterDrives(rows,{...query,deadline:"PAST"},now)).toEqual([]);
 });
 it("puts undated and malformed jobs last in deadline sort with deterministic ties",()=>{
  const rows=[job("missing",null),job("late",new Date("2099-04-01T00:00:00Z")),
   job("invalid",new Date(Number.NaN)),job("early",now)];
  expect(sortRecruiterDrives(rows,"DEADLINE").map(x=>x.job.id))
   .toEqual(["early","late","invalid","missing"]);
 });
 it("falls back to a neutral recent-sort timestamp and never mutates original jobs",()=>{
  const rows=[job("bad",now,{createdAt:new Date(Number.NaN)}),
   job("good",now,{createdAt:new Date("2099-01-11T00:00:00Z")})];
  expect(sortRecruiterDrives(rows,"RECENT").map(x=>x.job.id)).toEqual(["good","bad"]);
  expect(rows.map(x=>x.job.id)).toEqual(["bad","good"]);
 });
 it("excludes drafts, archived and foreign jobs consistently between totals and filtered list",()=>{
  const rows=[job("live",now),job("draft",now,{status:"DRAFT"}),
   {...job("foreign",now),collegeId:"foreign"},job("archived",now,{archivedAt:now})];
  expect(filterRecruiterDrives(rows,{...query,collegeId:"own"},now).map(x=>x.job.id))
   .toEqual(["live","draft"].filter(id=>id!=="draft"));
  expect(summarizeRecruiterDrives(rows).all).toBe(2); // summaries need caller-scoped jobs.
  expect(paginateRecruiterDrives(rows,1).pageSize).toBe(20);
 });
});
