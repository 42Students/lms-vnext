import {
  QUICK_REPORT_ENABLED_KEY,
  buildTrackerSourceContext,
  inferTrackerAccount,
  inferTrackerLocation,
  isEditableTarget,
} from "../bugTrackerQuickReport";

describe("42 Tracker quick report helpers", () => {
  test("infers LMS account role without inferring environment", () => {
    expect(inferTrackerAccount({ userType: "LEARNER" })).toBe("LEARNER");
    expect(inferTrackerAccount({ userType: "FACULTY", facultyType: "ADMIN" })).toBe("COLLEGE_ADMIN");
    expect(inferTrackerAccount({ userType: "FACULTY", facultyType: "MENTOR" })).toBe("MENTOR");
    expect(inferTrackerAccount({ id: 0 })).toBe("SUPER_ADMIN");
  });

  test("maps common LMS routes to existing tracker hierarchy", () => {
    expect(inferTrackerLocation(
      "/learn/courses/[courseId]/[...courseTab]",
      "/learn/courses/42/learning-path"
    )).toEqual(["Courses", "Learning Path", "Other"]);
    expect(inferTrackerLocation(
      "/college-admin/projects/workspaces/[workspaceId]/tasks",
      "/college-admin/projects/workspaces/8/tasks"
    )).toEqual(["Projects", "Project Details", "Tasks"]);
    expect(inferTrackerLocation(
      "/learn/my-placements/jobs/[jobId]",
      "/learn/my-placements/jobs/77"
    )).toEqual(["Placements", "Jobs", "Job Details"]);
  });

  test("source context strips query and hash from the captured URL", () => {
    const originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState({}, "", "/learn/courses/42?token=secret#private");
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 1 });

    const context = buildTrackerSourceContext("/learn/courses/[courseId]");
    expect(context.sourceUrl).toBe(`${window.location.origin}/learn/courses/42`);
    expect(context.sourceUrl).not.toContain("token");
    expect(context.sourceUrl).not.toContain("#private");
    expect(context.sourcePath).toBe("/learn/courses/[courseId]");
    expect(context.viewport).toBe("1440x900@1");

    window.history.pushState({}, "", originalPath || "/");
  });

  test("uses a stable browser opt-in key", () => {
    expect(QUICK_REPORT_ENABLED_KEY).toBe("42tracker_quick_report_enabled_v1");
  });

  describe("isEditableTarget", () => {
    test("recognizes input, textarea and select elements", () => {
      expect(isEditableTarget(document.createElement("input"))).toBe(true);
      expect(isEditableTarget(document.createElement("textarea"))).toBe(true);
      expect(isEditableTarget(document.createElement("select"))).toBe(true);
    });

    test("recognizes a contenteditable element", () => {
      const div = document.createElement("div");
      div.setAttribute("contenteditable", "true");
      document.body.appendChild(div);
      expect(isEditableTarget(div)).toBe(true);
      div.remove();
    });

    test("recognizes an editable ancestor, not just the exact event target", () => {
      // Rich editors and antd's own inputs often wrap the real editable node a layer or two deep.
      const wrapper = document.createElement("span");
      const input = document.createElement("input");
      wrapper.appendChild(input);
      const icon = document.createElement("i");
      input.appendChild(icon);
      expect(isEditableTarget(icon)).toBe(true);
    });

    test("returns false for a plain page element", () => {
      expect(isEditableTarget(document.createElement("div"))).toBe(false);
      expect(isEditableTarget(document.createElement("button"))).toBe(false);
    });

    test("returns false for a null/undefined target", () => {
      expect(isEditableTarget(null)).toBe(false);
      expect(isEditableTarget(undefined)).toBe(false);
    });
  });
});
