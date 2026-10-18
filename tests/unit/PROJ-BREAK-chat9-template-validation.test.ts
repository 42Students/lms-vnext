import { describe, expect, it } from "vitest";
import {
  createProjectTemplateInputSchema,
  reviseProjectTemplateInputSchema,
  duplicateProjectTemplateInputSchema,
  publishableProjectTemplateBlueprintSchema,
} from "@/modules/projects/validation";

const blueprint = () => ({
  overview: { goal: "Build a safe project", deliverables: ["Working demo"] },
  releases: [{ key: "r1", title: "Launch", sequence: 0 }],
  sprints: [{ key: "s1", releaseKey: "r1", title: "Sprint one", sequence: 0 }],
  tasks: [{ key: "t1", sprintKey: "s1", title: "Tests", sequence: 0 }],
  resources: [{ key: "readme", title: "Reference", url: "https://example.org/guide", sequence: 0 }],
});
const create = () => ({
  slug: "iit-dharwad-sprint", title: "IIT Dharwad Project", blueprint: blueprint(),
});

describe("IIT Dharwad Projects: template creation, publication and optimistic revision payloads", () => {
  it("PROJ-BREAK-templates-40 validates a complete connected release/sprint/task graph", () => {
    expect(createProjectTemplateInputSchema.safeParse(create()).success).toBe(true);
    expect(publishableProjectTemplateBlueprintSchema.safeParse(blueprint()).success).toBe(true);
    const revise = {
      expectedVersion: 2,
      title: "IIT Dharwad Project revised",
      blueprint: blueprint(),
      changeNote: "Add acceptance tests",
    };
    expect(reviseProjectTemplateInputSchema.safeParse(revise).success).toBe(true);
  });

  it("PROJ-BREAK-templates-41 rejects duplicate keys, duplicate sprint order and forged parent references", () => {
    const good = blueprint();
    for (const mutation of [
      { ...good, releases: [good.releases[0], good.releases[0]] },
      { ...good, sprints: [good.sprints[0], { ...good.sprints[0], key: "s2" }] },
      { ...good, sprints: [{ ...good.sprints[0], releaseKey: "other" }] },
      { ...good, tasks: [{ ...good.tasks[0], sprintKey: "other" }] },
      { ...good, tasks: [good.tasks[0], { ...good.tasks[0], key: "t2" }] },
      { ...good, resources: [good.resources[0], { ...good.resources[0], key: "another" }] },
    ]) {
      expect(createProjectTemplateInputSchema.safeParse({
        ...create(), blueprint: mutation,
      }).success, JSON.stringify(mutation).slice(0,120)).toBe(false);
    }
  });

  it("PROJ-BREAK-templates-42 drafts may be incomplete but publication must have a valid nonempty dependency graph", () => {
    expect(createProjectTemplateInputSchema.safeParse({
      ...create(), blueprint: { overview: {}, releases: [], sprints: [], tasks: [] },
    }).success).toBe(true);
    for (const mutation of [
      { ...blueprint(), releases: [] },
      { ...blueprint(), sprints: [] },
      { ...blueprint(), tasks: [] },
    ]) {
      expect(publishableProjectTemplateBlueprintSchema.safeParse(mutation).success).toBe(false);
    }
  });

  it("PROJ-BREAK-templates-43 refuses crafted URL schemes, unknown privilege flags and stale version shapes", () => {
    const good = create();
    for (const invalid of [
      { slug: "../../cross-tenant" },
      { slug: "=FORMULA" },
      { title: " " },
      { title: "x".repeat(201) },
      { ownerRole: "SUPER_ADMIN" },
      { blueprint: { ...blueprint(), resources: [{ ...blueprint().resources[0], url: "javascript:alert(1)" }] } },
      { blueprint: { ...blueprint(), resources: [{ ...blueprint().resources[0], url: "file:///etc/passwd" }] } },
    ]) {
      expect(createProjectTemplateInputSchema.safeParse({
        ...good, ...invalid,
      }).success, JSON.stringify(invalid).slice(0,100)).toBe(false);
    }
    for (const expectedVersion of [0, -1, 0.5, Number.POSITIVE_INFINITY]) {
      expect(reviseProjectTemplateInputSchema.safeParse({
        title: good.title, blueprint: good.blueprint, expectedVersion,
      }).success).toBe(false);
    }
    expect(reviseProjectTemplateInputSchema.safeParse({
      title: good.title, blueprint: good.blueprint, expectedVersion: 1, overwriteAll: true,
    }).success).toBe(false);
  });

  it("PROJ-BREAK-templates-44 duplicate requests permit safe defaults but not forged status or overlong fields", () => {
    expect(duplicateProjectTemplateInputSchema.safeParse({}).success).toBe(true);
    expect(duplicateProjectTemplateInputSchema.safeParse({
      title: "Copy", slug: "copied-template",
    }).success).toBe(true);
    for (const invalid of [
      { status: "PUBLISHED" },
      { collegeId: "other-college" },
      { slug: "with spaces" },
      { title: "x".repeat(201) },
      { summary: "y".repeat(2001) },
    ]) {
      expect(duplicateProjectTemplateInputSchema.safeParse(invalid).success).toBe(false);
    }
  });
});
