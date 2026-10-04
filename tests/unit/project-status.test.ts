import {
  describe,
  expect,
  it,
} from "vitest";
import {
  parseExecutionChecklist,
} from "../../scripts/project-status";

describe("project status parser", () => {
  it("counts only execution phases A through AC", () => {
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

# AD. Rules for future ChatGPT sessions
- [ ] read handoff
- [ ] inspect current HEAD
`);

    expect(status).toMatchObject({
      done: 3,
      partial: 1,
      open: 2,
      total: 6,
      strictPercent: 50,
      practicalPercent: 58.33,
    });

    expect(
      status.sections.map(
        (section) => section.section,
      ),
    ).toEqual([
      "A. Repository and foundation",
      "B. Core migration research",
      "AC. Fresh vNext production launch",
    ]);
  });

  it("retains remaining item text and state", () => {
    const status =
      parseExecutionChecklist(`
# A. Repository and foundation
- [x] done
- [~] waiting on dependency
- [ ] still open

# AD. Rules for future ChatGPT sessions
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
