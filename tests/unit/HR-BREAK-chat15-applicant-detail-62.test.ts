import {describe,expect,it} from "vitest";
import {buildHrApplicantDrawer} from "@/modules/placements/hr-applicant-drawer-model";
import type {SharedApplicant} from "@/modules/placements/hr-job-applicants-model";

const id="123e4567-e89b-42d3-a456-426614174001";
const submittedAt=new Date("2099-05-01T09:00:00.000Z");
const candidate:SharedApplicant={
 id,name:"Authorized learner",role:"Graduate engineer",status:"SUBMITTED",
 screening:"SHORTLISTED",email:"shared@example.test",phone:"+911234567890",submittedAt,
 githubUrl:"https://github.com/author",resumeShared:true,
 sharedProjects:[{name:"Project",url:"https://example.test/project"}],
};
describe("HR-APPLICANTS-DEPTH-62: safe applicant detail cannot bypass withdrawn state",()=>{
 it("permits one currently shortlisted submitted application but no other ID",()=>{
  expect(buildHrApplicantDrawer([candidate],id)).toMatchObject({
   id,name:"Authorized learner",email:"shared@example.test",
  });
  expect(buildHrApplicantDrawer([candidate],"123e4567-e89b-42d3-a456-426614174002"))
   .toBeNull();
 });
 it("denies historical withdrawn records even when screening still says shortlisted",()=>{
  expect(buildHrApplicantDrawer([{...candidate,status:"WITHDRAWN"}],id)).toBeNull();
  expect(buildHrApplicantDrawer([{...candidate,screening:"PENDING"}],id)).toBeNull();
 });
 it("fails closed when joins return two copies including an earlier allowed and later revoked row",()=>{
  const withdrawn={...candidate,status:"WITHDRAWN",email:null,phone:null};
  expect(buildHrApplicantDrawer([candidate,withdrawn],id)).toBeNull();
  expect(buildHrApplicantDrawer([withdrawn,candidate],id)).toBeNull();
 });
 it("does not reveal duplicate rows even if both copies look authorized",()=>{
  expect(buildHrApplicantDrawer([candidate,{...candidate,name:"Altered"}],id)).toBeNull();
 });
 it("normalizes missing safe optional fields but never manufactures contact",()=>{
  const minimal={...candidate,name:"  ",email:null,phone:null,sharedProjects:undefined,
   sharedSkills:undefined,resumeShared:undefined};
  expect(buildHrApplicantDrawer([minimal],id)).toMatchObject({
   name:"Unnamed applicant",email:null,phone:null,resumeShared:false,
   sharedSkills:[],sharedProjects:[],
  });
 });
});
