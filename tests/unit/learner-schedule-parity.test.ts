import fs from "node:fs";
import path from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";

describe("learner class schedule parity surface", () => {
  it("keeps the dedicated learner calendar route and shell destination", () => {
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
        "src/app/(authenticated)/learn/calendar/page.tsx",
      ),
      "utf8",
    );
    const component = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/academics/learner-class-schedule.tsx",
      ),
      "utf8",
    );

    expect(shell).toContain(
      'href: "/learn/calendar"',
    );
    expect(page).toContain(
      'title="Class Schedule"',
    );
    expect(component).toContain(
      '"month"',
    );
    expect(component).toContain(
      '"week"',
    );
    expect(component).toContain(
      '"day"',
    );
    // Event cards link to the course through a configurable base path whose
    // learner default is /learn/courses.
    expect(component).toContain(
      'courseBasePath = "/learn/courses"',
    );
    expect(component).toContain(
      "${courseBasePath}/${event.deliveryId}",
    );
    // Both legacy daily-use Learner and Faculty course links resolve their
    // distinct Overview tabs, not the compatibility workspace.
    expect(component).toContain(
      'courseBasePath === "/learn/courses" || courseBasePath === "/teacher/courses" ? "/home" : ""',
    );
    const facultyPage = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/app/(authenticated)/teacher/calendar/page.tsx",
      ),
      "utf8",
    );
    expect(facultyPage).toContain('courseBasePath="/teacher/courses"');
    expect(component).toContain(
      'aria-label="Next classes"',
    );
    expect(component).toContain(
      '"mt-5 space-y-4 md:hidden"',
    );
  });
  it("keeps loading/error boundaries separate from true empty schedule", () => {
    for (const file of ["loading.tsx", "error.tsx"]) {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "src/app/(authenticated)/learn/calendar",
            file,
          ),
        ),
      ).toBe(true);
    }
  });
});
