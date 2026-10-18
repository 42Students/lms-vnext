import {describe,expect,it} from "vitest";
import {
 mentorReviewCompletenessQuerySchema,reviewCompletenessPage,
 projectReviewCompleteness,mentorReviewCompletenessHref,
} from "@/modules/projects/mentor-review-completeness-model";

const projectId="11111111-1111-4111-8111-111111111111";

describe("Mentor review evidence pagination and truthful status matrix",()=>{
 it("PROJ-BREAK-MENTOR-383 rejects exotic numeric page inputs before exposing review records",()=>{
  const base={projectId};
  for(const page of ["0x10","2e1","01","+1"," 1","1.0","-1","0","10001",
    "NaN","Infinity",0,-1,NaN,Infinity,[],{},null]){
   expect(mentorReviewCompletenessQuerySchema.safeParse({...base,page}).success,
    String(page)).toBe(false);
  }
  expect(mentorReviewCompletenessQuerySchema.parse({...base,page:"1"}).page).toBe(1);
  expect(mentorReviewCompletenessQuerySchema.parse({...base,page:3}).page).toBe(3);
  expect(mentorReviewCompletenessQuerySchema.parse(base).page).toBe(1);
  expect(mentorReviewCompletenessQuerySchema.safeParse({...base,collegeId:projectId}).success)
   .toBe(false);
 });
 it("PROJ-BREAK-MENTOR-384 handles invalid persisted counts and request pages without NaN",()=>{
  for(const total of [NaN,Infinity,-Infinity,-1,1.2,Number.MAX_SAFE_INTEGER+3])
   expect(reviewCompletenessPage(total,Infinity))
    .toEqual({total:0,page:1,pageSize:10,totalPages:1});
  for(const page of [NaN,Infinity,-Infinity,-2,0,1.1])
   expect(reviewCompletenessPage(21,page))
    .toEqual({total:21,page:1,pageSize:10,totalPages:3});
  expect(reviewCompletenessPage(21,999)).toMatchObject({page:3,totalPages:3});
 });
 it("PROJ-BREAK-MENTOR-385 only persisted approval/change decisions count as review evidence",()=>{
  const at=new Date("2099-01-01T00:00:00.000Z");
  const data=projectReviewCompleteness([
   {id:"a",version:1,status:"APPROVED",decision:"APPROVED",feedback:null,
    submittedAt:at,reviewedAt:at},
   {id:"b",version:2,status:"SUBMITTED",decision:"CHANGES_REQUESTED",feedback:"Review.",
    submittedAt:at,reviewedAt:at},
   {id:"c",version:3,status:"DRAFT",decision:null,feedback:"  ",
    submittedAt:null,reviewedAt:null},
   {id:"d",version:4,status:"SUBMITTED",decision:"FORGED",feedback:null,
    submittedAt:at,reviewedAt:at},
  ]);
  expect(data.map(x=>[x.reviewRecorded,x.writtenFeedbackRecorded,x.reviewLabel]))
   .toEqual([
    [true,false,"Approved"],[true,true,"Changes requested"],
    [false,false,"Not submitted"],[false,false,"No persisted review recorded"],
   ]);
 });
 it("PROJ-BREAK-MENTOR-386 links contain only exact project UUID and approved page selector",()=>{
  const href=mentorReviewCompletenessHref({projectId,page:2});
  expect(href).toContain("/mentor/projects/"+projectId+"/review-completeness?page=2");
  expect(href).not.toContain("collegeId");
  expect(href).not.toContain("organizationId");
  expect(mentorReviewCompletenessHref({projectId,page:1})).not.toContain("?page=");
 });
});
