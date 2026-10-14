import {describe,expect,it} from "vitest";
import {hrRecruiterGrantLinks,HR_GRANT_DESTINATIONS} from "@/modules/placements/hr-recruiter-grant-navigation-model";
describe("HR recruiter college access links",()=>{
 const id="00000000-0000-4000-8000-000000000001";
 it("retains the exact selected authorized college in every route",()=>{
  expect(hrRecruiterGrantLinks(id)).toEqual([
   {label:"Today",href:"/hr/home?collegeId="+id},
   {label:"Drives",href:"/hr/drives?collegeId="+id},
   {label:"Company & Team",href:"/hr/company?collegeId="+id},
  ]);
  expect(HR_GRANT_DESTINATIONS).toHaveLength(3);
 });
 it("does not generate navigable URLs for malformed college identifiers",()=>{
  expect(()=>hrRecruiterGrantLinks("wrong-college")).toThrow();
 });
});
