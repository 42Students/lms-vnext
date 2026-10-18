import {describe,expect,it} from "vitest";
import {recruiterDriveListQuerySchema,filterRecruiterDrives,summarizeRecruiterDrives,
 sortRecruiterDrives,paginateRecruiterDrives,recruiterDrivesHref,isHrDriveDeadlineToday}
 from "@/modules/placements/recruiter-drive-list-model";
import type {RecruiterDriveListItem} from "@/modules/placements/recruiter-drive-list-model";
const college="123e4567-e89b-42d3-a456-426614174001";
const foreign="123e4567-e89b-42d3-a456-426614174002";
const now=new Date("2099-01-02T09:00:00.000Z");
const drive=(id:string,status:string="PUBLISHED",patch:Partial<RecruiterDriveListItem["job"]>={}):RecruiterDriveListItem=>({
 collegeId:college,
 job:{id,title:"Engineer "+id,status,archivedAt:null,employmentType:"FULL_TIME",
  workMode:"HYBRID",applicationDeadline:new Date("2099-01-02T18:29:59.999Z"),
  createdAt:new Date("2099-01-01T08:00:00.000Z"),...patch},
});
const all=recruiterDriveListQuerySchema.parse({});
describe("HR-DRIVES-FILTER-12 safe portfolio statuses, IST deadlines and pagination",()=>{
 it("does not miscount unapproved, archived or canceled drafts as published drives",()=>{
  const rows=[
   drive("live"),drive("closed","CLOSED"),drive("draft","DRAFT"),
   drive("archived","PUBLISHED",{archivedAt:new Date("2099-01-01T00:00:00.000Z")}),
  ];
  expect(summarizeRecruiterDrives(rows)).toEqual({all:2,live:1,closed:1,waiting:0});
  expect(filterRecruiterDrives(rows,all,now).map(row=>row.job.id)).toEqual(["live","closed"]);
  expect(filterRecruiterDrives(rows,{...all,view:"WAITING"},now)).toEqual([]);
 });
 it("matches IST calendar day for 23:59 and next midnight without guessing UTC day",()=>{
  const last=new Date("2099-01-02T18:29:59.999Z");
  const next=new Date("2099-01-02T18:30:00.000Z");
  expect(isHrDriveDeadlineToday(last,now)).toBe(true);
  expect(isHrDriveDeadlineToday(next,now)).toBe(false);
  const rows=[drive("last"),drive("next","PUBLISHED",{applicationDeadline:next})];
  expect(filterRecruiterDrives(rows,{...all,deadline:"TODAY"},now).map(row=>row.job.id))
   .toEqual(["last"]);
 });
 it("applies only caller-supplied authorized college scope, employment and search filters",()=>{
  const rows=[drive("own"),{...drive("other"),collegeId:foreign},drive("contract","PUBLISHED",{
   employmentType:"CONTRACT",workMode:"REMOTE",title:"Platform Engineer",
  })];
  const query={...all,collegeId:college,employment:"FULL_TIME" as const,
   mode:"HYBRID" as const,q:"engineer"};
  expect(filterRecruiterDrives(rows,query,now).map(row=>row.job.id)).toEqual(["own"]);
  expect(filterRecruiterDrives(rows,{...all,view:"CLOSED"},now)).toEqual([]);
  expect(recruiterDrivesHref({...query,page:2})).toContain("collegeId=");
 });
 it("caps 20 rows per page and sorts deterministically even with identical titles",()=>{
  const rows=Array.from({length:43},(_,index)=>drive("id-"+String(index).padStart(2,"0")));
  expect(paginateRecruiterDrives(rows,2).rows).toHaveLength(20);
  const final=paginateRecruiterDrives(rows,100);
  expect(final.page).toBe(3);
  expect(final.rows).toHaveLength(3);
  const a=drive("a","PUBLISHED",{title:"Same"});
  const b=drive("b","PUBLISHED",{title:"Same"});
  expect(sortRecruiterDrives([b,a],"TITLE").map(row=>row.job.id)).toEqual(["a","b"]);
 });
 it("rejects malicious query parameters rather than requesting unbounded recruiter portfolios",()=>{
  for(const input of [
   {page:0},{page:1001},{sort:"UNKNOWN"},{mode:"ADMIN"},
   {view:"PRIVATE"},{companyId:"foreign"},{collegeId:"not-uuid"},
   {q:"x".repeat(101)},{deadline:"ALL_TIME"},
  ])expect(recruiterDriveListQuerySchema.safeParse(input).success).toBe(false);
 });
});
