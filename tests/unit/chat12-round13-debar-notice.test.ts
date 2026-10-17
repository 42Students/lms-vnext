import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/modules/placements/debarment-service.ts",import.meta.url),"utf8");
describe("timed debarment side effects",()=>{
 it("TPO-students-07 notifies only the exact scoped learner inside the transaction without staff reason",()=>{
  expect(source).toContain("await recordDebarmentNotice(tx,college,learner.userId,context.user.id,row.id,\"DEBARRED\")");
  expect(source).toContain("await recordDebarmentNotice(tx,college,learner.userId,context.user.id,updated.id,\"DEBARMENT_LIFTED\")");
  expect(source).toContain('module:"PLACEMENTS",eventType:action');
  expect(source).toContain('userId,eventId:event.id');
  expect(source).toContain("if (locked.liftedAt) return locked");
  expect(source).not.toContain("body:input.reason");
 });
 it("TPO-students-06 keeps duration and typed learner membership guarded before notification",()=>{
  expect(source).toContain("await requireLearner(tx, input.collegeId, input.membershipId)");
  expect(source).toContain("untilDrives: z.number().int().min(1).max(10_000)");
 });
});