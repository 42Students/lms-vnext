import fs from "node:fs";
import path from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";

describe("learner attendance parity surface", () => {
  it("keeps the dedicated Attendance route, navigation and Course deep link", () => {
    const shell = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/shell/shell-model.ts",
      ),
      "utf8",
    );
    const page = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/app/(authenticated)/learn/attendance/page.tsx",
      ),
      "utf8",
    );
    // Course attendance now lives inside the course as its own
    // `attendanceDetail` tab instead of a link out to /learn/attendance.
    const courseTabs = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx",
      ),
      "utf8",
    );

    expect(shell).toContain(
      'href: "/learn/attendance"',
    );
    expect(page).toContain(
      'title="Attendance"',
    );
    expect(courseTabs).toContain('"attendanceDetail"');
    expect(courseTabs).toContain("LearnerCourseAttendance");
  });
  it("keeps server-loaded course identity and explicit loading/error recovery", () => {
    const workspace = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/attendance/learner-attendance-workspace.tsx",
      ),
      "utf8",
    );

    expect(workspace).toContain("resolveLearnerAttendanceFilters");
    expect(workspace).toContain('type="month"');
    expect(workspace).toContain('className="space-y-3 md:hidden"');

    for (const file of ["loading.tsx", "error.tsx"]) {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "src/app/(authenticated)/learn/attendance",
            file,
          ),
        ),
      ).toBe(true);
    }
  });
});
