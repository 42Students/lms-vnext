/**
 * Pure placement reporting projections.
 *
 * Counts are intentionally calculated from distinct persisted entities:
 * - applications: distinct currently submitted application IDs
 * - offers: distinct issued offer IDs, including subsequently withdrawn offers
 * - accepted offers: offers whose CURRENT status is ACCEPTED
 * - placed learners: distinct learners holding an accepted offer
 * - packages: best accepted FULL_TIME annual CTC per learner
 *
 * Historical status transitions are not inferred from current status.
 * The registered pool reflects current batch registration choices, not a
 * historical snapshot of who registered during a particular season.
 */

export type PlacementReportJob = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  employmentType: string;
};

export type PlacementReportApplication = {
  id: string;
  jobId: string;
  membershipId: string;
  status: string;
  screeningStatus: string | null;
};

export type PlacementReportOffer = {
  id: string;
  jobId: string;
  membershipId: string;
  status: string;
  annualCtcInr: number | null;
  joiningStatus: string | null;
};

export type PlacementReportRegistration = {
  membershipId: string;
};

export type PlacementReportBranch = {
  membershipId: string;
  departmentId: string;
  departmentName: string;
};

export type PlacementReportFacts = {
  jobs: readonly PlacementReportJob[];
  applications: readonly PlacementReportApplication[];
  offers: readonly PlacementReportOffer[];
  registrations: readonly PlacementReportRegistration[];
  branches: readonly PlacementReportBranch[];
};

export type PlacementReportMetrics = {
  drives: number;
  registered: number;
  applicants: number;
  applications: number;
  shortlisted: number;
  rejected: number;
  offers: number;
  acceptedOffers: number;
  declinedOffers: number;
  withdrawnOffers: number;
  studentsAccepted: number;
  studentsPlaced: number;
  joined: number;
  deferred: number;
  didNotJoin: number;
  placementRatePercent: number | null;
  averagePackageInr: number | null;
  medianPackageInr: number | null;
  highestPackageInr: number | null;
};

export type PlacementReportBranchRow = {
  departmentId: string | null;
  departmentName: string;
  registered: number;
  applicants: number;
  applications: number;
  placed: number;
  offers: number;
  acceptedOffers: number;
  placementRatePercent: number | null;
  averagePackageInr: number | null;
  highestPackageInr: number | null;
};

export type PlacementReportDriveRow = {
  jobId: string;
  title: string;
  companyName: string;
  employmentType: string;
  applicants: number;
  applications: number;
  shortlisted: number;
  rejected: number;
  offers: number;
  acceptedOffers: number;
  placed: number;
};

export type PlacementReportCompanyRow = {
  companyId: string;
  companyName: string;
  drives: number;
  applicants: number;
  applications: number;
  offers: number;
  acceptedOffers: number;
  placed: number;
  averagePackageInr: number | null;
  highestPackageInr: number | null;
};

export type PlacementReportSummary = {
  metrics: PlacementReportMetrics;
  byBranch: PlacementReportBranchRow[];
  byDrive: PlacementReportDriveRow[];
  byCompany: PlacementReportCompanyRow[];
};

function distinct<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

function validPackages(
  values: readonly (number | null)[],
): number[] {
  return values.filter(
    (value): value is number =>
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0,
  );
}

function roundAverage(values: readonly number[]): number | null {
  if (values.length === 0) return null;

  return Math.round(
    values.reduce((total, value) => total + value, 0) /
      values.length,
  );
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 !== 0) {
    return sorted[middle]!;
  }

  return Math.round(
    (sorted[middle - 1]! + sorted[middle]!) / 2,
  );
}

function percentage(numerator: number, denominator: number) {
  return denominator === 0
    ? null
    : Math.round((numerator / denominator) * 100);
}

function bestAcceptedFullTimePackages(
  offers: readonly PlacementReportOffer[],
  jobsById: ReadonlyMap<string, PlacementReportJob>,
): number[] {
  const bestByLearner = new Map<string, number>();

  for (const offer of offers) {
    if (
      offer.status !== "ACCEPTED" ||
      jobsById.get(offer.jobId)?.employmentType !== "FULL_TIME"
    ) {
      continue;
    }

    const [amount] = validPackages([offer.annualCtcInr]);
    if (amount === undefined) continue;

    const previous = bestByLearner.get(offer.membershipId);

    if (previous === undefined || amount > previous) {
      bestByLearner.set(offer.membershipId, amount);
    }
  }

  return [...bestByLearner.values()];
}

