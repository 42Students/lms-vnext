import { describe, expect, it } from "vitest";
import { lessonMoveSchema, planLessonMove } from "@/modules/courses/college-lesson-order-model";

const a="10000000-0000-4000-8000-000000000001";
const b="10000000-0000-4000-8000-000000000002";
const path="10000000-0000-4000-8000-000000000003";
const rows=[{id:a,sequence:0},{id:b,sequence:3}];

describe("lesson movement transaction planner", () => {
  it("parks the source above all active positions before swapping", () => {
    expect(planLessonMove(rows, {learningPathId:path,lessonId:b,expectedSequence:3,direction:"UP"}))
      .toEqual([{id:b,previousSequence:3,sequence:4},{id:a,previousSequence:0,sequence:3}]);
  });
  it("denies stale positions and out-of-bounds moves", () => {
    expect(planLessonMove(rows,{learningPathId:path,lessonId:a,expectedSequence:1,direction:"DOWN"})).toBeNull();
    expect(planLessonMove(rows,{learningPathId:path,lessonId:a,expectedSequence:0,direction:"UP"})).toBeNull();
    expect(planLessonMove(rows,{learningPathId:path,lessonId:b,expectedSequence:3,direction:"DOWN"})).toBeNull();
  });
  it("strictly validates UUID inputs and directions", () => {
    expect(lessonMoveSchema.safeParse({learningPathId:path,lessonId:a,expectedSequence:0,direction:"UP"}).success).toBe(true);
    expect(lessonMoveSchema.safeParse({learningPathId:path,lessonId:a,expectedSequence:0,direction:"UP",collegeId:"forged"}).success).toBe(false);
  });
});
