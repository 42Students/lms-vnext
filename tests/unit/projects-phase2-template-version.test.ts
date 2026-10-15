import { describe, expect, it } from "vitest";
import { reviseProjectTemplateInputSchema } from "@/modules/projects/validation";
import { readFileSync } from "node:fs";
const text = readFileSync(new URL("../../src/modules/projects/template-service.ts", import.meta.url), "utf8");
const valid = { title:"Project", blueprint:{overview:{deliverables:[]},releases:[],sprints:[],tasks:[],resources:[]}, expectedVersion:2 };
describe("PR-S2-14: template revisions use row-locked expected version", () => {
  it("requires an exact positive revision token at the API boundary", () => {
    expect(reviseProjectTemplateInputSchema.safeParse(valid).success).toBe(true);
    expect(reviseProjectTemplateInputSchema.safeParse({...valid,expectedVersion:0}).success).toBe(false);
    const { expectedVersion: _unused, ...unversioned } = valid;
    expect(reviseProjectTemplateInputSchema.safeParse(unversioned).success).toBe(false);
  });
  it("locks and compares the persisted version before updating and allocating history", () => {
    const revise = text.split("export async function reviseProjectTemplate(")[1]?.split("export async function publishProjectTemplate(")[0] ?? "";
    expect(revise).toContain('.for("update").limit(1)');
    expect(revise).toContain("locked.currentVersion !== input.expectedVersion");
    expect(revise).toContain("eq(projectTemplates.currentVersion, input.expectedVersion)");
    expect(revise).toContain("PROJECT_TEMPLATE_STALE_VERSION");
  });
});
