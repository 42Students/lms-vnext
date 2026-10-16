import { describe, expect, it } from "vitest";
import {
  moveTemplateSprint, moveTemplateTask, nextTemplatePlanKey,
  normalizeTemplatePlan, removeTemplateSprint, updateTemplateSprint,
} from "@/modules/projects/template-plan-editor-model";
import { projectTemplateBlueprintSchema, reviseProjectTemplateInputSchema } from "@/modules/projects/validation";

const blueprint = {
  overview: { deliverables: [] },
  releases: [{ key: "release-1", title: "First release", sequence: 0 }],
  sprints: [
    { key: "sprint-1", releaseKey: "release-1", title: "One", sequence: 0, dueLabel: "Week 2", goal: "Demo" },
    { key: "sprint-2", releaseKey: "release-1", title: "Two", sequence: 1 },
  ],
  tasks: [
    { key: "task-1", sprintKey: "sprint-1", title: "Implement", priority: "HIGH" as const, sequence: 0, estimatePoints: 13 },
    { key: "task-2", sprintKey: "sprint-1", title: "Test", priority: "LOW" as const, sequence: 1 },
  ],
  resources: [],
};
const parse = () => projectTemplateBlueprintSchema.parse(blueprint);

describe("SA-placements-projects-83 Sprint repeating editor", () => {
  it("moves siblings and never changes another section of the immutable blueprint", () => {
    const source = parse(), moved = moveTemplateSprint(source, "sprint-1", 1);
    expect(moved.sprints.map(row => row.sequence)).toEqual([1, 0]);
    expect(moved.tasks).toEqual(source.tasks);
    expect(normalizeTemplatePlan(moved).sprints.map(row => row.sequence)).toEqual([1, 0]);
  });
  it("renaming the sprint preserves its tasks and rejects deleting a populated sprint", () => {
    const renamed = updateTemplateSprint(parse(), 0, { key: "sprint-new" });
    expect(renamed.tasks[0].sprintKey).toBe("sprint-new");
    expect(removeTemplateSprint(renamed, "sprint-new").error).toContain("tasks first");
    expect(projectTemplateBlueprintSchema.safeParse(renamed).success).toBe(true);
  });
  it("validates sprint release, required title, due label and goal boundaries", () => {
    const source = parse();
    expect(projectTemplateBlueprintSchema.safeParse({
      ...source, sprints: [{ ...source.sprints[0], releaseKey: "missing" }],
    }).success).toBe(false);
    expect(projectTemplateBlueprintSchema.safeParse({
      ...source, sprints: source.sprints.map((row, i) => i === 0 ? { ...row, goal: "a".repeat(1001) } : row),
    }).success).toBe(false);
    expect(nextTemplatePlanKey(["sprint-1", "sprint-3"], "sprint")).toBe("sprint-2");
  });
});

describe("SA-placements-projects-84 Task repeating editor", () => {
  it("moves only tasks within the same sprint", () => {
    const source = parse(), moved = moveTemplateTask(source, "task-1", 1);
    expect(moved.tasks.map(row => row.sequence)).toEqual([1, 0]);
    expect(moved.sprints).toEqual(source.sprints);
  });
  it("validates priority, sprint reference, and 1-13 point estimates", () => {
    const source = parse();
    const invalid = (changes: Record<string, unknown>) =>
      projectTemplateBlueprintSchema.safeParse({
        ...source, tasks: [{ ...source.tasks[0], ...changes }],
      }).success;
    expect(invalid({ estimatePoints: 14 })).toBe(false);
    expect(invalid({ estimatePoints: 0 })).toBe(false);
    expect(invalid({ estimatePoints: 2.5 })).toBe(false);
    expect(invalid({ priority: "URGENT" })).toBe(false);
    expect(invalid({ sprintKey: "missing" })).toBe(false);
  });
  it("preserves all other blueprint sections during a versioned write", () => {
    const parsed = reviseProjectTemplateInputSchema.parse({
      expectedVersion: 3, title: "Test template", changeNote: "Updated template tasks", blueprint: parse(),
    });
    expect(parsed.blueprint.resources).toEqual([]);
    expect(parsed.blueprint.sprints[0].dueLabel).toBe("Week 2");
    expect(parsed.blueprint.tasks[0].estimatePoints).toBe(13);
  });
});
