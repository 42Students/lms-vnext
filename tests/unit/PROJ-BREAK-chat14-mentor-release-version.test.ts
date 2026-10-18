import {describe,expect,it} from "vitest";
import {
 mentorReleaseVersionMatches,mentorReleaseDeleteSchema,nextMentorReleaseUpdateAt,
} from "@/modules/projects/mentor-release-version-model";

const t="2026-10-18T10:00:00.123Z";
describe("PROJ-BREAK-MENTOR-130..133 release updates under stale tabs and concurrency",()=>{
 it("PROJ-BREAK-MENTOR-130 two updates in same millisecond advance a CAS token",()=>{
  const original=new Date(t);
  const sameClock=new Date(t);
  const after=nextMentorReleaseUpdateAt(original,sameClock);
  expect(after?.toISOString()).toBe("2026-10-18T10:00:00.124Z");
  expect(mentorReleaseVersionMatches(after!,t)).toBe(false);
  expect(mentorReleaseVersionMatches(after!,"2026-10-18T10:00:00.124Z")).toBe(true);
  const second=nextMentorReleaseUpdateAt(after!,sameClock);
  expect(second?.toISOString()).toBe("2026-10-18T10:00:00.125Z");
  expect(mentorReleaseVersionMatches(second!,after!.toISOString())).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-131 future clock advances to actual server time",()=>{
  const updated=nextMentorReleaseUpdateAt(new Date(t),new Date("2026-10-18T10:00:10.000Z"));
  expect(updated?.toISOString()).toBe("2026-10-18T10:00:10.000Z");
 });
 it("PROJ-BREAK-MENTOR-132 equivalent IST timestamps pass, malformed and old tokens fail",()=>{
  expect(mentorReleaseVersionMatches(new Date(t),"2026-10-18T15:30:00.123+05:30")).toBe(true);
  for(const invalid of ["", "invalid", "2026-10-18T10:00:00.122Z"]){
   expect(mentorReleaseVersionMatches(new Date(t),invalid)).toBe(false);
  }
  expect(mentorReleaseDeleteSchema.safeParse({expectedUpdatedAt:t}).success).toBe(true);
  expect(mentorReleaseDeleteSchema.safeParse({expectedUpdatedAt:t,actorId:"forged"}).success).toBe(false);
  expect(mentorReleaseDeleteSchema.safeParse({expectedUpdatedAt:"bad"}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-133 clock and persisted-version corruption fail closed",()=>{
  expect(nextMentorReleaseUpdateAt(new Date(NaN),new Date(t))).toBeNull();
  expect(nextMentorReleaseUpdateAt(new Date(t),new Date(NaN))).toBeNull();
  expect(mentorReleaseVersionMatches(new Date(NaN),t)).toBe(false);
 });
});
