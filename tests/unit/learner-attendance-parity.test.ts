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
    const course = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/courses/learner-course-workspace.tsx",
      ),
      "utf8",
    );

    expect(shell).toContain(
      'href: "/learn/attendance"',
    );
    expect(page).toContain(
      'title="Attendance"',
    );
    expect(course).toContain(
      "/learn/attendance?deliveryId=",
    );
  });
  it("keeps server-loaded course identity and explicit loading/error recovery", () => {
    const workspace = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/attendance/learner-attendance-workspace.tsx",
      ),
      "utf8",
    );

    expect(workspace).toContain("courses[0]?.deliveryId");
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
