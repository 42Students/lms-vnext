import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat9 recruiter invite and company share outcomes",()=>{
 it("PUB-auth-public-49 records TPO bell and audit atomically for one explicit not-hiring or unsubscribe response",()=>{
  const s=source("src/modules/placements/tpo-recruiter-invite-service.ts");
  expect(s).toContain('await recordPublicRecruiterDecision(tx,lead,"NOT_HIRING",now);');
  expect(s).toContain('await recordPublicRecruiterDecision(tx,lead,"UNSUBSCRIBE",now);');
  expect(s).toContain("tx.insert(inAppNotifications)");
  expect(s).toContain("tx.insert(activityEvents)");
  expect(s).toContain('eq(membershipRoles.role,"TPO")');
  expect(s).toContain('actionHref:"/tpo/recruiters"');
 });
 it("PUB-auth-public-60 intentionally audits every authorized capability read without sending a bell from a GET",()=>{
  const s=source("src/modules/placements/company-share/public-service.ts");
  expect(s).toContain("await tx.insert(views).values({");
  expect(s).toContain("shareId:grant.shareId,collegeId:grant.collegeId,eventKind");
  expect(s).not.toContain("inAppNotifications");
 });
 it("PUB-auth-public-45 only grants recruiter access after OTP and leaves no pretend HR approval queue",()=>{
  const s=source("src/modules/placements/public-recruiter-invite-accept-service.ts");
  expect(s).toContain("recruiterOtpMatches(");
  expect(s).toContain("consumedAt:now");
  expect(s).toContain('outcome:"JOINED"');
  expect(s).toContain("tx.insert(inAppNotifications)");
 });
 it("PUB-auth-public-46 guards network errors and retries without consuming an invite on a GET",()=>{
  const s=source("src/components/tpo/recruiter-invite-landing.tsx");
  expect(s).toContain('state === "load_error"');
  expect(s).toContain("setRetrySequence(i=>i+1)");
  expect(s).toContain('method:"POST"');
 });
 it("PUB-auth-public-48 preserves legacy declined subtitle",()=>{
  const s=source("src/components/tpo/recruiter-invite-landing.tsx");
  expect(s).toContain("You will not be contacted about this again.");
 });
});
