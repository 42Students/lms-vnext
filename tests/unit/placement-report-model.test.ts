import { describe, expect, it } from "vitest";
import {
  placementReportCsv,
  placementReportCsvCell,
  summarizePlacementReports,
  type PlacementReportFacts,
} from "@/modules/placements/report-model";

const fixtures: PlacementReportFacts = {
  jobs: [
    {
      id: "drive-a",
      title: "Software Engineer",
      companyId: "company-a",
      companyName: "Synthetic Software",
      employmentType: "FULL_TIME",
      countsAsPlaced: true,
    },
    {
      id: "drive-b",
      title: "Graduate Intern",
      companyId: "company-b",
      companyName: "Synthetic Research",
      employmentType: "INTERNSHIP",
      countsAsPlaced: false,
    },
  ],
  registrations: [
    { membershipId: "learner-1" },
    { membershipId: "learner-2" },
    { membershipId: "learner-3" },
    { membershipId: "learner-3" },
  ],
  branches: [
    {
      membershipId: "learner-1",
      departmentId: "cse",
      departmentName: "Computer Science",
    },
    {
      membershipId: "learner-2",
      departmentId: "civil",
      departmentName: "Civil Engineering",
    },
    {
      membershipId: "learner-3",
      departmentId: "cse",
      departmentName: "Computer Science",
    },
  ],
  applications: [
    {
      id: "application-1",
      jobId: "drive-a",
      membershipId: "learner-1",
      status: "SUBMITTED",
      screeningStatus: "SHORTLISTED",
    },
    {
      id: "application-2",
      jobId: "drive-b",
      membershipId: "learner-1",
      status: "SUBMITTED",
      screeningStatus: "REJECTED",
    },
    {
      id: "application-3",
      jobId: "drive-a",
      membershipId: "learner-2",
      status: "SUBMITTED",
      screeningStatus: "PENDING",
    },
    {
      id: "application-4",
      jobId: "drive-b",
      membershipId: "learner-3",
      status: "WITHDRAWN",
      screeningStatus: "SHORTLISTED",
    },
  ],
  offers: [
    {
      id: "offer-1",
      jobId: "drive-a",
      membershipId: "learner-1",
      status: "ACCEPTED",
      annualCtcInr: 1_200_000,
      joiningStatus: "JOINED",
    },
    {
      id: "offer-2",
      jobId: "drive-a",
      membershipId: "learner-1",
      status: "ACCEPTED",
      annualCtcInr: 1_600_000,
      joiningStatus: "PENDING",
    },
    {
      id: "offer-3",
      jobId: "drive-b",
      membershipId: "learner-1",
      status: "ACCEPTED",
      annualCtcInr: 400_000,
      joiningStatus: "PENDING",
    },
    {
      id: "offer-4",
      jobId: "drive-a",
      membershipId: "learner-2",
      status: "DECLINED",
      annualCtcInr: 900_000,
      joiningStatus: null,
    },
  ],
};

