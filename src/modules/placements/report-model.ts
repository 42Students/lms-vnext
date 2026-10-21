/**
 * Pure placement reporting projections.
 *
 * Counts are intentionally calculated from distinct persisted entities:
 * - applications: distinct currently submitted application IDs
 * - offers: distinct issued offer IDs, including subsequently withdrawn offers
 * - accepted offers: offers whose CURRENT status is ACCEPTED
 * - placed learners: distinct learners with accepted FULL_TIME offers
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
  status?: string;
  jobTypeLabel?: string|null;
  countsAsPlaced?: boolean;
};

export type PlacementReportApplication = {
  id: string;
  jobId: string;
  membershipId: string;
  status: string;
  screeningStatus: string | null;
  submittedAt?: Date | null;
};

export type PlacementReportStageHistory = {
  applicationId: string;
  fromStage: string | null;
  toStage: string;
  movedAt: Date;
};

export type PlacementReportHistoricalFunnel = {
  /** Null means that no audited transition ledger was provided. */
  evidence: "AUDITED" | "UNAVAILABLE";
  applied: number;
  shortlisted: number | null;
  assessment: number | null;
  interview: number | null;
  offered: number | null;
  rejected: number | null;
  hired: number | null;
  avgTimeToShortlistMs: number | null;
};

export type PlacementReportOffer = {
  id: string;
  jobId: string;
  membershipId: string;
  status: string;
  releasedAt?: Date | null;
  annualCtcInr: number | null;
  joiningStatus: string | null;
  kind?: string;
};

export type PlacementReportSelection = {
  jobId: string;
  membershipId: string;
  status: string;
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
  /** Source-of-truth college rule; absence preserves acceptance-only for pure callers. */
  countsAsPlacedAt?: "SELECTED" | "OFFER_RELEASED" | "OFFER_ACCEPTED";
  jobs: readonly PlacementReportJob[];
  applications: readonly PlacementReportApplication[];
  /** Real stage transitions; absent means the historical funnel is unknown. */
  stageHistory?: readonly PlacementReportStageHistory[];
  offers: readonly PlacementReportOffer[];
  /** Current selected/verified/released ledger, separate from offers. */
  selections?: readonly PlacementReportSelection[];
  registrations: readonly PlacementReportRegistration[];
  branches: readonly PlacementReportBranch[];
};

export type PlacementReportMetrics = {
  drives: number;
  liveDrives?: number | null;
  registered: number;
  applicants: number;
  applications: number;
  shortlisted: number;
  rejected: number;
  offers: number;
  activeReleasedOffers?: number | null;
  acceptedOffers: number;
  declinedOffers: number;
  withdrawnOffers: number;
  studentsAccepted: number;
  studentsAcceptedAnyType?: number;
  studentsPlaced: number;
  joined: number;
  deferred: number;
  didNotJoin: number;
  placementRatePercent: number | null;
  placementRateOneDecimal?: number | null;
  studentsWithPackage?: number;
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
  jobTypeLabel?:string|null;
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
  historicalFunnel: PlacementReportHistoricalFunnel;
  byBranch: PlacementReportBranchRow[];
  byDrive: PlacementReportDriveRow[];
  byCompany: PlacementReportCompanyRow[];
};

function groupPlacementRowsByJob<T extends { jobId: string }>(
  rows: readonly T[],
): Map<string, T[]> {
  const byJob = new Map<string, T[]>();
  for (const row of rows) {
    const existing = byJob.get(row.jobId);
    if (existing) existing.push(row);
    else byJob.set(row.jobId, [row]);
  }
  return byJob;
}

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
      value > 0,
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

/** Legacy TPO placement rate uses one decimal and reports 0 for an empty registered pool. */
function percentage(numerator: number, denominator: number): number {
  return denominator === 0
    ? 0
    : Math.round((numerator / denominator) * 1000) / 10;
}

