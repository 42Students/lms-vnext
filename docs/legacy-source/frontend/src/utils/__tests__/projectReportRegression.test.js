import fs from "fs";
import path from "path";
import { isProjectConcurrencyConflict } from "../projectErrorModal";
import { sortNumberedTeamSeries } from "../projectListOrdering";

describe("Projects report regressions", () => {
  test("same-series numbered teams sort naturally instead of lexicographically", () => {
    const rows = [
      { title: "Capstone - Team 1" },
      { title: "Capstone - Team 10" },
      { title: "Capstone - Team 2" },
    ];
    expect(sortNumberedTeamSeries(rows).map((row) => row.title)).toEqual([
      "Capstone - Team 1",
      "Capstone - Team 2",
      "Capstone - Team 10",
    ]);
  });

  test("unrelated project titles retain their existing order", () => {
    const rows = [{ title: "Beta - Team 2" }, { title: "Alpha - Team 1" }];
    expect(sortNumberedTeamSeries(rows)).toEqual(rows);
  });

  test("only genuine optimistic concurrency messages get the refresh treatment", () => {
    expect(isProjectConcurrencyConflict(409, "This sprint was modified by someone else. Please refresh and try again.")).toBe(true);
    expect(isProjectConcurrencyConflict(409, '"Sprint 2" is already active — complete it before starting another one')).toBe(false);
    expect(isProjectConcurrencyConflict(409, "This sprint is already completed and can't be restarted")).toBe(false);
  });

  test("mentor Add member uses project-scoped candidate search instead of the global learner directory", () => {
    const detail = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/Projects/ProjectDetailContent.jsx"),
      "utf8"
    );
    const service = fs.readFileSync(
      path.resolve(process.cwd(), "src/api/Services/projectService.js"),
      "utf8"
    );
    expect(detail).toContain("searchProjectMemberCandidates(projectId");
    expect(detail).not.toContain("searchLearners(query");
    expect(detail).not.toContain("searchFaculty(query");
    expect(service).toContain("/member-candidates?");
  });
});
