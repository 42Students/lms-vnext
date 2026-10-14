import { describe, expect, it } from "vitest";
import { compareTemplateVersionSnapshots, templateVersionComparisonHref, templateVersionComparisonParamsSchema } from "@/modules/projects/template-version-comparison-model";
const snapshot = { title: "Template", summary: null, blueprint: { overview: { goal: "Goal", deliverables: [] }, tasks: [{ key: "t1" }, { key: "t2" }] } };
describe("Template version comparison", () => {
  it("ignores object field order while preserving meaningful array order", () => {
    expect(compareTemplateVersionSnapshots(snapshot, { ...snapshot, blueprint: { tasks: snapshot.blueprint.tasks,
      overview: { deliverables: [], goal: "Goal" } } })).toEqual([]);
    expect(compareTemplateVersionSnapshots(snapshot, { ...snapshot, blueprint: { ...snapshot.blueprint,
      tasks: [...snapshot.blueprint.tasks].reverse() } }).map(row => row.label)).toEqual(["tasks"]);
  });
  it("compares actual values rather than section counts", () => {
    expect(compareTemplateVersionSnapshots(snapshot, { ...snapshot, title: "Revised", summary: "New" })
      .map(row => row.label)).toEqual(["Title", "Summary"]);
  });
  it("rejects malformed and excess route parameters", () => {
    expect(templateVersionComparisonParamsSchema.safeParse({ templateId: "bad", versionId: "bad" }).success).toBe(false);
    expect(templateVersionComparisonParamsSchema.safeParse({ templateId: "00000000-0000-4000-8000-000000000001", versionId: "00000000-0000-4000-8000-000000000002", collegeId: "override" }).success).toBe(false);
    expect(templateVersionComparisonHref("00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002"))
      .toContain("/versions/00000000-0000-4000-8000-000000000002");
  });
});
