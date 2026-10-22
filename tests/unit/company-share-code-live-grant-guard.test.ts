import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const source=readFileSync(
 "src/modules/placements/company-share/access-service.ts","utf8",
);
const hint=source.split("export async function canEmailAuthorizedCompanyShareCode")[1]
 ?.split("/** Rotate the challenge")[0]??"";
const dispatch=source.split("export async function emailAuthorizedCompanyShareCode")[1]
 ?.split("/** PUB-auth-public")[0]??"";

describe("company share email challenge live-grant authorization",()=>{
 it("does not offer code delivery based solely on a stale session grant",()=>{
  expect(hint).toContain("context.recruiter.grants.some");
  expect(hint).toContain("if(!liveGrant)return false");
  expect(hint).toContain('eq(placementRecruiterCollegeGrants.status,"ACTIVE")');
  expect(hint).toContain("isNull(placementRecruiterCollegeGrants.revokedAt)");
  expect(hint).toContain("gt(placementRecruiterCollegeGrants.validUntil");
  expect(hint).toContain("eq(placementRecruiterCollegeGrants.companyRelationshipId,share.relationshipId)");
 });
 it("rechecks and locks an unexpired persisted grant before sending",()=>{
  expect(dispatch).toContain("if(!liveGrant)return \"DENIED\"");
  expect(dispatch).toContain('.for("share").limit(1)');
  expect(dispatch.indexOf('if(!liveGrant)return "DENIED"'))
   .toBeLessThan(dispatch.indexOf("sendZeptoMailTemplate("));
  expect(dispatch).toContain("eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id)");
  expect(dispatch).toContain('eq(placementRecruiterCollegeGrants.status,"ACTIVE")');
  expect(dispatch).toContain("isNull(placementRecruiterCollegeGrants.revokedAt)");
  expect(dispatch).toContain("gt(placementRecruiterCollegeGrants.validUntil");
 });
 it("does not accept an arbitrary recipient and preserves send limits",()=>{
  expect(dispatch).toContain("toEmail:recipient.email");
  expect(dispatch).not.toContain("rawRecipient");
  expect(dispatch).toContain("companyShareEmailThrottle(sent.map(row=>row.occurredAt),now)");
  expect(dispatch).toContain("if(throttle)return throttle");
  const throttleModel=readFileSync("src/modules/placements/company-share/email-code-throttle-model.ts","utf8");
  expect(throttleModel).toContain("COMPANY_SHARE_EMAILS_PER_HOUR=5");
  expect(throttleModel).toContain('return "TOO_SOON"');
  expect(throttleModel).toContain('?"LIMITED":null');
 });
});
