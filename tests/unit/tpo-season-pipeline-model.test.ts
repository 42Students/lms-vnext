import { describe, expect, it } from "vitest";
import { exportTpoSeasonPipelineCsv, projectTpoSeasonPipeline,
  TPO_SEASON_PIPELINE_CSV_DRIVE_LIMIT } from "@/modules/placements/tpo-season-pipeline-model";

describe("TPO season pipeline projection", () => {
  const jobs = [{ id: "job-a", title: "=Bad formula", companyName: "+Corp" }];
  const applications = [
    { id: "app-a", jobId: "job-a", status: "SUBMITTED", screeningStatus: "SHORTLISTED" },
    { id: "app-b", jobId: "job-a", status: "WITHDRAWN", screeningStatus: "SHORTLISTED" },
  ];
  const offers = [
    { id: "offer-1", jobId: "job-a", applicationId: "app-a", status: "ACCEPTED", joiningStatus: "JOINED" },
    { id: "offer-2", jobId: "job-a", applicationId: "app-a", status: "WITHDRAWN", joiningStatus: null },
    { id: "wrong", jobId: "job-a", applicationId: "elsewhere", status: "ACCEPTED", joiningStatus: "JOINED" },
  ];
  it("counts applications, screens, offer versions and confirmed joins without selected guesses", () => {
    const projected = projectTpoSeasonPipeline(jobs, applications, offers);
    expect(projected.totals).toEqual({
      applied: 2, currentlySubmitted: 1, shortlisted: 1, selected: null,
      offered: 2, accepted: 1, joined: 1,
    });
    expect(projected.rows[0]).toMatchObject({ applied: 2, joined: 1, selected: null });
    expect(projectTpoSeasonPipeline([], applications, offers).totals.applied).toBe(0);
  });
  it("formula-neutralizes names, exports a complete season total and caps drive rows", () => {
    const projected = projectTpoSeasonPipeline(jobs, applications, offers);
    const many = Array.from({ length: TPO_SEASON_PIPELINE_CSV_DRIVE_LIMIT + 3 },
      (_, i) => ({ ...projected.rows[0]!, id: String(i) }));
    const csv = exportTpoSeasonPipelineCsv("-Season", projected.totals, many);
    expect(csv.exportedDriveRows).toBe(TPO_SEASON_PIPELINE_CSV_DRIVE_LIMIT);
    expect(csv.truncated).toBe(true);
    expect(csv.csv).toContain("'=Bad formula");
    expect(csv.csv).toContain("'+Corp");
    expect(csv.csv).toContain("'-Season");
    expect(csv.csv).toContain("TRUNCATED");
    expect(csv.csv).toContain("first 200 of 203");
    expect(csv.csv).toContain("Selected: no independent");
  });
});
