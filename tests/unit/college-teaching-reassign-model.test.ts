import {describe,it,expect} from "vitest";
import {collegeTeachingReassignSchema,teachingReassignPrompt,teachingMembershipIsActive}
  from "@/modules/courses/college-teaching-reassign-model";
const a="10000000-0000-4000-8000-000000000001",b="10000000-0000-4000-8000-000000000002";
describe("College Faculty atomic reassign",()=>{
  it("requires both a persisted active account and membership",()=>{
    expect(teachingMembershipIsActive(undefined)).toBe(false);
    expect(teachingMembershipIsActive({accountStatus:"ACTIVE",membershipStatus:"ACTIVE"})).toBe(true);
    for(const row of [
      {accountStatus:"DISABLED",membershipStatus:"ACTIVE"},
      {accountStatus:"ACTIVE",membershipStatus:"SUSPENDED"},
      {accountStatus:"ACTIVE",membershipStatus:"LEFT"},
    ])expect(teachingMembershipIsActive(row)).toBe(false);
  });
  it("rejects same Faculty, stale-token omission and unconfirmed changes",()=>{
    const data={expectedMembershipId:a,replacementMembershipId:b,
      expectedUpdatedAt:"2026-10-14T12:00:00.123Z",confirm:true};
    expect(collegeTeachingReassignSchema.parse(data)).toEqual(data);
    for(const patch of [
      {replacementMembershipId:a},{confirm:false},{expectedUpdatedAt:"not-a-date"},{collegeId:b},
    ])expect(collegeTeachingReassignSchema.safeParse({...data,...patch}).success).toBe(false);
  });
  it("explains recorded teaching history and role preservation",()=>{
    expect(teachingReassignPrompt("A","B","PRIMARY")).toContain("PRIMARY");
    expect(teachingReassignPrompt("A","B","PRIMARY")).toContain("history");
  });
});
