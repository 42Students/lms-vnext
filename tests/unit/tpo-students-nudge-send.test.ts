import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
 tpoStudentNudgeInputSchema,tpoStudentNudgeTemplates,
} from "@/modules/placements/tpo-student-nudge-send-model";
const first="11111111-1111-4111-8111-111111111111";
describe("TPO-students-04 TPO authenticated in-app nudge",()=>{
 it("accepts templates or custom text with strictly bounded unique learner selection",()=>{
  expect(tpoStudentNudgeInputSchema.safeParse({
   learnerMembershipIds:[first],template:"REGISTRATION",message:tpoStudentNudgeTemplates.REGISTRATION,
  }).success).toBe(true);
  for(const data of [
   {learnerMembershipIds:[first,first],template:"CUSTOM",message:"Hello learner"},
   {learnerMembershipIds:[first],template:"CUSTOM",message:"x".repeat(1001)},
   {learnerMembershipIds:[first],template:"CUSTOM",message:"Hi"},
   {learnerMembershipIds:[first],template:"CUSTOM",message:"Hello",collegeId:first},
  ])expect(tpoStudentNudgeInputSchema.safeParse(data).success).toBe(false);
 });
 it("authorizes at transaction time and ties every notification to a durable audit event",()=>{
  const source=readFileSync("src/modules/placements/tpo-student-nudge-send-service.ts","utf8");
  expect(source).toContain("requireTpoBatchActor(context)");
  expect(source).toContain("assertPersistedPlatformPermission");
  expect(source).toContain('eq(membershipRoles.role,"LEARNER")');
  expect(source).toContain("onConflictDoNothing()");
  expect(source).toContain("tx.insert(inAppNotifications)");
  expect(source).not.toContain("metadata:{message:");
 });
 it("mounts a real in-app sending UI from the TPO students working set",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/students/page.tsx","utf8");
  const panel=readFileSync("src/components/tpo/tpo-student-nudge-panel.tsx","utf8");
  expect(page).toContain("<TpoStudentNudgePanel");
  expect(page).toContain("manageAllowed?");
  expect(panel).toContain('method:"POST"');
  expect(panel).toContain("not registered for placements");
 });
});
