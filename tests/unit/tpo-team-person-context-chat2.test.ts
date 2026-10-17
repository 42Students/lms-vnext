import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO team conversation and person context",()=>{
 it("TPO-inbox-team-18 reads the actual same-college thread counterpart rather than displaying Team member",()=>{
  const service=src("src/modules/placements/tpo-team-conversation-service.ts");
  const page=src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  expect(service).toContain("counterpartName: sql<string>");
  expect(service).toContain("cm.college_id=");
  expect(service).toContain("placementTpoInternalThreads.invitedMembershipId");
  expect(page).toContain('result.thread.counterpartName');
 });
 it("TPO-inbox-team-31 shows You only for the active roster membership",()=>{
  const page=src("src/app/(authenticated)/tpo/team/page.tsx");
  expect(page).toContain("member.membershipId===context.membership?.id");
  expect(page).toContain(">You</span>");
 });
 it("TPO-inbox-team-42 and TPO-inbox-team-R07 offer a keyboard-native All conversations back link",()=>{
  const page=src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  expect(page).toContain('href="/tpo/team?tab=conversations"');
  expect(page).toContain(">All conversations</Link>");
  expect(page).toContain('aria-label="Private team messages"');
 });
});
