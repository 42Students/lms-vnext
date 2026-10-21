import { isProjectConcurrencyConflict } from "@/utils/projectErrorModal";
import { templateScalars } from "@/components/admin/projects/adminProjectUtils";
import Api from "@/api/ApiMethod";
import { withdrawProjectMeetingRequest } from "@/api/Services/projectService";
import { bulkSetProjectTemplateColleges, rollbackProjectTemplateVersion } from "@/api/Services/AdminService";

jest.mock("@/api/ApiMethod", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(() => Promise.resolve({})), put: jest.fn(() => Promise.resolve({})), delete: jest.fn() },
}));

// Projects audit 2026-10-07 (docs/audits/projects-module-10-round-adversarial-audit-2026-10-07.md).
describe("Projects audit fixes", () => {
  beforeEach(() => jest.clearAllMocks());

  test("stale-copy 409s from the section, details and template tokens get the Refresh dialog", () => {
    expect(isProjectConcurrencyConflict(409, "The resource list changed since you opened it. Refresh to see the latest, then try again.")).toBe(true);
    expect(isProjectConcurrencyConflict(409, "This template was changed since you opened it. Refresh to see the latest, then try again.")).toBe(true);
    expect(isProjectConcurrencyConflict(409, "This task was modified by someone else. Please refresh and try again.")).toBe(true);
    // A state-machine 409 is still not a concurrency failure.
    expect(isProjectConcurrencyConflict(409, "Every sprint linked to this release must be completed first")).toBe(false);
  });

  test("template section saves no longer echo the page's copy of the scalar fields (R7-01)", () => {
    const payload = templateScalars({ templateVersion: 7, title: "Old title", slug: "old", summary: "s", courseLabel: "c", phase: "p" });
    expect(payload).toEqual({ expectedTemplateVersion: 7 });
  });

  test("a learner withdraws a pending meeting request through its own endpoint (R4-03)", async () => {
    await withdrawProjectMeetingRequest("proj-11", "meeting-2-kickoff");
    expect(Api.post).toHaveBeenCalledWith("/api/v1/projects/proj-11/meetings/meeting-2-kickoff/withdraw");
  });

  test("bulk college availability and rollback carry the state the admin last saw (R7-02, R7-04)", async () => {
    await bulkSetProjectTemplateColleges(9, [1, 2], [1]);
    expect(Api.put).toHaveBeenCalledWith("/api/v1/admin/project-templates/9/colleges", { collegeIds: [1, 2], expectedCollegeIds: [1] });

    await rollbackProjectTemplateVersion(9, 3, 6, 12);
    expect(Api.post.mock.calls.at(-1)[0]).toContain("expectedTemplateVersion=12");
  });
});
