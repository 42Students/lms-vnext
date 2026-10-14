import { z } from "zod";
import { placementReportCsv } from "./report-model";

export const tpoSeasonPipelineQuerySchema = z.object({
  seasonId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
}).strict();

export type TpoPipelineApplication = {
  id: string; jobId: string; status: string; screeningStatus: string | null;
};
export type TpoPipelineOffer = {
  id: string; applicationId: string; jobId: string; status: string;
  joiningStatus: string | null;
};
export type TpoPipelineJob = {
  id: string; title: string; companyName: string;
};
export type TpoPipelineCounts = {
  applied: number;
  currentlySubmitted: number;
  shortlisted: number;
  selected: number | null;
  offered: number;
  accepted: number;
  joined: number;
};
export type TpoPipelineRow = TpoPipelineCounts & TpoPipelineJob;

/**
 * Applications are all persisted application IDs (including withdrawn).
 * Shortlisted is current SUBMITTED + SHORTLISTED screening.
 * Offered and accepted count distinct offer versions; joined is an accepted
 * offer version with explicit JOINED outcome.
 * A final employer "selected" decision has no verified independent source.
 */
export function projectTpoSeasonPipeline(
  jobs: readonly TpoPipelineJob[],
  applications: readonly TpoPipelineApplication[],
  offers: readonly TpoPipelineOffer[],
) {
  const byJob = new Map(jobs.map((job) => [job.id, job]));
  const scopedApplications = [...new Map(applications.filter((app) =>
    byJob.has(app.jobId)).map((app) => [app.id, app])).values()];
  const validApplications = new Map(scopedApplications.map((app) => [app.id, app]));
  const scopedOffers = [...new Map(offers.filter((offer) =>
    byJob.has(offer.jobId) &&
    validApplications.get(offer.applicationId)?.jobId === offer.jobId)
    .map((offer) => [offer.id, offer])).values()];

  function tally(jobId?: string): TpoPipelineCounts {
    const apps = jobId ? scopedApplications.filter((app) => app.jobId === jobId) : scopedApplications;
    const jobOffers = jobId ? scopedOffers.filter((offer) => offer.jobId === jobId) : scopedOffers;
    return {
      applied: apps.length,
      currentlySubmitted: apps.filter((app) => app.status === "SUBMITTED").length,
      shortlisted: apps.filter((app) => app.status === "SUBMITTED" &&
        app.screeningStatus === "SHORTLISTED").length,
      selected: null,
      offered: jobOffers.length,
      accepted: jobOffers.filter((offer) => offer.status === "ACCEPTED").length,
      joined: jobOffers.filter((offer) => offer.status === "ACCEPTED" &&
        offer.joiningStatus === "JOINED").length,
    };
  }
  return {
    totals: tally(),
    rows: jobs.map((job) => ({ ...job, ...tally(job.id) })),
  };
}

export const TPO_SEASON_PIPELINE_CSV_DRIVE_LIMIT = 200;

export function exportTpoSeasonPipelineCsv(
  seasonName: string,
  totals: TpoPipelineCounts,
  rows: readonly TpoPipelineRow[],
) {
  const truncated = rows.length > TPO_SEASON_PIPELINE_CSV_DRIVE_LIMIT;
  const exported = rows.slice(0, TPO_SEASON_PIPELINE_CSV_DRIVE_LIMIT);
  const cells = (scope: string, name: string, company: string, counts: TpoPipelineCounts) => [
    scope, name, company, counts.applied, counts.currentlySubmitted, counts.shortlisted,
    counts.selected, counts.offered, counts.accepted, counts.joined,
  ];
  const body: (string | number | null)[][] = [
    cells("Season total", seasonName, "", totals),
    ...exported.map((row) => cells("Drive", row.title, row.companyName, row)),
    ["Methodology", "Applied includes withdrawn applications; shortlisted is currently submitted and screened SHORTLISTED; offered counts persisted offer versions; accepted uses current offer status; joined requires ACCEPTED + JOINED.", "", "", "", "", "", "", "", ""],
    ["Unavailable", "Selected: no independent, migrated final selection decision. Do not infer from PASS rounds or offers.", "", "", "", "", "", "", "", ""],
  ];
  if (truncated) {
    body.push(["TRUNCATED", `Only the first ${TPO_SEASON_PIPELINE_CSV_DRIVE_LIMIT} of ${rows.length} drive rows are exported. The season total includes all drives.`, "", "", "", "", "", "", "", ""]);
  }
  return {
    csv: placementReportCsv([
      "Scope", "Name", "Company", "Applied application IDs", "Currently submitted",
      "Shortlisted application IDs", "Selected (unavailable)", "Offer versions",
      "Accepted offer versions", "Confirmed joined offer versions",
    ], body),
    truncated,
    exportedDriveRows: exported.length,
  };
}
