import {describe,expect,it} from "vitest";
import {hrDriveAttention} from "@/modules/placements/hr-drive-attention-model";
import type {RecruiterDriveListItem} from "@/modules/placements/recruiter-drive-list-model";

const now=new Date("2099-01-10T10:00:00.000Z");
const day=86_400_000;
const row=(id:string,deadline:number|null,patch:Partial<RecruiterDriveListItem>={}):RecruiterDriveListItem=>({
 collegeId:"own",
 job:{id,title:id,status:"PUBLISHED",archivedAt:null,
  applicationDeadline:deadline===null?null:new Date(now.getTime()+deadline)},
 ...patch,
});
describe("HR-DRIVE-ATTENTION-51: deadline cards are bounded and tenant scoped",()=>{
 it("zero or invalid limits do not expose past items through slice(-0)",()=>{
  const rows=[row("overdue",-day),row("soon",day)];
  for(const limit of [0,-1,Number.NaN,Number.POSITIVE_INFINITY]){
   expect(hrDriveAttention(rows,"own",now,limit)).toEqual({past:[],soon:[]});
  }
 });
 it("respects exact deadline boundary and sorts closest overdue first",()=>{
  const rows=[row("old",-10*day),row("recent",-1000),row("now",0),
   row("within",7*day),row("outside",7*day+1),row("oldest",-20*day)];
  const attention=hrDriveAttention(rows,"own",now,2);
  expect(attention.past.map(r=>r.job.id)).toEqual(["recent","old"]);
  expect(attention.soon.map(r=>r.job.id)).toEqual(["now","within"]);
 });
 it("excludes expired, archived, draft, foreign college and invalid deadlines",()=>{
  const rows=[
   row("allowed",-day),
   row("foreign",day,{collegeId:"other"}),
   row("archived",day,{job:{id:"archived",title:"archived",status:"PUBLISHED",
    archivedAt:now,applicationDeadline:new Date(now.getTime()+day)}}),
   row("draft",day,{job:{id:"draft",title:"draft",status:"DRAFT",
    archivedAt:null,applicationDeadline:new Date(now.getTime()+day)}}),
   row("unknown",null),row("invalid",day,{job:{id:"invalid",title:"invalid",
    status:"PUBLISHED",archivedAt:null,applicationDeadline:new Date(Number.NaN)}}),
  ];
  expect(hrDriveAttention(rows,"own",now)).toMatchObject({
   past:[{job:{id:"allowed"}}],soon:[],
  });
 });
 it("caps excessive positive limits and preserves input immutability",()=>{
  const rows=Array.from({length:61},(_,i)=>row("job-"+i,-(i+1)*day));
  const before=rows.map(r=>r.job.id);
  expect(hrDriveAttention(rows,"own",now,10000).past).toHaveLength(50);
  expect(rows.map(r=>r.job.id)).toEqual(before);
 });
});
