import {
  describe,
  expect,
  it,
} from "vitest";
import {
  parseExecutionChecklist,
} from "../../scripts/project-status";

describe("project status parser", () => {
  it("counts product execution phases through AD and excludes future-chat rules", () => {
    const status =
      parseExecutionChecklist(`
# LMS vNext — Execution Checklist

Legend:
- [x] complete and committed
- [ ] not complete
- [~] intentionally partial

# A. Repository and foundation
- [x] repository
- [x] CI
- [ ] missing thing

# B. Core migration research
- [x] research
- [~] dependency-bound verification

# AC. Fresh vNext production launch
- [ ] launch

# AD. Legacy account-surface parity — ACTIVE
- [x] inventory
- [ ] learner parity

# AE. Rules for future ChatGPT sessions
- [ ] read handoff
- [ ] inspect current HEAD
`);

    expect(status).toMatchObject({
      done: 4,
      partial: 1,
      open: 3,
      total: 8,
      strictPercent: 50,
      practicalPercent: 56.25,
    });

    expect(
      status.sections.map(
        (section) => section.section,
      ),
    ).toEqual([
      "A. Repository and foundation",
      "B. Core migration research",
      "AC. Fresh vNext production launch",
      "AD. Legacy account-surface parity — ACTIVE",
    ]);
  });

  it("retains remaining item text and state", () => {
    const status =
      parseExecutionChecklist(`
# A. Repository and foundation
- [x] done
- [~] waiting on dependency
- [ ] still open

# AE. Rules for future ChatGPT sessions
- [ ] not product work
`);

    expect(status.remaining).toEqual([
      {
        section:
          "A. Repository and foundation",
        state: "partial",
        text:
          "waiting on dependency",
      },
      {
        section:
          "A. Repository and foundation",
        state: "open",
        text: "still open",
      },
    ]);
  });
});
