import {describe,expect,it} from "vitest";
import {canPostToTpoCompanyTeam,tpoCompanyTeamPostSchema,tpoCompanyTeamCompanyIdSchema} from "@/modules/placements/tpo-company-team-model";
const id="11111111-1111-4111-8111-111111111111";
describe("Company Team discussion strict boundaries",()=>{
 it("TPO-companies-05 refuses blank, oversized and non-idempotent company Team messages",()=>{
  const payload={body:"Placement preparations",idempotencyKey:id};
  expect(tpoCompanyTeamPostSchema.safeParse(payload).success).toBe(true);
  expect(tpoCompanyTeamPostSchema.safeParse({...payload,body:"   "}).success).toBe(false);
  expect(tpoCompanyTeamPostSchema.safeParse({...payload,body:"x".repeat(4001)}).success).toBe(false);
  expect(tpoCompanyTeamPostSchema.safeParse({...payload,idempotencyKey:"bad"}).success).toBe(false);
  expect(tpoCompanyTeamPostSchema.safeParse({...payload,grantsRecruiterAccess:true}).success).toBe(false);
 });
 it("TPO-inbox-team-16 keeps old relationship discussion readable but prevents archived new posts",()=>{
  expect(tpoCompanyTeamCompanyIdSchema.safeParse(id).success).toBe(true);
  expect(tpoCompanyTeamCompanyIdSchema.safeParse("not-a-uuid").success).toBe(false);
  expect(canPostToTpoCompanyTeam("ACTIVE")).toBe(true);
  expect(canPostToTpoCompanyTeam("ARCHIVED")).toBe(false);
 });
});