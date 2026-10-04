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
    expect(component).toContain(
      "/learn/courses/",
    );
  });
});
