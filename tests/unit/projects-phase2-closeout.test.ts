import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { closeoutChecklist } from "@/modules/projects/mentor-closeout-model";

const lifecycle = readFileSync(new URL("../../src/modules/projects/lifecycle-service.ts", import.meta.url), "utf8");
const closeout = readFileSync(new URL("../../src/modules/projects/mentor-closeout-service.ts", import.meta.url), "utf8");

describe("PR-S1-01: mentor closeout is the only completion path", () => {
  it("does not auto-complete a project when its final release ships", () => {
    const ship = lifecycle.split("export async function shipProjectRelease(")[1];
    expect(ship).toBeDefined();
    expect(ship).not.toContain('status: "COMPLETED"');
    expect(closeout).toContain('status:"COMPLETED"');
  });

  it("requires approved final delivery and completed tasks, sprints and releases", () => {
    const ready = { projectStatus: "ACTIVE", approved: true, openTasks: 0, openSprints: 0, openReleases: 0 };
    expect(closeoutChecklist(ready).canComplete).toBe(true);
    expect(closeoutChecklist({ ...ready, approved: false }).canComplete).toBe(false);
    expect(closeoutChecklist({ ...ready, openTasks: 1 }).canComplete).toBe(false);
    expect(closeoutChecklist({ ...ready, openSprints: 1 }).canComplete).toBe(false);
    expect(closeoutChecklist({ ...ready, openReleases: 1 }).canComplete).toBe(false);
    expect(closeoutChecklist({ ...ready, projectStatus: "COMPLETED" }).canComplete).toBe(false);
  });
});
