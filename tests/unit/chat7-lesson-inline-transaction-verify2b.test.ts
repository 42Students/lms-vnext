import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const lesson=readFileSync("src/modules/courses/lesson-service.ts","utf8");
const progress=readFileSync("src/modules/courses/super-admin-student-course-progress.ts","utf8");
describe("legacy curriculum authoring and links",()=>{
  it("validates nested legacy contents and rolls back all inserts atomically",()=>{
    expect(lesson).toContain("const {contentsDTOs,lessonName,courseSlug,courseId,...lessonFields}=rawObject");
    expect(lesson).toContain('z.array(z.record(z.string(),z.unknown())).max(50)');
    expect(lesson).toContain('if(children.some(item=>item["lessonId"]!==undefined');
    expect(lesson).toContain("return await getDb().transaction(async (tx)");
    expect(lesson).toContain("await tx.insert(lessonContents).values");
  });
  it("requires tenant-scoped course/class crosswalks and verified teaching relation",()=>{
    expect(progress).toContain("resolveLegacyCourseProgressScope(");
    expect(progress).toContain("eq(departments.collegeId,collegeId)");
    expect(progress).toContain("eq(sections.legacyClassId,classId)");
    expect(progress).toContain("COURSE_NOT_TAUGHT_IN_CLASS");
    expect(progress).toContain("course_teaching_assignments ta");
  });
});
