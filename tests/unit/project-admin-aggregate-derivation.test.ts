import { describe, expect, it } from "vitest";
import { deriveProjectExecutionReadiness } from "@/modules/projects/execution-readiness";
import {
  deriveProjectRiskReasons,
  latestProjectSubmission,
} from "@/modules/projects/risk-signals";

function completeExecution() {
  return {
    projectStatus: "COMPLETED",
    releaseStatuses: ["SHIPPED"],
    sprintStatuses: ["COMPLETED"],
    taskStatuses: ["DONE"],
  };
}

describe("College Admin project execution readiness", () => {
  it("recognizes completed execution", () => {
    expect(
      deriveProjectExecutionReadiness(completeExecution()),
    ).toEqual({
      complete: true,
      releases: { total: 1, shipped: 1 },
      sprints: { total: 1, completed: 1 },
      tasks: { total: 1, done: 1 },
    });
  });

  it("requires non-empty execution collections", () => {
    const result = deriveProjectExecutionReadiness({
      projectStatus: "COMPLETED",
      releaseStatuses: [],
      sprintStatuses: [],
      taskStatuses: [],
    });

    expect(result.complete).toBe(false);
    expect(result.releases.total).toBe(0);
    expect(result.sprints.total).toBe(0);
    expect(result.tasks.total).toBe(0);
  });

  it("requires the project itself to be completed", () => {
    for (const projectStatus of ["PLANNED", "ACTIVE", "ARCHIVED"]) {
      const result = deriveProjectExecutionReadiness({
        ...completeExecution(),
        projectStatus,
      });

      expect(result.complete).toBe(false);
      expect(result.tasks.done).toBe(1);
    }
  });

  it("requires every release to be shipped", () => {
    const result = deriveProjectExecutionReadiness({
      ...completeExecution(),
      releaseStatuses: ["SHIPPED", "PLANNED"],
    });

    expect(result.complete).toBe(false);
    expect(result.releases).toEqual({ total: 2, shipped: 1 });
  });

  it("requires every sprint to be completed", () => {
    const result = deriveProjectExecutionReadiness({
      ...completeExecution(),
      sprintStatuses: ["COMPLETED", "ACTIVE"],
    });

    expect(result.complete).toBe(false);
    expect(result.sprints).toEqual({ total: 2, completed: 1 });
  });

  it("requires every task to be done", () => {
    const result = deriveProjectExecutionReadiness({
      ...completeExecution(),
      taskStatuses: ["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE"],
    });

    expect(result.complete).toBe(false);
    expect(result.tasks).toEqual({ total: 5, done: 1 });
  });

  it("does not mutate the source collections", () => {
    const releases = ["SHIPPED"];
    const sprints = ["COMPLETED"];
    const tasks = ["DONE"];

    deriveProjectExecutionReadiness({
      projectStatus: "COMPLETED",
      releaseStatuses: releases,
      sprintStatuses: sprints,
      taskStatuses: tasks,
    });

    expect(releases).toEqual(["SHIPPED"]);
    expect(sprints).toEqual(["COMPLETED"]);
    expect(tasks).toEqual(["DONE"]);
  });
});

describe("College Admin latest-submission risk", () => {
  it("selects the largest version independent of row order", () => {
    const submissions = [
      { version: 2, status: "APPROVED" },
      { version: 1, status: "SUBMITTED" },
    ];

    expect(latestProjectSubmission(submissions)).toEqual({
      version: 2,
      status: "APPROVED",
    });

    expect(latestProjectSubmission([...submissions].reverse())).toEqual({
      version: 2,
      status: "APPROVED",
    });
  });

  it("ignores an older SUBMITTED version after approval", () => {
    const latest = latestProjectSubmission([
      { version: 1, status: "SUBMITTED" },
      { version: 2, status: "APPROVED" },
    ]);

    expect(
      deriveProjectRiskReasons({
        projectStatus: "ACTIVE",
        inactiveDays: 0,
        latestSubmissionStatus: latest?.status ?? null,
      }),
    ).toEqual([]);
  });

  it("flags the latest SUBMITTED version only", () => {
    const latest = latestProjectSubmission([
      { version: 1, status: "CHANGES_REQUESTED" },
      { version: 3, status: "SUBMITTED" },
      { version: 2, status: "APPROVED" },
    ]);

    expect(
      deriveProjectRiskReasons({
        projectStatus: "ACTIVE",
        inactiveDays: 0,
        latestSubmissionStatus: latest?.status ?? null,
      }),
    ).toEqual(["Pending review"]);
  });

  it("does not flag a latest draft", () => {
    const latest = latestProjectSubmission([
      { version: 1, status: "CHANGES_REQUESTED" },
      { version: 2, status: "DRAFT" },
    ]);

    expect(
      deriveProjectRiskReasons({
        projectStatus: "ACTIVE",
        inactiveDays: 0,
        latestSubmissionStatus: latest?.status ?? null,
      }),
    ).toEqual([]);
  });

  it("handles projects without submissions", () => {
    const latest = latestProjectSubmission<{
      version: number;
      status: string;
    }>([]);

    expect(latest).toBeNull();

    expect(
      deriveProjectRiskReasons({
        projectStatus: "PLANNED",
        inactiveDays: 0,
        latestSubmissionStatus: latest?.status ?? null,
      }),
    ).toEqual([]);
  });

  it("retains the seven-day inactivity threshold", () => {
    expect(
      deriveProjectRiskReasons({
        projectStatus: "ACTIVE",
        inactiveDays: 6,
        latestSubmissionStatus: null,
      }),
    ).toEqual([]);

    expect(
      deriveProjectRiskReasons({
        projectStatus: "ACTIVE",
        inactiveDays: 7,
        latestSubmissionStatus: null,
      }),
    ).toEqual(["No activity in 7 days"]);
  });

  it("combines supported risk signals", () => {
    expect(
      deriveProjectRiskReasons({
        projectStatus: "ACTIVE",
        inactiveDays: 12,
        latestSubmissionStatus: "SUBMITTED",
      }),
    ).toEqual(["No activity in 12 days", "Pending review"]);
  });

  it("excludes terminal projects from risk signals", () => {
    for (const projectStatus of ["COMPLETED", "ARCHIVED"]) {
      expect(
        deriveProjectRiskReasons({
          projectStatus,
          inactiveDays: 30,
          latestSubmissionStatus: "SUBMITTED",
        }),
      ).toEqual([]);
    }
  });

  it("does not mutate submission input", () => {
    const submissions = [
      { version: 1, status: "SUBMITTED" },
      { version: 2, status: "APPROVED" },
    ];

    latestProjectSubmission(submissions);

    expect(submissions).toEqual([
      { version: 1, status: "SUBMITTED" },
      { version: 2, status: "APPROVED" },
    ]);
  });
});
