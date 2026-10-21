import { matchesSelectedCourseRoute, canDisplayCourseContext } from "@/utils/courseTabsContext";

describe("shared Faculty/Learner course page title isolation", () => {
  const course = { id: 17, slug: "mechanics", name: "Mechanics" };
  test("renders title only for matching course ID or slug", () => {
    expect(matchesSelectedCourseRoute(course, "mechanics")).toBe(true);
    expect(matchesSelectedCourseRoute(course, "17")).toBe(true);
    expect(matchesSelectedCourseRoute(course, "18")).toBe(false);
    expect(matchesSelectedCourseRoute(course, "structures")).toBe(false);
  });
  test("never accepts missing course context", () => {
    expect(matchesSelectedCourseRoute(null, "mechanics")).toBe(false);
    expect(matchesSelectedCourseRoute({ name: "Old title" }, "mechanics")).toBe(false);
    expect(matchesSelectedCourseRoute(course, undefined)).toBe(false);
  });
  test("does not render another role's title or tabs during SPA role switch", () => {
    expect(canDisplayCourseContext("LEARNER", true, "teacher")).toBe(false);
    expect(canDisplayCourseContext("FACULTY", true, "learn")).toBe(false);
    expect(canDisplayCourseContext("FACULTY", false, "teacher")).toBe(false);
    expect(canDisplayCourseContext("FACULTY", true, "teacher")).toBe(true);
    expect(canDisplayCourseContext("LEARNER", true, "learn")).toBe(true);
  });
});
