import { describe, expect, it } from "vitest";
import { collegeFacultyLifecycleSchema, facultyLifecycleConfirmation } from "@/modules/people/college-faculty-lifecycle-model";

describe("College Faculty lifecycle boundary", () => {
  it("demands an explicit state, valid reason and confirmation", () => {
    expect(collegeFacultyLifecycleSchema.parse({
      action: "DEACTIVATE", expectedStatus: "ACTIVE",
      reason: "No teaching duties", confirm: true,
    }).reason).toBe("No teaching duties");
    for (const invalid of [
      { action: "DEACTIVATE", expectedStatus: "ACTIVE", reason: "x", confirm: true },
      { action: "REACTIVATE", expectedStatus: "ACTIVE", confirm: true },
      { action: "REACTIVATE", expectedStatus: "SUSPENDED", confirm: true, collegeId: "forged" },
    ]) expect(collegeFacultyLifecycleSchema.safeParse(invalid).success).toBe(false);
  });
  it("warns about access consequences", () => {
    expect(facultyLifecycleConfirmation("Teacher", "DEACTIVATE")).toContain("lose access");
    expect(facultyLifecycleConfirmation("Teacher", "REACTIVATE")).toContain("Reactivate");
  });
});
