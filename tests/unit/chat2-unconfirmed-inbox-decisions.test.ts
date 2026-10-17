import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(path,"utf8");
describe("TPO inbox ambiguous legacy behaviours resolved by safer policy",()=>{
 it("TPO-inbox-team-08 does not claim provider email delivery without an active relay",()=>{
  const service=source("src/modules/placements/tpo-messages-service.ts");
  expect(service).toContain("outboundDeliveryDataAvailable: false");
  const page=source("src/app/(authenticated)/tpo/messages/page.tsx");
  expect(page).toContain('source === "RECRUITER_THREADS"');
 });
 it("TPO-inbox-team-11 fails visibly when recruiter conversations are missing instead of presenting notifications as conversations",()=>{
  const page=source("src/app/(authenticated)/tpo/messages/page.tsx");
  expect(page).toContain("if(!isRecruiterInbox)return");
  expect(page).toContain("Recruiter conversations are temporarily unavailable");
  expect(page).toContain('href="/tpo/notifications"');
 });
 it("TPO-inbox-team-35 reserves role grants for audited college administration instead of self-promoting TPO staff",()=>{
  const page=source("src/app/(authenticated)/tpo/team/page.tsx");
  const model=source("src/modules/placements/placement-team-access-model.ts");
  expect(page).toContain("hasPlacementTeamMembership(context)");
  expect(model).toContain('hasMembershipRole(context,"COLLEGE_ADMIN")');
  expect(page).not.toContain('action="/api/placements/tpo/team/grant-role"');
 });
});