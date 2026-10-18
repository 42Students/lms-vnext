import {describe,expect,it} from "vitest";
import {
 mentorSprintProgressPage,mentorSprintProgressQuerySchema,
 mentorSprintProgressHref,summarizeSprintTasks,
} from "@/modules/projects/mentor-sprint-progress-model";

const projectId="11111111-1111-4111-8111-111111111111";

describe("Mentor sprint page query and persistence aggregate boundaries",()=>{
 it("PROJ-BREAK-MENTOR-373 rejects nondecimal, fractional, negative and oversized page query fields",()=>{
  for(const page of ["1e3","0x10"," 1 ","+1","1.0","01","-1","0","10001",
   "-Infinity","NaN","Infinity",null,[],{},-1,NaN,Infinity]){
   expect(mentorSprintProgressQuerySchema.safeParse({page}).success,String(page)).toBe(false);
  }
  expect(mentorSprintProgressQuerySchema.parse({page:"1"}).page).toBe(1);
  expect(mentorSprintProgressQuerySchema.parse({page:"10000"}).page).toBe(10000);
  expect(mentorSprintProgressQuerySchema.parse({page:2}).page).toBe(2);
  expect(mentorSprintProgressQuerySchema.parse({}).page).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-374 invalid counts and untrusted requested pages never poison page links",()=>{
  for(const total of [-1,NaN,Infinity,-Infinity,1.5,Number.MAX_SAFE_INTEGER+2]){
   expect(mentorSprintProgressPage(total,NaN)).toEqual({
    total:0,page:1,pageSize:20,totalPages:1,
   });
  }
  for(const requested of [NaN,Infinity,0,-7,3.5,Number.MAX_SAFE_INTEGER+2]){
   expect(mentorSprintProgressPage(41,requested)).toEqual({
    total:41,page:1,pageSize:20,totalPages:3,
   });
  }
  expect(mentorSprintProgressPage(41,999)).toMatchObject({page:3,totalPages:3});
  expect(mentorSprintProgressPage(41,2)).toMatchObject({page:2,totalPages:3});
 });
 it("PROJ-BREAK-MENTOR-375 scoped sprint filters preserve pagination and never synthesize tenant IDs",()=>{
  const query=mentorSprintProgressQuerySchema.parse({
   state:"ACTIVE",release:"IN_PROGRESS",search:"lab & systems",
   taskAttention:"BLOCKED",order:"ACTIVE_FIRST",projectId,page:3,
  });
  const href=mentorSprintProgressHref(query);
  expect(href).toContain("page=3");
  expect(href).toContain("projectId="+projectId);
  expect(href).toContain("taskAttention=BLOCKED");
  expect(href).toContain("state=ACTIVE");
  expect(href).toContain("search=lab+%26+systems");
  expect(href).not.toMatch(/collegeId|organizationId|actorId/);
  expect(mentorSprintProgressQuerySchema.safeParse({...query,collegeId:projectId}).success)
   .toBe(false);
  expect(mentorSprintProgressQuerySchema.safeParse({...query,projectId:"../../../other"}).success)
   .toBe(false);
 });
 it("PROJ-BREAK-MENTOR-376 missing tasks never look complete, recorded DONE stays evidence based",()=>{
  expect(summarizeSprintTasks([])).toMatchObject({
   total:0,completed:0,completionPercent:null,
  });
  expect(summarizeSprintTasks([
   {status:"DONE",total:2},{status:"BLOCKED",total:1},
   {status:"IN_REVIEW",total:1},
  ])).toMatchObject({
   total:4,completed:2,blocked:1,inReview:1,completionPercent:50,
  });
 });
});
