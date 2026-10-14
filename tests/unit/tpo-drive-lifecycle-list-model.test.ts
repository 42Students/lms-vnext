import { describe, expect, it } from "vitest";
import { projectTpoDriveLifecycle, tpoDriveLifecycleQuerySchema,tpoDriveLifecyclePage } from "@/modules/placements/tpo-drive-lifecycle-list-model";
const facts = [
  { id: "a", title: "Engineer", company: "Acme", status: "PUBLISHED",
    workMode: "ONSITE", employmentType: "FULL_TIME", applicationDeadline: "2026-10-17T00:00:00Z" },
  { id: "b", title: "Draft", company: "Beta", status: "DRAFT",
    workMode: "REMOTE", employmentType: "INTERNSHIP", applicationDeadline: null },
  { id: "c", title: "Closed", company: "Zen", status: "CLOSED",
    workMode: "ONSITE", employmentType: "FULL_TIME", applicationDeadline: null },
];
describe("TPO drive lifecycle listing", () => {
  it("paginates beyond the old cap and clamps stale pages after filtering",()=>{
   expect(tpoDriveLifecyclePage(501,21)).toMatchObject({page:21,totalPages:21,offset:500,totalMatching:501});
   expect(tpoDriveLifecyclePage(26,999)).toMatchObject({page:2,totalPages:2,offset:25});
   expect(tpoDriveLifecyclePage(0,5)).toMatchObject({page:1,totalPages:1,offset:0});
   expect(tpoDriveLifecycleQuerySchema.safeParse({page:0}).success).toBe(false);
   expect(tpoDriveLifecycleQuerySchema.parse({deadline:"DUE_SOON"}).deadline).toBe("DUE_SOON");
   expect(tpoDriveLifecycleQuerySchema.safeParse({deadline:"SELECTED"}).success).toBe(false);
   expect(tpoDriveLifecycleQuerySchema.parse({workMode:"REMOTE"}).workMode).toBe("REMOTE");
   expect(tpoDriveLifecycleQuerySchema.safeParse({workMode:"EXTERNAL"}).success).toBe(false);
   expect(tpoDriveLifecycleQuerySchema.safeParse({page:1.5}).success).toBe(false);
   expect(tpoDriveLifecycleQuerySchema.parse({search:" Acme ",page:"2"})).toMatchObject({search:"Acme",page:2});
  });
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
