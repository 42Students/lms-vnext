import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("Learner Assessment personal reminder wiring", () => {
  it("scopes local reminders to the authenticated learner membership", () => {
    const page = read("src/app/(authenticated)/learn/my-placements/assessments/page.tsx");
    const workspace = read("src/components/placements/learner-career-rounds-workspace.tsx");
    expect(page).toContain("membershipId={context.membership?.id ?? null}");
    expect(workspace).toContain("learnerAssessmentReminderStorageKey(membershipId)");
    expect(workspace).toContain("window.localStorage.setItem");
    expect(workspace).toContain("Undo personal reminder");
  });

  it("never reports local reminders as employer submission or result", () => {
    const source = read("src/components/placements/learner-career-rounds-workspace.tsx");
    expect(source).toContain("not sent to your employer or placement team");
    expect(source).toContain("does not confirm assessment completion");
    expect(source).not.toContain("/api/placements/assessment-submissions");
  });
});
