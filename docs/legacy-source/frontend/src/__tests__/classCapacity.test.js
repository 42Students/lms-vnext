import { classCapacityState, classMaximumStudents } from "@/utils/classCapacity";

describe("class capacity state", () => {
  test("reads camel and snake case configured maximums", () => {
    expect(classMaximumStudents({ upperLimit: 60 })).toBe(60);
    expect(classMaximumStudents({ upper_limit: 45 })).toBe(45);
  });

  test("marks a destination full at or above its configured maximum", () => {
    expect(classCapacityState({ upperLimit: 2 }, 2)).toEqual({
      known: true, count: 2, max: 2, full: true, remaining: 0,
    });
    expect(classCapacityState({ upperLimit: 2 }, 3).full).toBe(true);
  });

  test("keeps remaining seats explicit for a valid destination", () => {
    expect(classCapacityState({ upper_limit: 4 }, 1)).toEqual({
      known: true, count: 1, max: 4, full: false, remaining: 3,
    });
  });

  test("unknown capacity or roster counts never pretend a class is safely under capacity", () => {
    expect(classCapacityState({}, 10).known).toBe(false);
    expect(classCapacityState({ upperLimit: 60 }, null)).toEqual({
      known: false, count: null, max: 60, full: false, remaining: null,
    });
  });
});
