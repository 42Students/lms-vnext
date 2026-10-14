import { describe, expect, it } from "vitest";
import { hrApplicantFilterSchema, projectSharedApplicants } from "@/modules/placements/hr-job-applicants-model";
const rows = [
  { id: "a", name: "A", role: "Developer", status: "SUBMITTED", screening: "SHORTLISTED", submittedAt: new Date(0), email: null },
  { id: "b", name: "B", role: "Analyst", status: "WITHDRAWN", screening: "SHORTLISTED", submittedAt: new Date(1), email: null },
];
describe("HR shared applications", () => {
  it("counts before filtering and excludes withdrawn from active shortlist", () => {
    expect(projectSharedApplicants(rows, "SHORTLISTED").rows.map(x => x.id)).toEqual(["a"]);
    expect(projectSharedApplicants(rows, "WITHDRAWN").counts).toEqual({ all: 2, shortlisted: 1, withdrawn: 1 });
  });
  it("rejects arbitrary tab and stage", () => {
    expect(hrApplicantFilterSchema.safeParse({ tab: "private" }).success).toBe(false);
    expect(hrApplicantFilterSchema.safeParse({ stage: "PENDING" }).success).toBe(false);
  });
});
