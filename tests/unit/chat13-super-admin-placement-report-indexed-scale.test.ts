import { describe, expect, it } from "vitest";
import {
  summarizePlacementReports,
  type PlacementReportFacts,
} from "@/modules/placements/report-model";

describe("SA-REPORT-SCALE-10 indexed Super Admin company and drive analytics", () => {
  it("keeps every job/company denominator exact over a many-drive college dataset", () => {
    const companies = Array.from({ length: 20 }, (_, i) => "company-" + i);
    const jobs = Array.from({ length: 250 }, (_, i) => ({
      id: "job-" + i,
      title: "Placement role " + i,
      companyId: companies[i % companies.length]!,
      companyName: "Employer " + (i % companies.length),
      employmentType: "FULL_TIME",
    }));
    const applications = jobs.flatMap(job =>
      Array.from({ length: 5 }, (_, index) => ({
        id: "app-" + job.id + "-" + index,
        jobId: job.id,
        membershipId: "learner-" + job.id + "-" + index,
        status: "SUBMITTED",
        screeningStatus: index === 0 ? "SHORTLISTED" : null,
      })),
    );
    const offers = jobs.map((job, index) => ({
      id: "offer-" + job.id, jobId: job.id,
      membershipId: "learner-" + job.id + "-0",
      status: "ACCEPTED",
      kind: "OFFER",
      annualCtcInr: 500_000 + index * 100,
      joiningStatus: null,
    }));
    const facts: PlacementReportFacts = {
      jobs, applications, offers,
      registrations: applications.map(app => ({ membershipId: app.membershipId })),
      branches: [],
    };
    const result = summarizePlacementReports(facts);

    expect(result.metrics).toMatchObject({
      drives: 250, applicants: 1250, applications: 1250,
      offers: 250, acceptedOffers: 250, studentsPlaced: 250,
      studentsWithPackage: 250,
    });
    expect(result.byDrive).toHaveLength(250);
    expect(result.byCompany).toHaveLength(20);
    for (const row of result.byDrive) {
      expect(row).toMatchObject({
        applicants: 5, applications: 5, shortlisted: 1,
        offers: 1, acceptedOffers: 1, placed: 1,
      });
    }
    for (const company of result.byCompany) {
      const ownedJobs = jobs.filter(job => job.companyId === company.companyId);
      const knownJobIds = new Set(ownedJobs.map(job => job.id));
      expect(company.drives).toBe(ownedJobs.length);
      expect(company.applications).toBe(
        applications.filter(app => knownJobIds.has(app.jobId)).length,
      );
      expect(company.applicants).toBe(company.applications);
      expect(company.offers).toBe(ownedJobs.length);
      expect(company.acceptedOffers).toBe(ownedJobs.length);
      expect(company.placed).toBe(ownedJobs.length);
      expect(company.averagePackageInr).toBeGreaterThan(0);
    }
    expect(result.byCompany.reduce((sum, row) => sum + row.applications, 0))
      .toBe(result.metrics.applications);
    expect(result.byCompany.reduce((sum, row) => sum + row.offers, 0))
      .toBe(result.metrics.offers);
  });

  it("does not double-count duplicated SQL fact rows and retains company-scoped learner deduplication", () => {
    const jobA = {
      id: "a", title: "Engineering A", companyId: "company-one",
      companyName: "First", employmentType: "FULL_TIME",
    };
    const jobB = { ...jobA, id: "b", title: "Engineering B" };
    const fact: PlacementReportFacts = {
      jobs: [jobA, jobB, jobA],
      applications: [
        { id: "a1", jobId: "a", membershipId: "learner-one", status: "SUBMITTED", screeningStatus: null },
        { id: "b1", jobId: "b", membershipId: "learner-one", status: "SUBMITTED", screeningStatus: null },
        { id: "b1", jobId: "b", membershipId: "learner-one", status: "SUBMITTED", screeningStatus: null },
      ],
      offers: [
        { id: "o1", jobId: "a", membershipId: "learner-one", status: "ACCEPTED",
          kind: "OFFER", annualCtcInr: 500_000, joiningStatus: null },
        { id: "o2", jobId: "b", membershipId: "learner-one", status: "ACCEPTED",
          kind: "OFFER", annualCtcInr: 900_000, joiningStatus: null },
        { id: "o2", jobId: "b", membershipId: "learner-one", status: "ACCEPTED",
          kind: "OFFER", annualCtcInr: 900_000, joiningStatus: null },
      ],
      registrations: [{ membershipId: "learner-one" }],
      branches: [],
    };
    const data = summarizePlacementReports(fact);
    expect(data.metrics).toMatchObject({
      drives: 2, applicants: 1, applications: 2, offers: 2,
      studentsPlaced: 1, studentsWithPackage: 1, highestPackageInr: 900_000,
    });
    expect(data.byDrive.map(row => row.applications)).toEqual([1, 1]);
    expect(data.byCompany).toHaveLength(1);
    expect(data.byCompany[0]).toMatchObject({
      drives: 2, applicants: 1, applications: 2, offers: 2,
      placed: 1, averagePackageInr: 900_000, highestPackageInr: 900_000,
    });
  });
});
