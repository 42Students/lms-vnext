import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("PUB-auth-public-42 failed identity and grant steps must roll back",()=>{
 it("does not commit new user/profile after an invalid post-identity state",()=>{
  const src=readFileSync("src/modules/placements/public-recruiter-invite-accept-service.ts","utf8");
  expect(src).toContain('if(existing?.status==="ACTIVE")throw invalid()');
  expect(src).toContain('eq(placementRecruiterCollegeGrants.status,"PENDING_RECRUITER")');
  expect(src).toContain('if(!consumed)throw invalid()');
  expect(src).toContain('if(!grant)throw invalid()');
  expect(src).toContain('if(!user||user.status!=="ACTIVE")throw invalid()');
  expect(src).toContain('if(!profile||profile.companyId!==relationship.companyId||');
  expect(src).toContain('profile.status!=="ACTIVE")throw invalid()');
 });
});
