import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createCourseInputSchema,updateCourseInputSchema} from "@/modules/courses/validation";

const courseId="11111111-1111-4111-8111-111111111111";
describe("legacy course short display name length",()=>{
  it("enforces 255-character title in both create and edit validation",()=>{
    expect(createCourseInputSchema.safeParse({
      departmentId:courseId,name:"Data Structures",code:"CS101",shortTitle:"D".repeat(255),
    }).success).toBe(true);
    expect(createCourseInputSchema.safeParse({
      departmentId:courseId,name:"Data Structures",code:"CS101",shortTitle:"D".repeat(256),
    }).success).toBe(false);
    expect(updateCourseInputSchema.safeParse({
      expectedUpdatedAt:"2026-10-22T12:00:00Z",shortTitle:"D".repeat(256),
    }).success).toBe(false);
  });
  it("does not prefill more than 255 characters in edit, duplicate and restore paths",()=>{
    const actions=readFileSync("src/components/courses/admin-course-actions.tsx","utf8");
    const create=readFileSync("src/components/courses/admin-course-create-panel.tsx","utf8");
    const service=readFileSync("src/modules/courses/course-service.ts","utf8");
    expect(actions).toContain('maxLength={255} placeholder="e.g. DSA"');
    expect(actions).toContain("course.name.slice(0,255)");
    expect(create).toContain('slice(0,255)');
    expect(service).toContain("locked.name.slice(0, 255)");
    expect(actions).not.toContain("slice(0,120)");
  });
});
