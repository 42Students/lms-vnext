import {describe,it,expect} from "vitest";
import {tpoApplicationUrlError} from "@/modules/placements/tpo-applications-url-guard";
describe("TPO applicant query allowlist",()=>{
 it("does not accept caller-controlled tenant, actor or college selectors",()=>{
  for(const key of ["collegeId","tenantId","membershipId","userId"]){
   expect(tpoApplicationUrlError({[key]:"any"})).toMatch(/Unsupported/);
  }
 });
 it("rejects unknown typos and allows supported options",()=>{
  expect(tpoApplicationUrlError({application_status:"SHORTLISTED"})).toMatch(/Unsupported/);
  expect(tpoApplicationUrlError({stage:"SHORTLISTED",sort:"NEWEST"})).toBeNull();
 });
});
