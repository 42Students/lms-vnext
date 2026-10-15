import { describe, it, expect } from "vitest";
import { projectSubmissionAllowsNewDraft } from "@/modules/projects/submission-draft-policy";
import { readFileSync } from "node:fs";

const service = readFileSync(new URL("../../src/modules/projects/submission-service.ts", import.meta.url), "utf8");

describe("PR-S1-02: approved delivery is terminal", () => {
  it("refuses a new draft after an approved latest version", () => {
    expect(projectSubmissionAllowsNewDraft("APPROVED")).toBe(false);
    expect(projectSubmissionAllowsNewDraft("CHANGES_REQUESTED")).toBe(true);
    expect(projectSubmissionAllowsNewDraft("REJECTED")).toBe(true);
    expect(projectSubmissionAllowsNewDraft(undefined)).toBe(true);
  });
  it("runs the policy under the project row lock before allocating the new version", () => {
    const create = service.split("export async function createProjectSubmissionDraft(")[1]?.split("export async function updateProjectSubmissionDraft(")[0] ?? "";
    expect(create.indexOf('.for("update")')).toBeGreaterThan(-1);
    expect(create.indexOf("projectSubmissionAllowsNewDraft(latest?.status)")).toBeGreaterThan(create.indexOf('.for("update")'));
    expect(create.indexOf("projectSubmissionAllowsNewDraft(latest?.status)")).toBeLessThan(create.indexOf("const version ="));
  });
});
