import { describe, expect, it } from "vitest";
import {
  createProjectTemplateInputSchema,
  projectTemplateBlueprintSchema,
} from "@/modules/projects/validation";

function validBlueprint() {
  return {
    overview: {
      goal: "Ship a production-ready capstone",
      deliverables: ["Demo", "Technical report"],
    },
    releases: [
      {
        key: "release-1",
        title: "MVP",
        sequence: 0,
      },
    ],
    sprints: [
      {
        key: "sprint-1",
        releaseKey: "release-1",
        title: "Foundation",
        sequence: 0,
      },
    ],
    tasks: [
      {
        key: "task-1",
        sprintKey: "sprint-1",
        title: "Design schema",
        priority: "HIGH",
        sequence: 0,
      },
    ],
    resources: [
      {
        key: "repo-guide",
        title: "Repository guide",
        url: "https://example.com/repo-guide",
        required: true,
        sequence: 0,
      },
    ],
  };
}

describe("Project template blueprint validation", () => {
  it("accepts a deterministic release -> sprint -> task hierarchy", () => {
    const parsed = projectTemplateBlueprintSchema.parse(
      validBlueprint(),
    );

    expect(parsed.releases[0]?.key).toBe("release-1");
    expect(parsed.sprints[0]?.releaseKey).toBe(
      "release-1",
    );
    expect(parsed.tasks[0]?.sprintKey).toBe("sprint-1");
  });

  it("rejects dangling hierarchy references", () => {
    const blueprint = validBlueprint();
    blueprint.sprints[0]!.releaseKey = "missing-release";

    const result =
      projectTemplateBlueprintSchema.safeParse(blueprint);

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (issue) =>
          issue.path.join(".") ===
          "sprints.0.releaseKey",
      ),
    ).toBe(true);
  });

  it("rejects duplicate keys and sibling ordering collisions", () => {
    const blueprint = validBlueprint();
    blueprint.tasks.push({
      key: "task-1",
      sprintKey: "sprint-1",
      title: "Duplicate",
      priority: "MEDIUM",
      sequence: 0,
    });

    const result =
      projectTemplateBlueprintSchema.safeParse(blueprint);

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (issue) => issue.path.join(".") === "tasks.1.key",
      ),
    ).toBe(true);
    expect(
      result.error?.issues.some(
        (issue) =>
          issue.path.join(".") === "tasks.1.sequence",
      ),
    ).toBe(true);
  });

  it("keeps template slugs stable and machine-safe", () => {
    expect(
      createProjectTemplateInputSchema.safeParse({
        slug: "capstone-2026",
        title: "Capstone 2026",
        blueprint: validBlueprint(),
      }).success,
    ).toBe(true);

    expect(
      createProjectTemplateInputSchema.safeParse({
        slug: "Capstone 2026",
        title: "Capstone 2026",
        blueprint: validBlueprint(),
      }).success,
    ).toBe(false);
  });
});
