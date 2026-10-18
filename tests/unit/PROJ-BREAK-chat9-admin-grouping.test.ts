import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { groupProjectAdminRows } from "@/modules/projects/admin-insights-group-model";

describe("IIT Dharwad Projects: admin snapshot scaling and isolation", () => {
  it("PROJ-BREAK-scale-22 indexes each project's events in stable SQL order without mutating raw records", () => {
    const rows = Object.freeze([
      Object.freeze({ projectId: "A", version: 3 }),
      Object.freeze({ projectId: "B", version: 4 }),
      Object.freeze({ projectId: "A", version: 2 }),
      Object.freeze({ projectId: "A", version: 1 }),
    ]);
    const index = groupProjectAdminRows(rows);
    expect(index.get("A")?.map(row => row.version)).toEqual([3, 2, 1]);
    expect(index.get("B")?.map(row => row.version)).toEqual([4]);
    expect(index.get("C")).toBeUndefined();
    expect(rows.map(row => row.version)).toEqual([3, 4, 2, 1]);
  });

  it("PROJ-BREAK-scale-23 100 project cards with 20,000 child records remain partitioned and complete", () => {
    const rows = Array.from({ length: 20_000 }, (_, i) => ({
      projectId: "project-" + (i % 100),
      sequence: i,
    }));
    const index = groupProjectAdminRows(rows);
    expect(index.size).toBe(100);
    for (let project = 0; project < 100; project++) {
      const key = "project-" + project;
      expect(index.get(key)?.length).toBe(200);
      expect(index.get(key)?.[0]?.sequence).toBe(project);
      expect(index.get(key)?.at(-1)?.sequence).toBe(project + 19_900);
    }
    expect(index.get("project-100")).toBeUndefined();
  });

  it("PROJ-BREAK-idor-29 maps hostile-looking project IDs without prototype pollution or cross-tenant mixing", () => {
    const index = groupProjectAdminRows([
      { projectId: "__proto__", label: "untrusted" },
      { projectId: "constructor", label: "different tenant" },
      { projectId: "toString", label: "separate record" },
    ]);
    expect(index.size).toBe(3);
    expect(index.get("__proto__")?.[0]?.label).toBe("untrusted");
    expect(index.get("constructor")?.[0]?.label).toBe("different tenant");
    expect(index.get("toString")?.[0]?.label).toBe("separate record");
    expect(Object.prototype).not.toHaveProperty("projectId");
  });

  it("PROJ-BREAK-scale-24 admin snapshots and risk queues use the grouped indices for all child rows", () => {
    const source = readFileSync("src/modules/projects/admin-insights-service.ts", "utf8");
    for (const key of [
      "tasksByProject", "sprintsByProject", "releasesByProject",
      "submissionsByProject", "taskSubmissionsByProject",
      "meetingsByProject", "resourcesByProject", "membersByProject",
      "mentorsByProject",
    ]) expect(source).toContain(key);
    expect(source).toContain("groupProjectAdminRows(mentors)");
    expect(source).not.toContain("tasks.filter(");
    expect(source).not.toContain("mentors.filter(");
  });
});
