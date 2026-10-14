import {describe,expect,it} from "vitest";
import {escapeMentorMeetingSearch,mentorTeamMeetingsQuerySchema,mentorTeamMeetingsHref}
  from "@/modules/projects/mentor-team-meetings-model";
const projectId="00000000-0000-4000-8000-000000000001";
describe("Mentor exact-project meeting title filtering",()=>{
 it("treats SQL search wildcard characters as literals",()=>{
  expect(escapeMentorMeetingSearch("a%b_c")).toBe("a\\%b\\_c");
  expect(escapeMentorMeetingSearch("abc")).toBe("abc");
 });
 it("validates search and preserves status across pages",()=>{
  const query=mentorTeamMeetingsQuerySchema.parse({
   projectId,status:"SCHEDULED",search:"Review",page:2,
  });
  expect(mentorTeamMeetingsHref(query)).toContain("search=Review");
  expect(mentorTeamMeetingsQuerySchema.safeParse({...query,collegeId:projectId}).success)
   .toBe(false);
  expect(mentorTeamMeetingsQuerySchema.safeParse({...query,search:"x".repeat(101)}).success)
   .toBe(false);
 });
});
