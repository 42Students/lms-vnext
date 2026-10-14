import {describe,expect,it} from "vitest";
import {isExactRecruiterEmployerRow} from "@/modules/placements/recruiter-own-company-policy";
const grant={id:"a",organizationId:"org",collegeId:"college-a",collegeName:"A",companyRelationshipId:"rel-a"};
describe("HR portfolio employer identity guard",()=>{
 it("rejects forged grant to another employer even in the same college",()=>{
  const recruiter={companyId:"company-a",grants:[grant,{...grant,id:"b",companyRelationshipId:"rel-b"}]};
  expect(isExactRecruiterEmployerRow(recruiter,{companyId:"company-a",collegeId:"college-a",relationshipId:"rel-a"})).toBe(true);
  expect(isExactRecruiterEmployerRow(recruiter,{companyId:"company-b",collegeId:"college-a",relationshipId:"rel-b"})).toBe(false);
  expect(isExactRecruiterEmployerRow(recruiter,{companyId:"company-a",collegeId:"college-b",relationshipId:"rel-a"})).toBe(false);
 });
});
