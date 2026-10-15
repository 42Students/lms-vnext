import { describe, expect, it } from "vitest";
import { mayCloseProjectSprint } from "@/modules/projects/sprint-close-policy";
import { readFileSync } from "node:fs";
const read = (n: string) => readFileSync(new URL("../../src/modules/projects/" + n, import.meta.url), "utf8");
describe("PR-S2-01 explicit no-carry-over sprint close", () => {
  it("requires zero open tasks", () => {
    expect(mayCloseProjectSprint(0)).toBe(true);
    expect(mayCloseProjectSprint(1)).toBe(false);
    expect(mayCloseProjectSprint(100)).toBe(false);
    expect(mayCloseProjectSprint(-1)).toBe(false);
  });
  it("enforces the policy in both sprint close implementations", () => {
    expect(read("lifecycle-service.ts")).toContain("mayCloseProjectSprint(openTask ? 1 : 0)");
    expect(read("mentor-sprint-write-service.ts")).toContain("mayCloseProjectSprint(openTask ? 1 : 0)");
  });
});
