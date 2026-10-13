import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  hasMembershipRole,
  isSuperAdmin,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { placementReportCsv } from "@/modules/placements/report-model";
import { getPlacementReportWorkspace } from "@/modules/placements/report-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const exportQuerySchema = z
  .object({
    kind: z.enum(["placement-summary", "by-branch"]),
    seasonId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional(),
  })
  .strict();

type CsvValue = string | number | null;

function placementSummaryCsv(
  workspace: Awaited<ReturnType<typeof getPlacementReportWorkspace>>,
) {
  const headings = [
    "Section",
    "Name",
    "Company",
    "Employment type",
    "Registered",
    "Applicants",
    "Applications",
    "Shortlisted",
    "Rejected",
    "Offers",
    "Accepted offers",
    "Placed learners",
    "Placement rate (%)",
    "Average annual CTC (INR)",
    "Highest annual CTC (INR)",
  ];

  const metrics = workspace.report.metrics;

  const rows: CsvValue[][] = [
    [
      "Overall",
      "Selected placement report",
      "",
      "",
      metrics.registered,
      metrics.applicants,
      metrics.applications,
      metrics.shortlisted,
      metrics.rejected,
      metrics.offers,
      metrics.acceptedOffers,
      metrics.studentsPlaced,
      metrics.placementRatePercent,
      metrics.averagePackageInr,
      metrics.highestPackageInr,
    ],
  ];

  for (const drive of workspace.report.byDrive) {
    rows.push([
      "Drive",
      drive.title,
      drive.companyName,
      drive.employmentType,
      "",
      drive.applicants,
      drive.applications,
      drive.shortlisted,
      drive.rejected,
      drive.offers,
      drive.acceptedOffers,
      drive.placed,
      "",
      "",
      "",
    ]);
  }

  for (const company of workspace.report.byCompany) {
    rows.push([
      "Company",
      company.companyName,
      "",
      "",
      "",
      company.applicants,
      company.applications,
      "",
      "",
      company.offers,
      company.acceptedOffers,
      company.placed,
      "",
      company.averagePackageInr,
      company.highestPackageInr,
    ]);
  }

  rows.push([
    "Scope note",
    workspace.registrationScopeNote,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  return placementReportCsv(headings, rows);
}

function byBranchCsv(
  workspace: Awaited<ReturnType<typeof getPlacementReportWorkspace>>,
) {
  const headings = [
    "Branch",
    "Registered",
    "Unique applicants",
    "Applications",
    "Offers",
    "Accepted offers",
    "Placed learners",
    "Placement rate (%)",
    "Average annual CTC (INR)",
    "Highest annual CTC (INR)",
  ];

  const rows: CsvValue[][] = workspace.report.byBranch.map((branch) => [
    branch.departmentName,
    branch.registered,
    branch.applicants,
    branch.applications,
    branch.offers,
    branch.acceptedOffers,
    branch.placed,
    branch.placementRatePercent,
    branch.averagePackageInr,
    branch.highestPackageInr,
  ]);

  rows.push([
    "Scope note",
    workspace.registrationScopeNote,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  return placementReportCsv(headings, rows);
}

/**
 * Aggregate-only export. The college ID comes from authenticated context,
 * never from URL parameters. The placement report service independently
 * enforces the selected tenant, season and job scopes.
 */
export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();

    const collegeId = isSuperAdmin(context)
      ? context.adminScope?.collegeId ?? null
      : hasMembershipRole(context, "TPO")
        ? context.membership?.collegeId ?? null
        : null;

    if (!collegeId) {
      throw new AuthorizationError("placements.manage");
    }

    const query = exportQuerySchema.parse(
      Object.fromEntries(
        new URL(request.url).searchParams.entries(),
      ),
    );

    const workspace = await getPlacementReportWorkspace(context, {
      collegeId,
      seasonId: query.seasonId,
      jobId: query.jobId,
    });

    const csv =
      query.kind === "placement-summary"
        ? placementSummaryCsv(workspace)
        : byBranchCsv(workspace);

    const filename =
      query.kind === "placement-summary"
        ? "tpo-placement-summary.csv"
        : "tpo-placement-by-branch.csv";

    return new Response(`﻿${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }
}
