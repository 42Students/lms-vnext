import { z } from "zod";

export const recruiterCompanyReportsQuerySchema = z
  .object({
    collegeId: z.string().uuid().optional(),
    status: z
      .enum(["ALL", "PUBLISHED", "CLOSED"])
      .default("ALL"),
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(10000)
      .default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .default(25),
  })
  .strict();

export type RecruiterCompanyReportsQuery = z.infer<
  typeof recruiterCompanyReportsQuerySchema
>;

export type RecruiterReportJob = {
  id: string;
  title: string;
  status: string;
  employmentType: string;
  publishedAt: Date | null;
  closedAt: Date | null;
};

export type RecruiterReportCounts = {
  jobId: string;
  applications: number;
  submittedApplications: number;
  withdrawnApplications: number;
  outstandingOffers: number;
  acceptedOffers: number;
  declinedOffers?: number;
  joinedOffers?: number;
};

export type RecruiterReportRow = RecruiterReportJob &
  Omit<RecruiterReportCounts,"jobId"|"declinedOffers"|"joinedOffers"> & {
    declinedOffers:number; joinedOffers:number;
  };

const EMPTY_COUNTS = {
  applications: 0,
  submittedApplications: 0,
  withdrawnApplications: 0,
  outstandingOffers: 0,
  acceptedOffers: 0,
  declinedOffers: 0,
  joinedOffers: 0,
} as const;

/**
 * Combine authorized paginated drives with counts returned
 * from the registered placement application/offer tables.
 *
 * No student identities or candidate details enter this
 * model. Applications are application records, not
 * necessarily distinct learners.
 */
export function buildRecruiterCompanyReportRows(
  jobs: readonly RecruiterReportJob[],
  counts: readonly RecruiterReportCounts[],
): RecruiterReportRow[] {
  const byJobId = new Map(
    counts.map(({ jobId, ...values }) => [
      jobId,
      values,
    ]),
  );

  return jobs.map((job) => ({
    ...job,
    ...EMPTY_COUNTS,
    ...byJobId.get(job.id),
  }));
}

export function summarizeRecruiterReportPortfolio(input: {
  total: number;
  published: number;
  closed: number;
}) {
  return {
    total: input.total,
    published: input.published,
    closed: input.closed,
  };
}

export function recruiterCompanyReportsHref(
  input: Partial<RecruiterCompanyReportsQuery>,
) {
  const params = new URLSearchParams();

  if (input.collegeId) {
    params.set("collegeId", input.collegeId);
  }

  if (input.status && input.status !== "ALL") {
    params.set("status", input.status);
  }

  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }

  if (input.pageSize && input.pageSize !== 25) {
    params.set("pageSize", String(input.pageSize));
  }

  const query = params.toString();

  return query
    ? `/hr/company/reports?${query}`
    : "/hr/company/reports";
}
