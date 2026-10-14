import { describe, expect, it } from "vitest";
import {
  COLLEGE_SETUP_DEEP_LINKS,
  collegeChecklistProjection,
  collegeSetupChecklistQuerySchema,
} from "@/modules/admin-ui/college-setup-checklist-model";
import { COLLEGE_ADMIN_SETUP_PHASES } from "@/modules/admin-ui/admin-dashboard-navigation";

describe("College Admin setup checklist evidence", () => {
  const keys = COLLEGE_ADMIN_SETUP_PHASES.flatMap(phase => phase.steps.map(step => step.key));
  it("requires an empty caller payload (no foreign college selection)", () => {
    expect(collegeSetupChecklistQuerySchema.parse({})).toEqual({});
    expect(collegeSetupChecklistQuerySchema.safeParse({
      collegeId: "20000000-0000-4000-8000-000000000002",
    }).success).toBe(false);
  });
  it("only displays records actually counted; never guesses missing counts", () => {
    const counts = Object.fromEntries(keys.map(key => [key, 0]));
    const result = collegeChecklistProjection({ ...counts, departments: 2 });
    const steps = result.flatMap(phase => phase.steps);
    expect(steps.find(step => step.key === "departments"))
      .toMatchObject({ count: 2, hasRecords: true });
    expect(steps.find(step => step.key === "faculty"))
      .toMatchObject({ count: 0, hasRecords: false });
    expect(() => collegeChecklistProjection({ departments: 1 }))
      .toThrow("SETUP_COUNT_UNAVAILABLE");
    expect(() => collegeChecklistProjection({ ...counts, students: -1 }))
      .toThrow("SETUP_COUNT_UNAVAILABLE");
  });
  it("provides only explicit relative College Admin deep links", () => {
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(COLLEGE_SETUP_DEEP_LINKS[key]).toMatch(/^\/college\//);
    }
  });
});