describe("placement report aggregations", () => {
  it("counts distinct placed learners instead of counting offers as people", () => {
    const report = summarizePlacementReports(fixtures);

    expect(report.metrics.registered).toBe(3);
    expect(report.metrics.drives).toBe(2);
    expect(report.metrics.applicants).toBe(2);
    expect(report.metrics.applications).toBe(3);

    expect(report.metrics.offers).toBe(4);
    expect(report.metrics.acceptedOffers).toBe(3);
    expect(report.metrics.studentsPlaced).toBe(1);
    expect(report.metrics.studentsAccepted).toBe(1);
    expect(report.metrics.placementRatePercent).toBe(33);
  });

  it("attributes the same learner's applications to the correct branches", () => {
    const report = summarizePlacementReports(fixtures);
    const cse = report.byBranch.find(
      (branch) => branch.departmentId === "cse",
    );
    const civil = report.byBranch.find(
      (branch) => branch.departmentId === "civil",
    );

    expect(cse).toMatchObject({
      registered: 2,
      applicants: 1,
      applications: 2,
      placed: 1,
      offers: 3,
      acceptedOffers: 3,
      placementRatePercent: 50,
    });

    expect(civil).toMatchObject({
      registered: 1,
      applicants: 1,
      applications: 1,
      placed: 0,
      offers: 1,
      placementRatePercent: 0,
    });
  });

  it("uses the best accepted full-time package for each learner", () => {
    const report = summarizePlacementReports(fixtures);

    expect(report.metrics.highestPackageInr).toBe(1_600_000);
    expect(report.metrics.averagePackageInr).toBe(1_600_000);
    expect(report.metrics.medianPackageInr).toBe(1_600_000);

    // Neither internship CTC nor a declined full-time offer is used.
    expect(
      report.byBranch.find(
        (branch) => branch.departmentId === "civil",
      )?.averagePackageInr,
    ).toBeNull();
  });

  it("separates applications and funnel stages by drive", () => {
    const report = summarizePlacementReports(fixtures);

    expect(
      report.byDrive.find((drive) => drive.jobId === "drive-a"),
    ).toMatchObject({
      applicants: 2,
      applications: 2,
      shortlisted: 1,
      rejected: 0,
      offers: 3,
      acceptedOffers: 2,
      placed: 1,
    });

    expect(
      report.byDrive.find((drive) => drive.jobId === "drive-b"),
    ).toMatchObject({
      applicants: 1,
      applications: 1,
      shortlisted: 0,
      rejected: 1,
      offers: 1,
      acceptedOffers: 1,
      placed: 0,
    });
  });

  it("provides per-company offer and hire metrics", () => {
    const report = summarizePlacementReports(fixtures);

    expect(
      report.byCompany.find(
        (company) => company.companyId === "company-a",
      ),
    ).toMatchObject({
      drives: 1,
      applications: 2,
      offers: 3,
      acceptedOffers: 2,
      placed: 1,
      highestPackageInr: 1_600_000,
    });
  });

  it("does not inflate totals when duplicate projection rows arrive", () => {
    const report = summarizePlacementReports({
      ...fixtures,
      applications: [
        ...fixtures.applications,
        fixtures.applications[0]!,
      ],
      offers: [...fixtures.offers, fixtures.offers[0]!],
    });

    expect(report.metrics.applications).toBe(3);
    expect(report.metrics.offers).toBe(4);
    expect(report.metrics.studentsPlaced).toBe(1);
  });

  it("never infers counts-as-placed from employment type when the policy is missing", () => {
    const withUnknownPolicy: PlacementReportFacts = {
      ...fixtures,
      jobs: fixtures.jobs.map(({countsAsPlaced: _ignored, ...job}) => job),
    };
    const result = summarizePlacementReports(withUnknownPolicy);
    expect(result.metrics.studentsPlaced).toBe(0);
    expect(result.metrics.studentsAccepted).toBe(0);
    expect(result.metrics.studentsWithPackage).toBe(0);
  });

  it("returns truthful empty and denominator-zero results", () => {
    const report = summarizePlacementReports({
      jobs: [],
      registrations: [],
      applications: [],
      offers: [],
      branches: [],
    });

    expect(report.metrics).toMatchObject({
      drives: 0,
      registered: 0,
      applications: 0,
      offers: 0,
      studentsPlaced: 0,
      placementRatePercent: null,
      averagePackageInr: null,
      highestPackageInr: null,
    });

    expect(report.byBranch).toEqual([]);
    expect(report.byDrive).toEqual([]);
    expect(report.byCompany).toEqual([]);
  });

  it("neutralizes CSV formulas and escapes embedded quotes", () => {
    expect(placementReportCsvCell("=1+1")).toBe("\"'=1+1\"");
    expect(placementReportCsvCell("+SUM(A1:A2)"))
      .toBe("\"'+SUM(A1:A2)\"");
    expect(placementReportCsvCell("  @command"))
      .toBe("\"'  @command\"");
    expect(placementReportCsvCell('Synthetic "Company"'))
      .toBe('"Synthetic ""Company"""');

    expect(
      placementReportCsv(
        ["Company", "Offers"],
        [["=UNTRUSTED()", 2]],
      ),
    ).toBe('"Company","Offers"\r\n"\'=UNTRUSTED()","2"');
  });
});


describe("P-S2-05 accepted internships are not full-time placements", () => {
  it("keeps internship accepted in funnel without marking internship-only learners placed", () => {
    const onlyIntern = summarizePlacementReports({
      ...fixtures,
      offers: fixtures.offers.filter((offer) => offer.jobId === "drive-b"),
    });
    expect(onlyIntern.metrics.acceptedOffers).toBe(1);
    expect(onlyIntern.metrics.studentsPlaced).toBe(0);
    expect(onlyIntern.byDrive.find((drive) => drive.jobId === "drive-b")?.placed).toBe(0);
    expect(onlyIntern.byCompany.find((company) => company.companyId === "company-b")?.placed).toBe(0);
  });
});


describe("P-S2-08 persisted college counts-as-placed rule", () => {
  it("counts released full-time offers at OFFER_RELEASED but not in acceptance-only mode", () => {
    const released = {...fixtures.offers[3]!,status:"ISSUED",kind:"OFFER"};
    const facts = {...fixtures,offers:[released]};
    expect(summarizePlacementReports({...facts,countsAsPlacedAt:"OFFER_RELEASED"}).metrics.studentsPlaced).toBe(1);
    expect(summarizePlacementReports({...facts,countsAsPlacedAt:"OFFER_ACCEPTED"}).metrics.studentsPlaced).toBe(0);
  });
  it("never counts internships as placements even with a released offer", () => {
    const facts = {...fixtures,offers:[{...fixtures.offers[2]!,status:"ISSUED"}],countsAsPlacedAt:"OFFER_RELEASED" as const};
    expect(summarizePlacementReports(facts).metrics.studentsPlaced).toBe(0);
  });
});
