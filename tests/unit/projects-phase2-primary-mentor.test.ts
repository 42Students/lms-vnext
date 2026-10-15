import { describe, expect, it } from "vitest";
import { mayRemovePrimaryProjectMentor } from "@/modules/projects/primary-mentor-policy";
import { readFileSync } from "node:fs";
const read = (file: string) => readFileSync(new URL("../../src/modules/projects/" + file, import.meta.url), "utf8");
describe("PR-S2-09 sole primary mentor", () => {
  it("prevents an active project losing its primary mentor", () => {
    expect(mayRemovePrimaryProjectMentor("ACTIVE", "MENTOR", true)).toBe(false);
    expect(mayRemovePrimaryProjectMentor("ACTIVE", "MENTOR", false)).toBe(true);
    expect(mayRemovePrimaryProjectMentor("PLANNED", "MENTOR", true)).toBe(true);
    expect(mayRemovePrimaryProjectMentor("ACTIVE", "LEARNER", false)).toBe(true);
  });
  it("guards demotion and ending as well as both sprint activation paths", () => {
    const members = read("member-service.ts");
    expect(members.match(/mayRemovePrimaryProjectMentor\(/g)?.length).toBe(2);
    expect(read("lifecycle-service.ts")).toContain('if (!primary) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE")');
    expect(read("mentor-sprint-write-service.ts")).toContain('if (!primary) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE")');
  });
});
