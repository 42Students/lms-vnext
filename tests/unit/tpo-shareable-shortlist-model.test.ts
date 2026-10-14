import { describe, expect, it } from "vitest";
import {
  projectRecruiterVisibleShortlist,
  tpoShareableShortlistCsv,
  tpoShareableShortlistQuerySchema,
} from "@/modules/placements/tpo-shareable-shortlist-model";

describe("TPO recruiter-visible shortlist preview", () => {
  it("projects ONLY the recruiter round workspace candidate columns", () => {
    const rows = projectRecruiterVisibleShortlist([{
      applicationId: "app-1", displayName: " Student ", email: "a@example.org",
    }]);
    expect(rows).toEqual([{
      applicationId: "app-1", displayName: "Student", email: "a@example.org",
    }]);
    expect(Object.keys(rows[0]!)).toEqual(["applicationId", "displayName", "email"]);
  });

  it("neutralizes formula injection and labels truncation", () => {
    const rows = projectRecruiterVisibleShortlist([{
      applicationId: "app-1", displayName: "=SUM(1,2)", email: "+mail@example.org",
    }]);
    const csv = tpoShareableShortlistCsv(rows, true);
    expect(csv).toContain("\"'=SUM(1,2)\"");
    expect(csv).toContain("\"'+mail@example.org\"");
    expect(csv).toContain("export truncated");
    expect(tpoShareableShortlistCsv([], false).split("\r\n")).toHaveLength(1);
  });

  it("rejects forged college parameters and bad page", () => {
    const jobId = "00000000-0000-4000-8000-000000000001";
    expect(tpoShareableShortlistQuerySchema.parse({ jobId })).toEqual({
      jobId, page: 1,
    });
    expect(tpoShareableShortlistQuerySchema.safeParse({
      jobId, collegeId: jobId,
    }).success).toBe(false);
    expect(tpoShareableShortlistQuerySchema.safeParse({
      jobId, page: 0,
    }).success).toBe(false);
  });
});
