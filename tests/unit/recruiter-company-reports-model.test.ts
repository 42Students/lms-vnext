import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildRecruiterCompanyReportRows,
  recruiterCompanyReportsHref,
  recruiterCompanyReportsQuerySchema,
  summarizeRecruiterReportPortfolio,
  type RecruiterReportJob,
} from "@/modules/placements/recruiter-company-reports-model";

const jobs: RecruiterReportJob[] = [
  {
    id: "job-new",
    title: "Software Engineer",
    status: "PUBLISHED",
    employmentType: "FULL_TIME",
    publishedAt: new Date(
      "2026-10-14T06:00:00.000Z",
    ),
    closedAt: null,
  },
  {
    id: "job-old",
    title: "Data Analyst",
    status: "CLOSED",
    employmentType: "INTERNSHIP",
    publishedAt: new Date(
      "2026-09-10T06:00:00.000Z",
    ),
    closedAt: new Date(
      "2026-10-01T06:00:00.000Z",
    ),
  },
];

describe("Recruiter Company Reports read model", () => {
  it("joins persisted counts to the correct drive", () => {
    const rows = buildRecruiterCompanyReportRows(
      jobs,
      [
        {
          jobId: "job-new",
          applications: 12,
          submittedApplications: 10,
          withdrawnApplications: 2,
          outstandingOffers: 3,
          acceptedOffers: 1,
        },
      ],
    );

    expect(rows).toHaveLength(2);

    expect(rows[0]).toMatchObject({
      id: "job-new",
      applications: 12,
      submittedApplications: 10,
      withdrawnApplications: 2,
      outstandingOffers: 3,
      acceptedOffers: 1,
    });

    expect(rows[1]).toMatchObject({
      id: "job-old",
      applications: 0,
      submittedApplications: 0,
      withdrawnApplications: 0,
      outstandingOffers: 0,
      acceptedOffers: 0,
    });
  });

  it("does not attach counts for unrelated jobs", () => {
    const rows = buildRecruiterCompanyReportRows(
      [jobs[0]],
      [
        {
          jobId: "another-college-job",
          applications: 100,
          submittedApplications: 80,
          withdrawnApplications: 20,
          outstandingOffers: 30,
          acceptedOffers: 10,
        },
      ],
    );

    expect(rows[0].applications).toBe(0);
    expect(rows[0].acceptedOffers).toBe(0);
  });

  it("retains the server's authorized job order", () => {
    const rows = buildRecruiterCompanyReportRows(
      jobs,
      [],
    );

    expect(rows.map((row) => row.id)).toEqual([
      "job-new",
      "job-old",
    ]);
  });

  it("returns a summary from persisted portfolio counts", () => {
    expect(
      summarizeRecruiterReportPortfolio({
        total: 7,
        published: 5,
        closed: 2,
      }),
    ).toEqual({
      total: 7,
      published: 5,
      closed: 2,
    });
  });

  it("validates college IDs and bounded pagination", () => {
    const validCollege =
      "00000000-0000-4000-8000-000000000001";

    expect(
      recruiterCompanyReportsQuerySchema.parse({
        collegeId: validCollege,
        status: "CLOSED",
        page: "2",
        pageSize: "10",
      }),
    ).toEqual({
      collegeId: validCollege,
      status: "CLOSED",
      page: 2,
      pageSize: 10,
    });

    expect(
      recruiterCompanyReportsQuerySchema.safeParse({
        collegeId: "another-tenant",
      }).success,
    ).toBe(false);

    expect(
      recruiterCompanyReportsQuerySchema.safeParse({
        status: "DRAFT",
      }).success,
    ).toBe(false);

    expect(
      recruiterCompanyReportsQuerySchema.safeParse({
        pageSize: "51",
      }).success,
    ).toBe(false);

    expect(
      recruiterCompanyReportsQuerySchema.safeParse({
        userId: validCollege,
      }).success,
    ).toBe(false);

    expect(
      recruiterCompanyReportsQuerySchema.safeParse({
        relationshipId: validCollege,
      }).success,
    ).toBe(false);
  });

  it("creates report navigation URLs with an explicit college choice", () => {
    const collegeId =
      "00000000-0000-4000-8000-000000000001";

    expect(
      recruiterCompanyReportsHref({
        collegeId,
        status: "PUBLISHED",
        page: 2,
        pageSize: 50,
      }),
    ).toBe(
      `/hr/company/reports?collegeId=${collegeId}&status=PUBLISHED&page=2&pageSize=50`,
    );

    expect(
      recruiterCompanyReportsHref({}),
    ).toBe("/hr/company/reports");
  });

  it("does not introduce candidate personal-data fields", () => {
    const row = buildRecruiterCompanyReportRows(
      [jobs[0]],
      [],
    )[0];

    expect(row).not.toHaveProperty("candidateName");
    expect(row).not.toHaveProperty("email");
    expect(row).not.toHaveProperty("phone");
    expect(row).not.toHaveProperty("membershipId");
  });
});
