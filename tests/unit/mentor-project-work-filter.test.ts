import{describe,it,expect}from"vitest";import{matchesMentorProjectWork as f}from"@/modules/projects/mentor-project-work-model";
import{mentorProjectListQuerySchema as schema}from"@/modules/projects/mentor-project-list-query";
describe("Mentor tracked task coverage",()=>{
 it("treats only absent persisted tasks as no tracked tasks",()=>{expect(f("NO_TASKS",undefined)).toBe(true);expect(f("NO_TASKS",{total:0,open:0})).toBe(true);expect(f("NO_TASKS",{total:1,open:0})).toBe(false)});
 it("keeps unfiltered projects visible",()=>expect(f(undefined,undefined)).toBe(true));
 it("validates URL state strictly",()=>expect(schema.parse({work:"NO_TASKS"}).work).toBe("NO_TASKS"));
});

it("shows only projects with persisted non-DONE work",()=>{
  expect(f("HAS_OPEN_TASKS",undefined)).toBe(false);
  expect(f("HAS_OPEN_TASKS",{total:3,open:2})).toBe(true);
  expect(f("HAS_OPEN_TASKS",{total:2,open:0})).toBe(false);
  expect(schema.safeParse({work:"UNREGISTERED"}).success).toBe(false);
});
