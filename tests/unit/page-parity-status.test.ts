import {
  describe,
  expect,
  it,
} from "vitest";
import {
  buildPageChecklistReport,
  countChecklist,
} from "../../scripts/page-parity-status";

describe("page parity checklist status", () => {
  it("counts checked and open closure items", () => {
    expect(
      countChecklist(`
- [x] done
- [ ] open
- [X] also done
not a checkbox
`),
    ).toEqual({
      done: 2,
      open: 1,
      total: 3,
      percent: 66.67,
    });
  });

  it("aggregates role files", () => {
    expect(
      buildPageChecklistReport([
        {
          file: "learner.md",
          markdown: "- [x] a\n- [ ] b",
        },
        {
          file: "faculty.md",
          markdown: "- [ ] c",
        },
      ]),
    ).toMatchObject({
      done: 1,
      open: 2,
      total: 3,
      percent: 33.33,
    });
  });
});
