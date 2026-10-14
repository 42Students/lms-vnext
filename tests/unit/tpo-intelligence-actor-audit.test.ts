import { describe, expect, it } from "vitest";
import {
  buildTpoCompanyFunnel,
  buildTpoCompensationIntelligence,
  tpoIntelligenceCsv,
  tpoIntelligenceFiltersSchema,
} from "@/modules/placements/tpo-intelligence-model";
import { tpoActorAuditCsv, tpoActorAuditQuerySchema } from "@/modules/placements/tpo-actor-audit-model";
import type { PlacementReportCompanyRow, PlacementReportDetails, PlacementReportMetrics } from "@/modules/placements/report-model";

const company: PlacementReportCompanyRow = {
  companyId: "00000000-0000-4000-8000-000000000001",
  companyName: "=BAD()",
  drives: 2, applicants: 4, applications: 6, offers: 5,
  acceptedOffers: 3, placed: 2, averagePackageInr: 800000,
  highestPackageInr: 1000000,
};

describe("TPO company and compensation models", () => {
  it("uses distinct applicants and placed learner counts with missing denominators", () => {
    const result = buildTpoCompanyFunnel([
      company, { ...company, companyId: "00000000-0000-4000-8000-000000000002", applicants: 0, placed: 0 },
    ]);
    expect(result[0]).toMatchObject({
      submittedApplications: 6, releasedOfferVersions: 5,
      uniqueAcceptedLearners: 2, applicantToAcceptedPercent: 50,
    });
    expect(result[1]?.applicantToAcceptedPercent).toBeNull();
  });

  it("separates accepted offer CTC from per-learner best CTC and excludes missing", () => {
    const ctc: PlacementReportDetails["ctc"] = {
      acceptedFullTimeOffers: 3, knownCtcOffers: 2, unknownCtcOffers: 1,
      averageInr: 900000, medianInr: 900000, highestInr: 1000000, bands: [],
    };
    const metrics = {
      averagePackageInr: 950000,
      medianPackageInr: 950000,
      highestPackageInr: 1000000,
    } as PlacementReportMetrics;
    const projected = buildTpoCompensationIntelligence(ctc, metrics);
    expect(projected.knownPackageCoveragePercent).toBe(66.67);
    expect(projected.offerAverageInr).toBe(900000);
    expect(projected.uniqueLearnerBestAverageInr).toBe(950000);
    expect(tpoIntelligenceCsv(buildTpoCompanyFunnel([company]), projected)).toContain("\"'=BAD()\"");
  });

  it("strictly rejects forged college and invalid seasons", () => {
    expect(tpoIntelligenceFiltersSchema.safeParse({
      collegeId: company.companyId,
    }).success).toBe(false);
    expect(tpoIntelligenceFiltersSchema.safeParse({
      seasonId: "bad",
    }).success).toBe(false);
  });
});

describe("TPO canonical actor audit model", () => {
  it("validates actor/entity/date filters and blocks forged college IDs", () => {
    expect(tpoActorAuditQuerySchema.safeParse({
      actorId: company.companyId,
      entityType: "placement_offer",
      from: "2026-10-01", to: "2026-10-14",
    }).success).toBe(true);
    expect(tpoActorAuditQuerySchema.safeParse({
      actorId: "bad", entityType: "placement offer",
    }).success).toBe(false);
    expect(tpoActorAuditQuerySchema.safeParse({
      from: "2026-10-14", to: "2026-10-01",
    }).success).toBe(false);
    expect(tpoActorAuditQuerySchema.safeParse({
      collegeId: company.companyId,
    }).success).toBe(false);
  });

  it("neutralizes formula-like entity IDs in a UTF-8 CSV body", () => {
    const csv = tpoActorAuditCsv([{
      id: "record", actorId: null, occurredAt: "2026-10-14T00:00:00.000Z",
      eventType: "UPDATED", entityType: "placement_job", entityId: "=DANGEROUS()",
    }]);
    expect(csv).toContain("\"'=DANGEROUS()\"");
    expect(csv).toContain('"placement_job"');
  });
});
