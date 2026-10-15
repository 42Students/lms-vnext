import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../../src/components/projects/project-workspace.tsx", import.meta.url),
  "utf8",
);

describe("PR-S2-03 task assignee JSX condition", () => {
  it("closes the conditional before the Mentor task-status action", () => {
    expect(source).toMatch(
      /<ProjectTaskAssigneeControl[\s\S]*?\/>\s*\) : null\}\s*\{mode === "MENTOR"/,
    );
  });
});
