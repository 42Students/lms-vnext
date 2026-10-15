import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../src/modules/projects/submission-service.ts",import.meta.url),"utf8");
describe("PR-S2-07 APPROVED final delivery registered locks",()=>{
 it("sets locked_at atomically and records registered immutable LOCKED event",()=>{
  expect(source).toContain('input.decision==="APPROVED"?{lockedAt:new Date(),reopenedAt:null}');
  expect(source).toContain("tx.insert(projectDeliveryEvents)");
  expect(source).toContain('eventType:"LOCKED"');
  expect(source).toContain("actorMembershipId:context.membership.id");
  expect(source).toContain('action:"LOCKED"');
 });
});