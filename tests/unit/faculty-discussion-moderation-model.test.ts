import {describe,expect,it} from "vitest";
import {facultyDiscussionModerationSchema,facultyDiscussionTokenMatches}
 from "@/modules/courses/faculty-discussion-moderation-model";
describe("Course Discussion optimistic moderation",()=>{
 it("rejects empty or forged confirmation bodies",()=>{
  const token="2026-10-14T03:04:05.123Z";
  expect(facultyDiscussionModerationSchema.safeParse({expectedUpdatedAt:token,confirmed:true}).success).toBe(true);
  expect(facultyDiscussionModerationSchema.safeParse({expectedUpdatedAt:token,confirmed:false}).success).toBe(false);
  expect(facultyDiscussionModerationSchema.safeParse({expectedUpdatedAt:token,confirmed:true,collegeId:"foreign"}).success).toBe(false);
 });
 it("compares a SQL microsecond snapshot at JavaScript millisecond precision",()=>{
  const snapshot=new Date("2026-10-14T03:04:05.123Z");
  expect(facultyDiscussionTokenMatches(snapshot,snapshot.toISOString())).toBe(true);
  expect(facultyDiscussionTokenMatches(snapshot,"2026-10-14T03:04:05.122Z")).toBe(false);
 });
});
