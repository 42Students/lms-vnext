import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoWithdrawalEscalationWindow} from "@/modules/placements/tpo-withdrawal-escalation-service";

const source=()=>readFileSync(
 "src/modules/placements/tpo-withdrawal-escalation-service.ts","utf8");

describe("chat-5: TPO pending withdrawal escalation boundary",()=>{
 it("PLACEMENTS-TPO-ESCALATE-20 computes a strict 24-hour UTC-equivalent window across IST midnight",()=>{
  const timestamp=new Date("2099-10-18T18:29:59.999Z");
  const range=tpoWithdrawalEscalationWindow(timestamp);
  expect(range.from.toISOString()).toBe("2099-10-18T18:29:59.999Z");
  expect(range.through.toISOString()).toBe("2099-10-19T18:29:59.999Z");
  expect(timestamp.toISOString()).toBe("2099-10-18T18:29:59.999Z");
  expect(range.through.getTime()-range.from.getTime()).toBe(86400000);
  expect(()=>tpoWithdrawalEscalationWindow(new Date(Number.NaN)))
   .toThrow("Invalid withdrawal escalation clock");
 });
 it("PLACEMENTS-TPO-ESCALATE-20 requires a pending request, submitted application, future scheduled round and safe error copy",()=>{
  const code=source();
  expect(code).toContain("tpoWithdrawalEscalationWindow(now)");
  expect(code).toContain('eq(placementLearnerRequests.status,"PENDING")');
  expect(code).toContain('eq(placementApplications.status,"SUBMITTED")');
  expect(code).toContain('gt(placementJobRounds.scheduledAt,from)');
  expect(code).toContain('lte(placementJobRounds.scheduledAt,until)');
  expect(code).toContain('dedupeKey:"tpo-withdrawal-escalation:"+candidate.requestId');
  expect(code).toContain('.for("update").limit(1)');
  expect(code).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(code).toContain('reason:"Escalation could not be completed. Retry later."');
  expect(code).not.toContain("reason:e instanceof Error?e.message");
 });
});
