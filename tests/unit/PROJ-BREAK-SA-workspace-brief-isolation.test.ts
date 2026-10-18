import { describe, expect, it } from "vitest";
import {
 emptyWorkspaceBrief, parseWorkspaceBrief, workspaceBriefSchema, updateWorkspaceBriefSchema,
} from "@/modules/projects/workspace-brief-model";

describe("Super Admin workspace brief isolation and malformed persisted JSON", () => {
 it("PROJ-BREAK-SA-23 never reuses mutable fallback state across workspaces or requests", () => {
  const first = parseWorkspaceBrief(null);
  const second = parseWorkspaceBrief({goal: "tampered", deliverables: ["x"], rogue: true});
  expect(first).toEqual(emptyWorkspaceBrief);
  expect(second).toEqual(emptyWorkspaceBrief);
  expect(first).not.toBe(second);
  expect(first).not.toBe(emptyWorkspaceBrief);
  expect(first.deliverables).not.toBe(second.deliverables);
  expect(first.completionConditions).not.toBe(second.completionConditions);
  expect(first.personas).not.toBe(second.personas);
  first.goal = "Private college A data";
  first.deliverables.push("college-A-file");
  first.completionConditions.push("college-A-grading-rule");
  first.personas.push("student-A");
  expect(parseWorkspaceBrief(undefined)).toEqual({
   goal: "", description: "", deliverables: [], completionConditions: [], personas: [],
  });
  expect(parseWorkspaceBrief(false)).toEqual(emptyWorkspaceBrief);
  expect(emptyWorkspaceBrief.deliverables).toEqual([]);
  expect(emptyWorkspaceBrief.personas).toEqual([]);
 });

 it("PROJ-BREAK-SA-24 retains strict, bounded, independent valid brief parsing", () => {
  const original = {goal:"  Ship a project  ",description:"  Requirements  ",
   deliverables:[" report "],completionConditions:[" compiled "],personas:[" learner "]};
  const parsed = parseWorkspaceBrief(original);
  expect(parsed).toMatchObject({goal:"Ship a project",description:"Requirements",
   deliverables:["report"],completionConditions:["compiled"],personas:["learner"]});
  parsed.deliverables.push("another deliverable");
  expect(original.deliverables).toEqual([" report "]);
  for (const bad of [
   {...original, unknown:"foreign college"},
   {...original, deliverables: Array.from({length:51},()=> "x")},
   {...original, personas:[""]},
   {...original, goal:"x".repeat(2001)},
   {...original, description:"x".repeat(4001)},
  ]) {
   expect(workspaceBriefSchema.safeParse(bad).success).toBe(false);
   expect(parseWorkspaceBrief(bad)).toEqual(emptyWorkspaceBrief);
  }
  expect(updateWorkspaceBriefSchema.safeParse({
   brief:original,expectedUpdatedAt:"2026-10-18T12:00:00+05:30",
  }).success).toBe(true);
  expect(updateWorkspaceBriefSchema.safeParse({
   brief:original,expectedUpdatedAt:"not-a-date",
  }).success).toBe(false);
 });
});