function bestAcceptedFullTimePackages(
  offers: readonly PlacementReportOffer[],
  jobsById: ReadonlyMap<string, PlacementReportJob>,
): number[] {
  const bestByLearner = new Map<string, number>();

  for (const offer of offers) {
    if (
      offer.status !== "ACCEPTED" ||
      (offer.kind ?? "OFFER") !== "OFFER" ||
      (jobsById.get(offer.jobId)?.countsAsPlaced ??
        (jobsById.get(offer.jobId)?.employmentType === "FULL_TIME")) === false
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

/** P-S2-08: SELECTED requires separate selected-outcome evidence. Never
 * infer selection from mere screening/shortlisting; missing signal fails closed. */
export function countsAsPlacedByCollegeRule(input: {
  employmentType: string;
  countsAsPlaced?: boolean;
  offerStatus: string;
  offerKind?: string;
  releasedAt?: Date | null;
  countsAsPlacedAt: "SELECTED" | "OFFER_RELEASED" | "OFFER_ACCEPTED";
  selectedOutcome?: boolean;
}): boolean {
  if (!(input.countsAsPlaced ?? (input.employmentType === "FULL_TIME"))) return false;
  if (input.countsAsPlacedAt === "SELECTED") return input.selectedOutcome === true;
  if ((input.offerKind ?? "OFFER") !== "OFFER") return false;
  if (input.countsAsPlacedAt === "OFFER_RELEASED") {
    return input.releasedAt instanceof Date &&
      Number.isFinite(input.releasedAt.getTime()) &&
      (input.offerStatus === "ISSUED" || input.offerStatus === "ACCEPTED");
  }
  return input.offerStatus === "ACCEPTED";
}

/**
 * Legacy job funnel numbers mean that an application EVER reached a stage,
 * unlike the current-state screening totals. Do not infer missed stages from
 * today's status or treat a missing history ledger as a valid zero count.
 */
export function summarizePlacementHistoricalFunnel(
  input: PlacementReportFacts,
): PlacementReportHistoricalFunnel {
  const knownJobs = new Set(input.jobs.map((job) => job.id));
  const applications = new Map<string, PlacementReportApplication>(input.applications
    .filter((application) => knownJobs.has(application.jobId))
    .map((application) => [application.id, application] as const));
  if (input.stageHistory === undefined) {
    return {
      evidence: "UNAVAILABLE", applied: applications.size,
      shortlisted: null, assessment: null, interview: null,
      offered: null, rejected: null, hired: null,
      avgTimeToShortlistMs: null,
    };
  }
  const historyByApplication = new Map<string, Set<string>>();
  const firstShortlistAt = new Map<string, number>();
  for (const event of input.stageHistory) {
    const application = applications.get(event.applicationId);
    if (!application) continue;
    const stages = historyByApplication.get(event.applicationId) ?? new Set<string>();
    if (event.fromStage) stages.add(event.fromStage);
    stages.add(event.toStage);
    historyByApplication.set(event.applicationId, stages);
    if (event.toStage === "SHORTLISTED" && Number.isFinite(event.movedAt.getTime())) {
      const timestamp = event.movedAt.getTime();
      const previous = firstShortlistAt.get(event.applicationId);
      if (previous === undefined || timestamp < previous) {
        firstShortlistAt.set(event.applicationId, timestamp);
      }
    }
  }
  const stageCount = (stage: string) =>
    [...historyByApplication.values()].filter((stages) => stages.has(stage)).length;
  const shortlistDurations: number[] = [];
  for (const [applicationId, shortlistedAt] of firstShortlistAt) {
    const submittedAt = applications.get(applicationId)?.submittedAt?.getTime();
    if (submittedAt !== undefined && Number.isFinite(submittedAt) &&
      shortlistedAt >= submittedAt) shortlistDurations.push(shortlistedAt - submittedAt);
  }
  return {
    evidence: "AUDITED",
    applied: applications.size,
    shortlisted: stageCount("SHORTLISTED"),
    assessment: stageCount("ASSESSMENT"),
    interview: stageCount("INTERVIEW"),
    offered: stageCount("OFFERED"),
    rejected: stageCount("REJECTED"),
    hired: stageCount("HIRED"),
    avgTimeToShortlistMs: shortlistDurations.length
      ? Math.round(shortlistDurations.reduce((sum, duration) => sum + duration, 0) /
        shortlistDurations.length)
      : null,
  };
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

  // Index the scoped facts once; repeatedly filtering all applications for
  // every drive/employer makes a 1,000-drive campus report quadratic.
  const applicationsByJob = groupPlacementRowsByJob(applications);
  const offersByJob = groupPlacementRowsByJob(offers);
  const selections = [...new Map(
    (input.selections ?? [])
      .filter((item) => jobsById.has(item.jobId) &&
        (item.status === "SELECTED" ||
         item.status === "VERIFIED" ||
         item.status === "RELEASED"))
      .map((item) => [item.jobId + ":" + item.membershipId, item]),
  ).values()].filter((item) => {
    const job = jobsById.get(item.jobId)!;
    return job.countsAsPlaced ?? (job.employmentType === "FULL_TIME");
  });
  const selectionsByJob = groupPlacementRowsByJob(selections);
  const jobsByCompany = new Map<string, PlacementReportJob[]>();
  for (const job of jobs) {
    const existing = jobsByCompany.get(job.companyId);
    if (existing) existing.push(job);
    else jobsByCompany.set(job.companyId, [job]);
  }

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

  const countsAt = input.countsAsPlacedAt ?? "OFFER_ACCEPTED";
  const offerCounts = (offer: PlacementReportOffer) => countsAsPlacedByCollegeRule({
    employmentType: jobsById.get(offer.jobId)?.employmentType ?? "",
    countsAsPlaced: jobsById.get(offer.jobId)?.countsAsPlaced,
    offerStatus: offer.status,
    offerKind: offer.kind,
    releasedAt: offer.releasedAt,
    countsAsPlacedAt: countsAt,
  });
  const studentsPlaced = distinct(countsAt === "SELECTED"
    ? selections.map((item) => item.membershipId)
    : offers.filter(offerCounts).map((offer) => offer.membershipId));

  const applicants = distinct(
    applications.map((application) => application.membershipId),
  );
  const placementRateOneDecimal=percentage(studentsPlaced.length,registrations.length);
  // A monotonic historical funnel requires audited stage transitions,
  // not the final/current application screening snapshot.
  const liveDrives=jobs.every(job=>job.status!==undefined)
    ?jobs.filter(job=>job.status==="PUBLISHED").length:null;

  const metrics: PlacementReportMetrics = {
    drives: jobs.length,
    liveDrives,
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
    activeReleasedOffers:offers.some(offer=>offer.releasedAt===undefined)
      ?null:offers.filter(offer=>offer.releasedAt!=null &&
        (offer.status==="ISSUED"||offer.status==="ACCEPTED")).length,
    acceptedOffers: accepted.length,
    declinedOffers: offers.filter(
      (offer) => offer.status === "DECLINED",
    ).length,
    withdrawnOffers: offers.filter(
      (offer) => offer.status === "WITHDRAWN",
    ).length,
    studentsAccepted: distinct(accepted.filter((offer) =>
      jobsById.get(offer.jobId)?.countsAsPlaced ??
        (jobsById.get(offer.jobId)?.employmentType === "FULL_TIME"),
    ).map((offer) => offer.membershipId)).length,
    studentsAcceptedAnyType:distinct(accepted.map(offer=>offer.membershipId)).length,
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
    placementRateOneDecimal,
    studentsWithPackage: packages.length,
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
    const jobApplications = applicationsByJob.get(job.id) ?? [];
    const jobOffers = offersByJob.get(job.id) ?? [];

    return {
      jobId: job.id,
      title: job.title,
      companyName: job.companyName,
      employmentType: job.employmentType,
      jobTypeLabel:job.jobTypeLabel,
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
      placed: distinct(countsAt === "SELECTED"
        ? (selectionsByJob.get(job.id) ?? []).map((item) => item.membershipId)
        : jobOffers.filter(offerCounts).map((offer) => offer.membershipId)).length,
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
      const companyJobs = jobsByCompany.get(company.companyId) ?? [];
      const companyApplications = companyJobs.flatMap(
        (job) => applicationsByJob.get(job.id) ?? [],
      );
      const companyOffers = companyJobs.flatMap(
        (job) => offersByJob.get(job.id) ?? [],
      );
      const companyAccepted = companyOffers.filter(
        (offer) => offer.status === "ACCEPTED",
      );
      const companySelections = companyJobs.flatMap(
        (job) => selectionsByJob.get(job.id) ?? [],
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
        placed: distinct(countsAt === "SELECTED"
          ? companySelections.map((item) => item.membershipId)
          : companyOffers.filter(offerCounts).map((offer) => offer.membershipId)).length,
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

  return {
    metrics, byBranch, byDrive, byCompany,
    historicalFunnel: summarizePlacementHistoricalFunnel(input),
  };
}

/**
 * Quote every CSV cell and prefix untrusted spreadsheet-formula values.
 * Applies to learner-, company-, branch- and job-authored text alike.
 */
export function placementReportCsvCell(
  value: string | number | null | undefined,
): string {
  const raw = String(value ?? "");
  // A spreadsheet may ignore leading format, combining and control marks
  // before evaluating a formula. Neutralize those prefixes as well as ASCII.
  const neutralized = /^[\s\p{Cc}\p{Cf}\p{Mn}\p{Me}]*[=+\-@]/u.test(raw)
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

/**
 * Additional persisted-data reporting projections. These do not change the
 * existing placement-summary semantics or its exported result shape.
 */
export type PlacementReportPoolLearner = {
  membershipId: string;
  displayName: string;
  departmentId: string | null;
  departmentName: string;
};

export type PlacementReportDetailedSelection = {
  membershipId: string;
  status: string;
  employmentType: string;
  countsAsPlaced: boolean | null;
};

export type PlacementReportDetailedOffer = {
  countsAsPlaced?: boolean;
  id: string;
  membershipId: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  employmentType: string;
  status: string;
  kind?: string;
  annualCtcInr: number | null;
  releasedAt?: Date | null;
  expiresAt: string | null;
  joiningStatus: string | null;
};

export type PlacementOfferFunnelCounts = {
  released: number;
  outstanding: number;
  expiredOutstanding: number;
  accepted: number;
  declined: number;
  withdrawn: number;
};

export type PlacementJoiningCounts = {
  accepted: number;
  pending: number;
  joined: number;
  deferred: number;
  didNotJoin: number;
};

export type PlacementReportOfferFunnelRow = PlacementOfferFunnelCounts & {
  id: string;
  label: string;
  companyName: string;
};

export type PlacementReportJoiningRow = PlacementJoiningCounts & {
  id: string;
  label: string;
  companyName: string;
};

export type PlacementReportCtcBand = {
  label: string;
  minimumInr: number;
  maximumExclusiveInr: number | null;
  offers: number;
};

export type PlacementReportDetails = {
  unplaced: PlacementReportPoolLearner[];
  ctc: {
    acceptedFullTimeOffers: number;
    knownCtcOffers: number;
    unknownCtcOffers: number;
    averageInr: number | null;
    medianInr: number | null;
    highestInr: number | null;
    bands: PlacementReportCtcBand[];
  };
  offers: {
    totals: PlacementOfferFunnelCounts;
    byDrive: PlacementReportOfferFunnelRow[];
    byCompany: PlacementReportOfferFunnelRow[];
  };
  joining: {
    totals: PlacementJoiningCounts;
    byDrive: PlacementReportJoiningRow[];
    byCompany: PlacementReportJoiningRow[];
  };
};

function emptyOfferFunnel(): PlacementOfferFunnelCounts {
  return {
    released: 0,
    outstanding: 0,
    expiredOutstanding: 0,
    accepted: 0,
    declined: 0,
    withdrawn: 0,
  };
}

function emptyJoiningCounts(): PlacementJoiningCounts {
  return {
    accepted: 0,
    pending: 0,
    joined: 0,
    deferred: 0,
    didNotJoin: 0,
  };
}

function countOffer(
  target: PlacementOfferFunnelCounts,
  offer: PlacementReportDetailedOffer,
  asOfMs: number,
) {
  // A released offer remains a persisted offer after its final transition.
  target.released += 1;

  switch (offer.status) {
    case "ACCEPTED":
      target.accepted += 1;
      break;
    case "DECLINED":
      target.declined += 1;
      break;
    case "WITHDRAWN":
      target.withdrawn += 1;
      break;
    case "ISSUED": {
      // Expired is a derived view of an outstanding ISSUED offer, not
      // another persisted offer status. The reporting clock is supplied
      // by the server; no clock is read during React rendering.
      const expiryMs = offer.expiresAt
        ? Date.parse(offer.expiresAt)
        : Number.NaN;

      if (Number.isFinite(expiryMs) && expiryMs <= asOfMs) {
        target.expiredOutstanding += 1;
      } else {
        target.outstanding += 1;
      }
      break;
    }
  }
}

function countJoining(
  target: PlacementJoiningCounts,
  offer: PlacementReportDetailedOffer,
) {
  if (offer.status !== "ACCEPTED") return;

  target.accepted += 1;

  switch (offer.joiningStatus) {
    case "JOINED":
      target.joined += 1;
      break;
    case "DEFERRED":
      target.deferred += 1;
      break;
    case "DID_NOT_JOIN":
      target.didNotJoin += 1;
      break;
    default:
      // A missing outcome row is not evidence of joining.
      target.pending += 1;
  }
}

export function summarizePlacementReportDetails(input: {
  registeredLearners: readonly PlacementReportPoolLearner[];
  offers: readonly PlacementReportDetailedOffer[];
  selections?: readonly PlacementReportDetailedSelection[];
  countsAsPlacedAt?: "SELECTED" | "OFFER_RELEASED" | "OFFER_ACCEPTED";
  asOf: string;
}): PlacementReportDetails {
  const asOfMs = Date.parse(input.asOf);

  if (!Number.isFinite(asOfMs)) {
    throw new Error("Invalid placement report as-of date");
  }

  const registeredLearners = [
    ...new Map(
      input.registeredLearners.map((learner) => [
        learner.membershipId,
        learner,
      ]),
    ).values(),
  ];

  const offers = [
    ...new Map(
      input.offers.map((offer) => [offer.id, offer]),
    ).values(),
  ];

  const placedMemberships = new Set(
    input.countsAsPlacedAt === "SELECTED"
      ? (input.selections ?? [])
          .filter((selection) =>
            (selection.status === "SELECTED" ||
              selection.status === "VERIFIED" ||
              selection.status === "RELEASED") &&
            (selection.countsAsPlaced ??
              (selection.employmentType === "FULL_TIME")))
          .map((selection) => selection.membershipId)
      : offers
          .filter((offer) => countsAsPlacedByCollegeRule({
            employmentType: offer.employmentType,
            countsAsPlaced: offer.countsAsPlaced,
            offerStatus: offer.status,
            offerKind: offer.kind,
            releasedAt: offer.releasedAt,
            countsAsPlacedAt: input.countsAsPlacedAt ?? "OFFER_ACCEPTED",
          }))
          .map((offer) => offer.membershipId),
  );

  const unplaced = registeredLearners
    .filter((learner) => !placedMemberships.has(learner.membershipId))
    .sort(
      (left, right) =>
        left.departmentName.localeCompare(right.departmentName) ||
        left.displayName.localeCompare(right.displayName) ||
        left.membershipId.localeCompare(right.membershipId),
    );

  // This distribution counts accepted full-time OFFER records, not the
  // best offer per learner used by the existing Placement Summary.
  const acceptedFullTime = offers.filter(
    (offer) =>
      offer.status === "ACCEPTED" &&
      (offer.kind ?? "OFFER") === "OFFER" &&
      (offer.countsAsPlaced ?? (offer.employmentType === "FULL_TIME")),
  );

  const knownCtc = acceptedFullTime
    .map((offer) => offer.annualCtcInr)
    .filter(
      (value): value is number =>
        value !== null &&
        Number.isFinite(value) &&
        value > 0,
    );

  const bands: PlacementReportCtcBand[] = [
    {
      label: "Below ₹3 lakh",
      minimumInr: 0,
      maximumExclusiveInr: 300_000,
      offers: 0,
    },
    {
      label: "₹3–6 lakh",
      minimumInr: 300_000,
      maximumExclusiveInr: 600_000,
      offers: 0,
    },
    {
      label: "₹6–10 lakh",
      minimumInr: 600_000,
      maximumExclusiveInr: 1_000_000,
      offers: 0,
    },
    {
      label: "₹10–20 lakh",
      minimumInr: 1_000_000,
      maximumExclusiveInr: 2_000_000,
      offers: 0,
    },
    {
      label: "₹20 lakh and above",
      minimumInr: 2_000_000,
      maximumExclusiveInr: null,
      offers: 0,
    },
  ];

  for (const amount of knownCtc) {
    const band = bands.find(
      (candidate) =>
        amount >= candidate.minimumInr &&
        (candidate.maximumExclusiveInr === null ||
          amount < candidate.maximumExclusiveInr),
    );

    if (band) band.offers += 1;
  }

  const offerTotals = emptyOfferFunnel();
  const joiningTotals = emptyJoiningCounts();

  const offerByDrive = new Map<string, PlacementReportOfferFunnelRow>();
  const offerByCompany = new Map<string, PlacementReportOfferFunnelRow>();
  const joiningByDrive = new Map<string, PlacementReportJoiningRow>();
  const joiningByCompany = new Map<string, PlacementReportJoiningRow>();

  for (const offer of offers) {
    countOffer(offerTotals, offer, asOfMs);
    countJoining(joiningTotals, offer);

    let driveOffers = offerByDrive.get(offer.jobId);
    if (!driveOffers) {
      driveOffers = {
        id: offer.jobId,
        label: offer.jobTitle,
        companyName: offer.companyName,
        ...emptyOfferFunnel(),
      };
      offerByDrive.set(offer.jobId, driveOffers);
    }
    countOffer(driveOffers, offer, asOfMs);

    let companyOffers = offerByCompany.get(offer.companyId);
    if (!companyOffers) {
      companyOffers = {
        id: offer.companyId,
        label: offer.companyName,
        companyName: offer.companyName,
        ...emptyOfferFunnel(),
      };
      offerByCompany.set(offer.companyId, companyOffers);
    }
    countOffer(companyOffers, offer, asOfMs);

    if (offer.status !== "ACCEPTED") continue;

    let driveJoining = joiningByDrive.get(offer.jobId);
    if (!driveJoining) {
      driveJoining = {
        id: offer.jobId,
        label: offer.jobTitle,
        companyName: offer.companyName,
        ...emptyJoiningCounts(),
      };
      joiningByDrive.set(offer.jobId, driveJoining);
    }
    countJoining(driveJoining, offer);

    let companyJoining = joiningByCompany.get(offer.companyId);
    if (!companyJoining) {
      companyJoining = {
        id: offer.companyId,
        label: offer.companyName,
        companyName: offer.companyName,
        ...emptyJoiningCounts(),
      };
      joiningByCompany.set(offer.companyId, companyJoining);
    }
    countJoining(companyJoining, offer);
  }

  const byLabel = <
    T extends { label: string; id: string },
  >(rows: Map<string, T>) =>
    [...rows.values()].sort(
      (left, right) =>
        left.label.localeCompare(right.label) ||
        left.id.localeCompare(right.id),
    );

  return {
    unplaced,
    ctc: {
      acceptedFullTimeOffers: acceptedFullTime.length,
      knownCtcOffers: knownCtc.length,
      unknownCtcOffers: acceptedFullTime.length - knownCtc.length,
      averageInr: roundAverage(knownCtc),
      medianInr: median(knownCtc),
      highestInr:
        knownCtc.length > 0 ? Math.max(...knownCtc) : null,
      bands,
    },
    offers: {
      totals: offerTotals,
      byDrive: byLabel(offerByDrive),
      byCompany: byLabel(offerByCompany),
    },
    joining: {
      totals: joiningTotals,
      byDrive: byLabel(joiningByDrive),
      byCompany: byLabel(joiningByCompany),
    },
  };
}
