import {describe,it,expect} from "vitest";
import {collegeTeachingReassignSchema,teachingReassignPrompt,teachingMembershipIsActive,teachingScheduleConflict}
  from "@/modules/courses/college-teaching-reassign-model";
const a="10000000-0000-4000-8000-000000000001",b="10000000-0000-4000-8000-000000000002";
describe("College Faculty atomic reassign",()=>{
  it("rejects overlapping future timetable windows but permits adjacent and own sessions",()=>{
    const target={id:"delivery-session",startsAt:new Date("2026-10-15T03:30:00Z"),
      endsAt:new Date("2026-10-15T04:30:00Z")};
    expect(teachingScheduleConflict([target],[target])).toBe(false);
    expect(teachingScheduleConflict([target],[])).toBe(false);
    expect(teachingScheduleConflict([target],[{...target,id:"another"}])).toBe(true);
    expect(teachingScheduleConflict([target],[{id:"next",startsAt:target.endsAt,
      endsAt:new Date("2026-10-15T05:30:00Z")}])).toBe(false);
    expect(teachingScheduleConflict([target],[{id:"prior",startsAt:new Date("2026-10-15T02:30:00Z"),
      endsAt:target.startsAt}])).toBe(false);
  });
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
