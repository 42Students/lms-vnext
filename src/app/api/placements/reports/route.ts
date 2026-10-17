import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  hasMembershipRole,
  isSuperAdmin,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { placementReportCsv } from "@/modules/placements/report-model";
import { getPlacementAccreditationReport } from "@/modules/placements/report-accreditation-service";
import {getTpoAccreditationStudentExport} from "@/modules/placements/tpo-accreditation-students-service";
import {
  getPlacementFailureReasonsReport,
  getPlacementLeadsReport,
} from "@/modules/placements/report-extra-service";
import {
  FAILURE_KIND_LABELS,
  type PlacementFailureReport,
  type PlacementLeadsReport,
} from "@/modules/placements/report-extra-model";
import {
  getPlacementReportDetails,
  getPlacementReportWorkspace,
} from "@/modules/placements/report-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const exportQuerySchema = z
  .object({
    kind: z.enum([
      "placement-summary",
      "by-branch",
      "by-company",
      "ctc",
      "unplaced",
      "offers-acceptance",
      "joining-status",
      "failure-reasons",
      "leads",
      "accreditation",
      "accreditation-students",
    ]),
    seasonId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional(),
    batchId: z.string().uuid().optional(),
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

function byCompanyCsv(
  workspace: Awaited<ReturnType<typeof getPlacementReportWorkspace>>,
) {
  return placementReportCsv(
    [
      "Company",
      "Drives",
      "Unique applicants",
      "Applications",
      "Offers",
      "Accepted offers",
      "Placed learners",
      "Average annual CTC (INR)",
      "Highest annual CTC (INR)",
    ],
    workspace.report.byCompany.map((row) => [
      row.companyName,
      row.drives,
      row.applicants,
      row.applications,
      row.offers,
      row.acceptedOffers,
      row.placed,
      row.averagePackageInr,
      row.highestPackageInr,
    ]),
  );
}

type DetailedWorkspace = Awaited<
  ReturnType<typeof getPlacementReportDetails>
>;

function ctcCsv(workspace: DetailedWorkspace) {
  const { ctc } = workspace.details;

  return placementReportCsv(
    ["Measure", "Value"],
    [
      ["Accepted full-time offers", ctc.acceptedFullTimeOffers],
      ["Offers with known CTC", ctc.knownCtcOffers],
      ["Offers with unknown CTC", ctc.unknownCtcOffers],
      ["Average annual CTC (INR)", ctc.averageInr],
      ["Median annual CTC (INR)", ctc.medianInr],
      ["Highest annual CTC (INR)", ctc.highestInr],
      ...ctc.bands.map((band): CsvValue[] => [
        band.label,
        band.offers,
      ]),
      ["Methodology", workspace.detailScopeNote],
      [
        "Distribution basis",
        "Accepted full-time offer records, not unique learners. " +
        "The Placement Summary uses best accepted full-time CTC per learner.",
      ],
    ],
  );
}

function unplacedCsv(workspace: DetailedWorkspace) {
  return placementReportCsv(
    ["Student", "Branch"],
    workspace.details.unplaced.map((learner) => [
      learner.displayName,
      learner.departmentName,
    ]),
  );
}

function offersAcceptanceCsv(workspace: DetailedWorkspace) {
  const headings = [
    "Group",
    "Name",
    "Company",
    "Released offers",
    "Accepted",
    "Declined",
    "Withdrawn",
    "Outstanding",
    "Expired outstanding",
  ];

  const rows: CsvValue[][] = [];

  const groups = [
    {
      label: "Drive",
      rows: workspace.details.offers.byDrive,
    },
    {
      label: "Company",
      rows: workspace.details.offers.byCompany,
    },
  ];

  for (const group of groups) {
    for (const row of group.rows) {
      rows.push([
        group.label,
        row.label,
        row.companyName,
        row.released,
        row.accepted,
        row.declined,
        row.withdrawn,
        row.outstanding,
        row.expiredOutstanding,
      ]);
    }
  }

  const totals = workspace.details.offers.totals;
  rows.unshift([
    "Overall",
    "Selected reporting scope",
    "",
    totals.released,
    totals.accepted,
    totals.declined,
    totals.withdrawn,
    totals.outstanding,
    totals.expiredOutstanding,
  ]);

  rows.push([
    "Methodology",
    workspace.detailScopeNote,
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

function joiningStatusCsv(workspace: DetailedWorkspace) {
  const headings = [
    "Group",
    "Name",
    "Company",
    "Accepted offers",
    "Joined",
    "Deferred",
    "Did not join",
    "Pending or unrecorded",
  ];

  const rows: CsvValue[][] = [];

  for (const row of workspace.details.joining.byDrive) {
    rows.push([
      "Drive",
      row.label,
      row.companyName,
      row.accepted,
      row.joined,
      row.deferred,
      row.didNotJoin,
      row.pending,
    ]);
  }

  for (const row of workspace.details.joining.byCompany) {
    rows.push([
      "Company",
      row.label,
      row.companyName,
      row.accepted,
      row.joined,
      row.deferred,
      row.didNotJoin,
      row.pending,
    ]);
  }

  const totals = workspace.details.joining.totals;

  rows.unshift([
    "Overall",
    "Selected reporting scope",
    "",
    totals.accepted,
    totals.joined,
    totals.deferred,
    totals.didNotJoin,
    totals.pending,
  ]);

  rows.push([
    "Methodology",
    workspace.detailScopeNote,
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
function failureReasonsCsv(report: PlacementFailureReport) {
  const headings = [
    "Group",
    "Drive",
    "Company",
    "Outcome",
    "Recorded reason",
    "Count",
  ];

  const rows: CsvValue[][] = [
    [
      "Overall",
      "",
      "",
      "Recorded adverse events and decisions",
      "",
      report.total,
    ],
  ];

  for (const row of report.byReason) {
    rows.push([
      "Reason",
      "",
      "",
      FAILURE_KIND_LABELS[row.kind],
      row.reason,
      row.count,
    ]);
  }

  for (const row of report.byDrive) {
    rows.push([
      "Drive",
      row.jobTitle,
      row.companyName,
      FAILURE_KIND_LABELS[row.kind],
      row.reason,
      row.count,
    ]);
  }

  rows.push([
    "Methodology",
    "",
    "",
    "Counts represent persisted outcome records/events, not distinct learners",
    "Current rejected screenings and applied failed rounds; recorded withdrawal/decline transitions",
    "",
  ]);

  return placementReportCsv(headings, rows);
}

function leadsReportCsv(report: PlacementLeadsReport) {
  const headings = [
    "Group",
    "Name",
    "Leads",
    "Invites sent",
    "Invite clicks",
    "Recruiter accounts linked",
    "Company relationships linked",
    "Recruiter linkage rate (%)",
  ];

  const row = (
    group: string,
    label: string,
    values: PlacementLeadsReport["totals"],
  ): CsvValue[] => [
    group,
    label,
    values.leads,
    values.invited,
    values.inviteClicked,
    values.recruiterAccountsLinked,
    values.companyRelationshipsLinked,
    values.recruiterLinkRatePercent,
  ];

  const rows: CsvValue[][] = [
    row("Overall", "All college leads", report.totals),
    ...report.byStage.map((item) =>
      row("Manual stage", item.label, item),
    ),
    ...report.bySource.map((item) =>
      row("Source", item.label, item),
    ),
    [
      "Methodology",
      "College-wide CRM; season/drive filters do not apply",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
  ];

  return placementReportCsv(headings, rows);
}

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

    // Separate migrated-only evidence path: the normal report workspace
    // optionally touches staged registration persistence and is not a
    // suitable accreditation source.
    if(query.kind==="accreditation-students"){
      if(!hasMembershipRole(context,"TPO")||!query.batchId)
        throw new AuthorizationError("placements.manage");
      const studentReport=await getTpoAccreditationStudentExport(context,{
       collegeId,seasonId:query.seasonId,jobId:query.jobId,batchId:query.batchId,
      });
      return new Response("\uFEFF"+studentReport.csv,{
       headers:{"Content-Type":"text/csv; charset=utf-8",
        "Content-Disposition":'attachment; filename="naac-5.2.1-students.csv"',
        "Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff",Vary:"Cookie"},
      });
    }
    if (query.kind === "accreditation") {
      const accreditation = await getPlacementAccreditationReport(
        context,
        { collegeId, seasonId: query.seasonId, jobId: query.jobId },
      );
      return new Response("\uFEFF" + accreditation.csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="tpo-accreditation-evidence.csv"',
          "Cache-Control": "private, no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
          Vary: "Cookie",
        },
      });
    }

    const workspace = await getPlacementReportWorkspace(context, {
      collegeId,
      seasonId: query.seasonId,
      jobId: query.jobId,
    });

    let csv: string;
    let filename: string;

    switch (query.kind) {
      case "placement-summary":
        csv = placementSummaryCsv(workspace);
        filename = "tpo-placement-summary.csv";
        break;
      case "by-branch":
        csv = byBranchCsv(workspace);
        filename = "tpo-placement-by-branch.csv";
        break;
      case "by-company":
        csv = byCompanyCsv(workspace);
        filename = "tpo-placement-by-company.csv";
        break;
      case "failure-reasons": {
        const report = await getPlacementFailureReasonsReport(
          context,
          {
            collegeId,
            seasonId: query.seasonId,
            jobId: query.jobId,
          },
        );
        csv = failureReasonsCsv(report.failures);
        filename = "tpo-placement-failure-reasons.csv";
        break;
      }
      case "leads": {
        const report = await getPlacementLeadsReport(
          context,
          collegeId,
        );
        csv = leadsReportCsv(report.leads);
        filename = "tpo-recruiter-leads-report.csv";
        break;
      }
      default: {
        const detailed = await getPlacementReportDetails(
          context,
          {
            collegeId,
            seasonId: query.seasonId,
            jobId: query.jobId,
          },
          workspace,
        );

        switch (query.kind) {
          case "ctc":
            csv = ctcCsv(detailed);
            filename = "tpo-placement-ctc.csv";
            break;
          case "unplaced":
            csv = unplacedCsv(detailed);
            filename = "tpo-placement-unplaced.csv";
            break;
          case "offers-acceptance":
            csv = offersAcceptanceCsv(detailed);
            filename = "tpo-placement-offers-acceptance.csv";
            break;
          case "joining-status":
            csv = joiningStatusCsv(detailed);
            filename = "tpo-placement-joining-status.csv";
            break;
        }
      }
    }

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
