import { describe, expect, it } from "vitest";
import { projectTpoDriveLifecycle, tpoDriveLifecycleQuerySchema } from "@/modules/placements/tpo-drive-lifecycle-list-model";
const facts = [
  { id: "a", title: "Engineer", company: "Acme", status: "PUBLISHED",
    workMode: "ONSITE", employmentType: "FULL_TIME", applicationDeadline: "2026-10-17T00:00:00Z" },
  { id: "b", title: "Draft", company: "Beta", status: "DRAFT",
    workMode: "REMOTE", employmentType: "INTERNSHIP", applicationDeadline: null },
  { id: "c", title: "Closed", company: "Zen", status: "CLOSED",
    workMode: "ONSITE", employmentType: "FULL_TIME", applicationDeadline: null },
];
describe("TPO drive lifecycle listing", () => {
  it("separates active published jobs from drafts and closed jobs", () => {
    const result = projectTpoDriveLifecycle(facts, "ALL", "2026-10-14T00:00:00Z");
    expect(result.counts).toEqual({
      total: 3, drafts: 1, live: 1, closed: 1, deadlinesNextSevenDays: 1,
    });
    expect(projectTpoDriveLifecycle(facts, "LIVE", "2026-10-14T00:00:00Z").rows.map((r) => r.id)).toEqual(["a"]);
  });
  it("does not invent deadline counts or accept unknown views", () => {
    expect(projectTpoDriveLifecycle([], "ALL", "2026-10-14T00:00:00Z").counts.deadlinesNextSevenDays).toBe(0);
    expect(tpoDriveLifecycleQuerySchema.safeParse({ view: "REQUESTS" }).success).toBe(false);
  });
});
