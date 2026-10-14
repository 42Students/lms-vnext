import {describe,expect,it} from "vitest";
import {filterRecruiterDrives,paginateRecruiterDrives,recruiterDriveListQuerySchema,recruiterDrivesHref} from "@/modules/placements/recruiter-drive-list-model";
const now=new Date("2026-10-14T12:00:00Z");
const rows=[
 {collegeId:"a",job:{id:"a",title:"Engineer",status:"PUBLISHED",archivedAt:null,employmentType:"FULL_TIME",workMode:"REMOTE",applicationDeadline:new Date("2026-10-17T00:00:00Z")}},
 {collegeId:"a",job:{id:"b",title:"Designer",status:"PUBLISHED",archivedAt:null,employmentType:"CONTRACT",workMode:"ONSITE",applicationDeadline:null}},
 {collegeId:"b",job:{id:"c",title:"Engineer",status:"PUBLISHED",archivedAt:null,employmentType:"FULL_TIME",workMode:"REMOTE",applicationDeadline:new Date("2026-10-17T00:00:00Z")}},
];
describe("HR drive structured filters and pagination",()=>{
 it("filters by college, remote, work type and deadline",()=>{
  const q=recruiterDriveListQuerySchema.parse({view:"LIVE",q:"eng",employment:"FULL_TIME",mode:"REMOTE",deadline:"SOON"});
  expect(filterRecruiterDrives(rows,q,now).map(row=>row.job.id)).toEqual(["a","c"]);
  expect(filterRecruiterDrives(rows,{...q,collegeId:"00000000-0000-4000-8000-000000000001"},now)).toEqual([]);
  expect(filterRecruiterDrives(rows,{...q,q:"",deadline:"UNKNOWN"},now)).toEqual([]);
 });
 it("keeps listing bounded without fabricating more rows",()=>{
  expect(paginateRecruiterDrives(Array.from({length:49},(_,i)=>i),2)).toMatchObject({page:2,total:49,pages:3,rows:Array.from({length:20},(_,i)=>i+20)});
 });
 it("validates filters and emits clean query URL",()=>{
  expect(recruiterDriveListQuerySchema.safeParse({mode:"UNKNOWN"}).success).toBe(false);
  expect(recruiterDriveListQuerySchema.safeParse({page:"0"}).success).toBe(false);
  expect(recruiterDrivesHref(recruiterDriveListQuerySchema.parse({mode:"REMOTE",deadline:"SOON",page:"2"}))).toContain("mode=REMOTE");
 });
});
