import {describe,expect,it} from "vitest";
import {mentorHomeGreeting} from
 "@/modules/projects/mentor-home-greeting-model";
describe("Mentor Home greeting and missing identity",()=>{
 it("uses Indian time rather than the server UTC clock",()=>{
  expect(mentorHomeGreeting("2026-10-24T02:00:00.000Z","Maya"))
   .toBe("Good morning, Maya.");
  expect(mentorHomeGreeting("2026-10-24T08:00:00.000Z","Maya"))
   .toBe("Good afternoon, Maya.");
  expect(mentorHomeGreeting("2026-10-24T14:00:00.000Z","Maya"))
   .toBe("Good evening, Maya.");
 });
 it("does not fabricate an identity or false hour for malformed input",()=>{
  expect(mentorHomeGreeting("garbage",null)).toBe("Welcome, Mentor.");
  expect(mentorHomeGreeting("2026-10-24T14:00:00.000Z","  "))
   .toBe("Good evening, Mentor.");
 });
});
