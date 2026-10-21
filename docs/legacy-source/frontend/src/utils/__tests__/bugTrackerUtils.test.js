import {
  formatTrackerDate,
  locationPathToFields,
  trackerAccessTokenFromHash,
  trackerLocationText,
} from "../bugTrackerUtils";

describe("bug tracker utilities", () => {
  test("reads the personal access token from a URL fragment", () => {
    expect(trackerAccessTokenFromHash("#access=abc_123")).toBe("abc_123");
    expect(trackerAccessTokenFromHash("#other=x")).toBeNull();
  });

  test("keeps environment out of location inference and maps only the selected hierarchy", () => {
    expect(locationPathToFields(["Courses", "Learning Path", "Lesson Content"])).toEqual({
      page: "Courses",
      screen: "Learning Path",
      section: "Lesson Content",
    });
  });

  test("renders the issue location as a compact breadcrumb", () => {
    expect(trackerLocationText({
      page: "Projects",
      screen: "Project Details",
      section: "Tasks",
    })).toBe("Projects › Project Details › Tasks");
  });

  test("formats the backend's array-shaped LocalDateTime instead of rendering nothing", () => {
    const fromArray = formatTrackerDate([2026, 9, 28, 5, 9, 4, 354662000]);
    expect(fromArray).toMatch(/2026/);
    expect(fromArray).toBe(formatTrackerDate("2026-09-28T05:09:04Z"));
    expect(formatTrackerDate(null)).toBe("");
    expect(formatTrackerDate("not a date")).toBe("");
  });
});
