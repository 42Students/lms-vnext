import {describe,it,expect} from "vitest";
import {lessonVisibilityCommandSchema,mayEditLessonStudentVisibility} from "@/modules/courses/faculty-lesson-visibility-model";
describe("College Admin lesson visibility command",()=>{
  const id="00000000-0000-4000-8000-000000000001";
  const valid={lessonContentId:id,visibleToStudents:false,
    expectedUpdatedAt:"2026-10-15T05:00:00.000Z",confirmed:true};
  it("requires an exact versioned confirmed boolean and no tenant override",()=>{
    expect(lessonVisibilityCommandSchema.safeParse(valid).success).toBe(true);
    expect(lessonVisibilityCommandSchema.safeParse({...valid,confirmed:false}).success).toBe(false);
    expect(lessonVisibilityCommandSchema.safeParse({...valid,visibleToStudents:"false"}).success).toBe(false);
    expect(lessonVisibilityCommandSchema.safeParse({...valid,collegeId:id}).success).toBe(false);
    expect(lessonVisibilityCommandSchema.safeParse({...valid,expectedUpdatedAt:"yesterday"}).success).toBe(false);
  });
  it("does not give faculty or learners the admin switch",()=>{
    expect(mayEditLessonStudentVisibility("ADMIN")).toBe(true);
    expect(mayEditLessonStudentVisibility("FACULTY")).toBe(false);
    expect(mayEditLessonStudentVisibility("LEARNER")).toBe(false);
  });
});
