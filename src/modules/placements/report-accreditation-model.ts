import {
  placementReportCsv,
  summarizePlacementReports,
  type PlacementReportFacts,
} from "./report-model";

/**
 * Evidence-only accreditation worksheet. No guessed graduating
 * cohort denominator, historical registration pool or statutory
 * NAAC/NIRF column mapping is supplied.
 */
export type AccreditationFacts = Pick<
  PlacementReportFacts,
  "jobs" | "applications" | "offers" | "branches"
>;

export type AccreditationPeriod = {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
} | null;

export type AccreditationRow = readonly (
  string | number | null
)[];

export const ACCREDITATION_CSV_HEADINGS = [
  "Section",
  "Placement season",
  "Season start",
  "Season end",
  "Dimension",
  "Drives",
  "Distinct applicants",
  "Application records",
  "Offer records",
  "Currently accepted offers",
  "Distinct placed learners",
  "Average best accepted full-time CTC (INR)",
  "Highest best accepted full-time CTC (INR)",
  "Graduating / eligible learner denominator",
  "Accreditation placement rate (%)",
  "Evidence / limitation",
] as const;

export const ACCREDITATION_LIMITATIONS = [
  "Not an official NAAC or NIRF template; validate required institution/year/discipline columns independently.",
  "Graduating student totals and season-frozen eligible cohorts are unavailable from this export. Denominators and statutory placement rates remain blank.",
  "Only persisted in-app placement jobs, applications and offers are counted. External offers and unregistered placement-pool choices are not inferred.",
  "Placed learners are distinct memberships holding a currently ACCEPTED offer, not confirmed joiners or an immutable historical placement cohort.",
  "Branch attribution uses a learner's current or most recent recorded programme, not a placement-time historical snapshot.",
  "Compensation uses the best known annual full-time CTC per placed learner; unknown and non-full-time packages do not contribute to the average.",
] as const;

export function buildAccreditationExport(
  period: AccreditationPeriod,
  facts: AccreditationFacts,
) {
  const baseReport = summarizePlacementReports({
    ...facts,
    registrations: [],
  });
  // Without a certified graduating-cohort denominator, zero is not a
  // meaningful placement rate. Do not report 0% as an observed outcome.
  const report = {...baseReport, metrics: {
    ...baseReport.metrics, placementRatePercent: null,
    placementRateOneDecimal: null,
  }};
  const rows: AccreditationRow[] = [];
  const issues: string[] = [...ACCREDITATION_LIMITATIONS];
  const seasonName = period?.name ?? "";
  const start = period?.startDate ?? "";
  const end = period?.endDate ?? "";
  const selectedIds = new Set([
    ...facts.applications.map((item) => item.membershipId),
    ...facts.offers.map((item) => item.membershipId),
  ]);
  const mappedIds = new Set(facts.branches.map((item) => item.membershipId));
  const missingBranches = [...selectedIds].filter(
    (id) => !mappedIds.has(id),
  ).length;

  if (!period) {
    issues.unshift("No placement season exists for this college; no outcome totals can be certified.");
  } else {
    if (facts.jobs.length === 0) {
      issues.unshift("This placement season has no non-archived drives in the selected filter.");
    }
    if (missingBranches > 0) {
      issues.unshift(
        String(missingBranches) +
          " distinct learners with applications/offers lack an attributable programme/branch.",
      );
    }

    const overall = report.metrics;
    rows.push([
      "Overall", seasonName, start, end, "Selected placement scope",
      overall.drives, overall.applicants, overall.applications,
      overall.offers, overall.acceptedOffers, overall.studentsPlaced,
      overall.averagePackageInr, overall.highestPackageInr,
      null, null, "Observed in-app placement outcomes only",
    ]);

    for (const branch of report.byBranch) {
      rows.push([
        "Branch", seasonName, start, end, branch.departmentName,
        null, branch.applicants, branch.applications,
        branch.offers, branch.acceptedOffers, branch.placed,
        branch.averagePackageInr, branch.highestPackageInr,
        null, null, "Programme attribution is not a placement-time snapshot",
      ]);
    }

    for (const company of report.byCompany) {
      rows.push([
        "Company", seasonName, start, end, company.companyName,
        company.drives, company.applicants, company.applications,
        company.offers, company.acceptedOffers, company.placed,
        company.averagePackageInr, company.highestPackageInr,
        null, null, "Company placed-learner totals can overlap across employers",
      ]);
    }
  }

  for (const issue of issues) {
    rows.push([
      "Completeness warning", seasonName, start, end, issue,
      null, null, null, null, null, null, null, null,
      null, null, "Not certified",
    ]);
  }

  return {
    rows,
    issues,
    report,
    missingBranches,
    seasonName: period?.name ?? null,
    csv: placementReportCsv(ACCREDITATION_CSV_HEADINGS, rows),
  };
}
