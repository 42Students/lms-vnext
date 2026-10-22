import { describe, expect, it } from "vitest";
import {
 emptyWorkspaceBrief, parseWorkspaceBrief, workspaceBriefSchema, updateWorkspaceBriefSchema,
} from "@/modules/projects/workspace-brief-model";

describe("Super Admin workspace brief isolation and malformed persisted JSON", () => {
 it("PROJ-BREAK-SA-23 never reuses mutable fallback state across workspaces or requests", () => {
  const first = parseWorkspaceBrief(null);
  const second = parseWorkspaceBrief({goal: "tampered", deliverables: ["x"], rogue: true});
  expect(first).toEqual(emptyWorkspaceBrief);
  // Legacy persisted briefs may contain opaque overview keys. They must be
  // ignored, not interpreted as cross-workspace authority or editable fields.
  expect(second).toEqual({goal:"tampered",description:"",deliverables:["x"],
   completionConditions:[],personas:[]});
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
   const normalized=parseWorkspaceBrief(bad);
   // The strict editor schema rejects these payloads, while the read adapter
   // safely bounds historical persisted values instead of losing authored text.
   expect(workspaceBriefSchema.safeParse(normalized).success).toBe(true);
   expect(Object.keys(normalized).sort()).toEqual(Object.keys(emptyWorkspaceBrief).sort());
   expect(normalized.goal.length).toBeLessThanOrEqual(2000);
   expect(normalized.description.length).toBeLessThanOrEqual(4000);
   expect(normalized.deliverables.length).toBeLessThanOrEqual(50);
   expect(normalized.personas.every(item=>item.length>0&&item.length<=500)).toBe(true);
  }
  // Persisted tenant identifiers in the untrusted JSON envelope are not
  // accepted as authority or imported across a workspace boundary.
  expect(parseWorkspaceBrief({...original,collegeId:"other-tenant"}))
   .toEqual(emptyWorkspaceBrief);
  expect(Object.keys(parseWorkspaceBrief({...original,collegeId:"other-tenant"})))
   .not.toContain("collegeId");
  expect(updateWorkspaceBriefSchema.safeParse({
   brief:original,expectedUpdatedAt:"2026-10-18T12:00:00+05:30",
  }).success).toBe(true);
  expect(updateWorkspaceBriefSchema.safeParse({
   brief:original,expectedUpdatedAt:"not-a-date",
  }).success).toBe(false);
 });
});
