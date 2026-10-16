import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("REC-calendar-messages-profile-43 invite accept side effects",()=>{
 it("uses existing college-scoped and verified recruiter notification shape",()=>{
  const s=readFileSync("src/modules/placements/public-recruiter-invite-accept-service.ts","utf8");
  expect(s).toContain("publicRecruiterJoinedNotification");
  expect(s).toContain("eq(collegeMemberships.collegeId,lead.collegeId)");
  expect(s).toContain("Joined as a recruiter");
  expect(s).not.toContain('category:"PLACEMENTS"');
 });
});