export function summarizePlacementReports(
  input: PlacementReportFacts,
): PlacementReportSummary {
  const jobs = [...new Map(
    input.jobs.map((job) => [job.id, job]),
  ).values()];

  const jobsById = new Map(jobs.map((job) => [job.id, job]));

  const applications = [...new Map(
    input.applications
      .filter(
        (application) =>
          application.status === "SUBMITTED" &&
          jobsById.has(application.jobId),
      )
      .map((application) => [application.id, application]),
  ).values()];

  /*
   * The service supplies offers from the selected jobs and same-college
   * memberships. This additional check ensures a pure-model caller cannot
   * attach an offer to a job omitted from the selected report.
   */
  const offers = [...new Map(
    input.offers
      .filter((offer) => jobsById.has(offer.jobId))
      .map((offer) => [offer.id, offer]),
  ).values()];

  const registrations = distinct(
    input.registrations.map((registration) => registration.membershipId),
  );

  const branchByLearner = new Map<
    string,
    PlacementReportBranch
  >();

  for (const branch of input.branches) {
    if (!branchByLearner.has(branch.membershipId)) {
      branchByLearner.set(branch.membershipId, branch);
    }
  }

  const accepted = offers.filter(
    (offer) => offer.status === "ACCEPTED",
  );

  const packages = bestAcceptedFullTimePackages(
    accepted,
    jobsById,
  );

  const studentsPlaced = distinct(
    accepted.map((offer) => offer.membershipId),
  );

  const applicants = distinct(
    applications.map((application) => application.membershipId),
  );

  const metrics: PlacementReportMetrics = {
    drives: jobs.length,
    registered: registrations.length,
    applicants: applicants.length,
    applications: applications.length,
    shortlisted: applications.filter(
      (application) => application.screeningStatus === "SHORTLISTED",
    ).length,
    rejected: applications.filter(
      (application) => application.screeningStatus === "REJECTED",
    ).length,
    offers: offers.length,
    acceptedOffers: accepted.length,
    declinedOffers: offers.filter(
      (offer) => offer.status === "DECLINED",
    ).length,
    withdrawnOffers: offers.filter(
      (offer) => offer.status === "WITHDRAWN",
    ).length,
    studentsAccepted: studentsPlaced.length,
    studentsPlaced: studentsPlaced.length,
    joined: accepted.filter(
      (offer) => offer.joiningStatus === "JOINED",
    ).length,
    deferred: accepted.filter(
      (offer) => offer.joiningStatus === "DEFERRED",
    ).length,
    didNotJoin: accepted.filter(
      (offer) => offer.joiningStatus === "DID_NOT_JOIN",
    ).length,
    placementRatePercent: percentage(
      studentsPlaced.length,
      registrations.length,
    ),
    averagePackageInr: roundAverage(packages),
    medianPackageInr: median(packages),
    highestPackageInr:
      packages.length === 0 ? null : Math.max(...packages),
  };

  const branchKey = (membershipId: string) =>
    branchByLearner.get(membershipId)?.departmentId ?? "";

  const branchRows = new Map<
    string,
    PlacementReportBranchRow
  >();

  const ensureBranch = (membershipId: string) => {
    const branch = branchByLearner.get(membershipId);
    const key = branch?.departmentId ?? "";
    const existing = branchRows.get(key);

    if (existing) return existing;

    const created: PlacementReportBranchRow = {
      departmentId: branch?.departmentId ?? null,
      departmentName: branch?.departmentName ?? "Unassigned branch",
      registered: 0,
      applicants: 0,
      applications: 0,
      placed: 0,
      offers: 0,
      acceptedOffers: 0,
      placementRatePercent: null,
      averagePackageInr: null,
      highestPackageInr: null,
    };

    branchRows.set(key, created);
    return created;
  };

  for (const registration of registrations) {
    ensureBranch(registration).registered += 1;
  }

  for (const learner of applicants) {
    ensureBranch(learner).applicants += 1;
  }

  for (const application of applications) {
    ensureBranch(application.membershipId).applications += 1;
  }

  for (const learner of studentsPlaced) {
    ensureBranch(learner).placed += 1;
  }

  for (const offer of offers) {
    ensureBranch(offer.membershipId).offers += 1;

    if (offer.status === "ACCEPTED") {
      ensureBranch(offer.membershipId).acceptedOffers += 1;
    }
  }

  const byBranch = [...branchRows.values()]
    .map((row) => {
      const branchPackages = bestAcceptedFullTimePackages(
        accepted.filter(
          (offer) =>
            branchKey(offer.membershipId) ===
            (row.departmentId ?? ""),
        ),
        jobsById,
      );

      return {
        ...row,
        placementRatePercent: percentage(row.placed, row.registered),
        averagePackageInr: roundAverage(branchPackages),
        highestPackageInr:
          branchPackages.length === 0
            ? null
            : Math.max(...branchPackages),
      };
    })
    .sort(
      (left, right) =>
        left.departmentName.localeCompare(right.departmentName) ||
        (left.departmentId ?? "").localeCompare(
          right.departmentId ?? "",
        ),
    );

  const byDrive: PlacementReportDriveRow[] = jobs.map((job) => {
    const jobApplications = applications.filter(
      (application) => application.jobId === job.id,
    );
    const jobOffers = offers.filter(
      (offer) => offer.jobId === job.id,
    );

    return {
      jobId: job.id,
      title: job.title,
      companyName: job.companyName,
      employmentType: job.employmentType,
      applicants: distinct(
        jobApplications.map((application) => application.membershipId),
      ).length,
      applications: jobApplications.length,
      shortlisted: jobApplications.filter(
        (application) => application.screeningStatus === "SHORTLISTED",
      ).length,
      rejected: jobApplications.filter(
        (application) => application.screeningStatus === "REJECTED",
      ).length,
      offers: jobOffers.length,
      acceptedOffers: jobOffers.filter(
        (offer) => offer.status === "ACCEPTED",
      ).length,
      placed: distinct(
        jobOffers
          .filter((offer) => offer.status === "ACCEPTED")
          .map((offer) => offer.membershipId),
      ).length,
    };
  });

  const byCompany: PlacementReportCompanyRow[] = [
    ...new Map(
      jobs.map((job) => [
        job.companyId,
        {
          companyId: job.companyId,
          companyName: job.companyName,
        },
      ]),
    ).values(),
  ]
    .map((company) => {
      const companyJobs = jobs.filter(
        (job) => job.companyId === company.companyId,
      );
      const jobIds = new Set(companyJobs.map((job) => job.id));
      const companyApplications = applications.filter(
        (application) => jobIds.has(application.jobId),
      );
      const companyOffers = offers.filter(
        (offer) => jobIds.has(offer.jobId),
      );
      const companyAccepted = companyOffers.filter(
        (offer) => offer.status === "ACCEPTED",
      );
      const companyPackages = bestAcceptedFullTimePackages(
        companyAccepted,
        jobsById,
      );

      return {
        ...company,
        drives: companyJobs.length,
        applicants: distinct(
          companyApplications.map(
            (application) => application.membershipId,
          ),
        ).length,
        applications: companyApplications.length,
        offers: companyOffers.length,
        acceptedOffers: companyAccepted.length,
        placed: distinct(
          companyAccepted.map((offer) => offer.membershipId),
        ).length,
        averagePackageInr: roundAverage(companyPackages),
        highestPackageInr:
          companyPackages.length === 0
            ? null
            : Math.max(...companyPackages),
      };
    })
    .sort(
      (left, right) =>
        left.companyName.localeCompare(right.companyName) ||
        left.companyId.localeCompare(right.companyId),
    );

  return { metrics, byBranch, byDrive, byCompany };
}

/**
 * Quote every CSV cell and prefix untrusted spreadsheet-formula values.
 * Applies to learner-, company-, branch- and job-authored text alike.
 */
export function placementReportCsvCell(
  value: string | number | null | undefined,
): string {
  const raw = String(value ?? "");
  const neutralized = /^\s*[=+\-@\t\r]/.test(raw)
    ? `'${raw}`
    : raw;

  return `"${neutralized.replaceAll('"', '""')}"`;
}

export function placementReportCsv(
  headings: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
): string {
  return [headings, ...rows]
    .map((row) => row.map(placementReportCsvCell).join(","))
    .join("\r\n");
}
