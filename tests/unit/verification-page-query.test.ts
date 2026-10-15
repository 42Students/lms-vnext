import {describe,expect,it} from "vitest";
import {parseCollegeVerificationPageQuery} from "@/modules/verification/page-query";
describe("college verification URL boundary",()=>{
 it("refuses duplicate query keys rather than taking the first or last",()=>{
  expect(parseCollegeVerificationPageQuery({page:["1","7"]}).success).toBe(false);
  expect(parseCollegeVerificationPageQuery({attention:["WAITING_OVER_WEEK","ALL"]}).success).toBe(false);
 });
 it("rejects caller tenant scope and preserves valid normalized typed filters",()=>{
  expect(parseCollegeVerificationPageQuery({collegeId:"foreign"}).success).toBe(false);
  const parsed=parseCollegeVerificationPageQuery({q:"  Asha  ",page:"2",sort:"NEWEST"});
  expect(parsed.success).toBe(true);
  if(parsed.success)expect(parsed.data).toMatchObject({q:"Asha",page:2,sort:"NEWEST"});
 });
});
