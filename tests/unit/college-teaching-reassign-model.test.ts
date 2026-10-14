import {describe,it,expect} from "vitest";
import {collegeTeachingReassignSchema,teachingReassignPrompt}
  from "@/modules/courses/college-teaching-reassign-model";
const a="10000000-0000-4000-8000-000000000001",b="10000000-0000-4000-8000-000000000002";
describe("College Faculty atomic reassign",()=>{
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
