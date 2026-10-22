import { describe, expect, it } from "vitest";
import { adminElectiveQuerySchema, summarizeAdminElectives } from "@/modules/electives/admin-directory-model";
describe("Super Admin elective slot read model", () => {
  it("never counts values outside the supplied scope and separates statuses", () => {
    const sample = [{ id: "1", programId: "p1", name: "Open", programName: "X", semesterNumber: 3,
      academicYear: null, description: null, version: 0, credits: 3, minPick: 1, maxPick: 1, status: "ACTIVE" },
    { id: "2", programId: "p2", name: "Old", programName: "X", semesterNumber: 3,
      academicYear: null, description: null, version: 1, credits: 2, minPick: 0, maxPick: 2, status: "ARCHIVED" }];
    expect(summarizeAdminElectives(sample)).toMatchObject({ total: 2, active: 1, archived: 1 });
  });
  it("rejects unknown search fields and invalid status", () => {
    expect(adminElectiveQuerySchema.safeParse({ status: "DELETED" }).success).toBe(false);
    expect(adminElectiveQuerySchema.safeParse({ collegeId: "forged" }).success).toBe(false);
  });
});
