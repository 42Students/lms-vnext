import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {COLLEGE_COURSES_COPY} from "@/modules/courses/college-courses-copy";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin courses legacy edit semantics",()=>{
 it("SA-academics-people-55 uses the legacy Course Name field and confirmation language while keeping immutable department",()=>{
  expect(COLLEGE_COURSES_COPY.nameLabel).toBe("Course Name");
  expect(COLLEGE_COURSES_COPY.createTitle).toBe("Create New Course");
  expect(COLLEGE_COURSES_COPY.existingTitle).toBe("Existing Courses");
  const actions=read("src/components/courses/admin-course-actions.tsx");
  expect(actions).toContain("Course Name");
  expect(actions).toContain('Updated course “"+name.trim()+"”.');
  expect(actions).toContain("A Course without any Offerings can move within the same college using Move department.");
  expect(actions).toContain("expectedUpdatedAt: course.updatedAt");
  expect(actions).toContain("Discard unsaved course changes?");
  expect(actions).toContain("activeOfferingCount>0");
  const form=read("src/components/courses/admin-course-create-panel.tsx");
  expect(form).toContain("Go to Departments");
  expect(form).toContain("No departments in this college yet.");
 });
});
