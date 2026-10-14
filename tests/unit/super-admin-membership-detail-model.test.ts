import {describe,expect,it} from "vitest";
import {adminMembershipDetailIdSchema,projectAdminMembershipDetail} from "@/modules/people/admin-membership-detail-model";
const fact={id:"m",userId:"u",name:"A",collegeName:"College",platformStatus:"ACTIVE" as const,
 membershipStatus:"ACTIVE",roles:["LEARNER"],email:"test@example.test",phoneE164:"+919999999999",
 createdAt:new Date("2026-10-14T00:00:00Z"),updatedAt:new Date("2026-10-14T00:00:00Z")};
describe("Super Admin membership detail contact privacy",()=>{
 it("masks contact without exact college scope",()=>{
  for(const scope of [null,"college-b"])expect(projectAdminMembershipDetail(fact,scope,"college-a"))
   .toMatchObject({email:null,phoneE164:null,contactVisible:false});
 });
 it("shows only within exact selected college and validates ids",()=>{
  expect(projectAdminMembershipDetail(fact,"college-a","college-a").email).toBe("test@example.test");
  expect(adminMembershipDetailIdSchema.safeParse("invalid").success).toBe(false);
 });
});
