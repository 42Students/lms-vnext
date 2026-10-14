import { describe, expect, it } from "vitest";
import { projectTemplateCollegeAvailability, templateAssignmentRevocationNotice, templateCollegeAvailabilityQuerySchema } from "@/modules/projects/template-college-availability-model";
const colleges = Array.from({ length: 23 }, (_, i) => ({ id: String(i), name: `College ${String(i).padStart(2, "0")}`, code: `C${i}`, organizationId: "org" }));
const assigned = [{ collegeId: "0", assignedVersion: 2, assignedAt: new Date("2026-10-14T00:00:00Z") }];
describe("Template college availability", () => {
  it("shows authorized unassigned colleges and assigned pinned versions", () => {
    const page = projectTemplateCollegeAvailability(colleges, assigned, { status: "ASSIGNED" });
    expect(page.items).toHaveLength(1);
    expect(page.items[0].assignment?.assignedVersion).toBe(2);
    expect(projectTemplateCollegeAvailability(colleges, assigned, { status: "UNASSIGNED" }).total).toBe(22);
    expect(projectTemplateCollegeAvailability(colleges.slice(1), assigned, { status: "ASSIGNED" }).total).toBe(0);
  });
  it("clamps stale pages and combines code search with assignment filters", () => {
    expect(projectTemplateCollegeAvailability(colleges, assigned, { page: 999 }).query.page).toBe(2);
    expect(projectTemplateCollegeAvailability(colleges, assigned, { q: "C0", status: "UNASSIGNED" }).total).toBe(0);
    expect(projectTemplateCollegeAvailability([], [], {}).totalPages).toBe(1);
  });
  it("rejects scope injection and confirms the impact before removing availability", () => {
    expect(templateCollegeAvailabilityQuerySchema.safeParse({ collegeId: "override" }).success).toBe(false);
    expect(templateCollegeAvailabilityQuerySchema.safeParse({ page: "-1" }).success).toBe(false);
    expect(templateAssignmentRevocationNotice()).toContain("Existing workspaces retain their pinned snapshots");
  });
});
