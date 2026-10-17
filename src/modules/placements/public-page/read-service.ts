import "server-only";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  colleges, organizations, placementApplications, placementJobs,
  placementOffers, placementCompanyRelationships, placementCollegeRules,
} from "@/db/schema";
import { placementPublicPageSettings as publicPlacementPageSettings } from "@/db/schema";
import { publicPlacementTableReady } from "./readiness";
import { publicMetricRelease } from "@/modules/placements/public-metric-release";
import {publicIndependentPlacementCount} from "./independent-count-model";
import {publicPublicationFresh} from "./publication-freshness-model";
import {publicSalaryMetricsAllowed} from "./salary-privacy-model";

/** A college-scoped, opt-in PUBLIC aggregate only. No identity or offer rows are queried. */
export async function getPublicPlacementStatistics(collegeId:string){
  if(!await publicPlacementTableReady())return null;
  const [row]=await getDb().select({
    enabled:publicPlacementPageSettings.enabled,
    population:publicPlacementPageSettings.populationCount,
    placed:publicPlacementPageSettings.placedCount,
    offers:publicPlacementPageSettings.offerCount,
    employers:publicPlacementPageSettings.employerCount,
    publishedAt:publicPlacementPageSettings.publishedAt,
  }).from(publicPlacementPageSettings)
    .innerJoin(colleges,eq(colleges.id,publicPlacementPageSettings.collegeId))
    .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
    .where(and(eq(publicPlacementPageSettings.collegeId,collegeId),
      eq(colleges.status,"ACTIVE"),eq(organizations.status,"ACTIVE")))
    .limit(1);
  if(!row||!row.enabled||row.publishedAt===null||!publicPublicationFresh(row.publishedAt,new Date()))return null;
  // T-S2-08: never display stale manually entered totals as "live". Read
  // the actual 12-month college-scoped offer ledger only after public opt-in.
  const now = new Date();
  const since = new Date(now);
  since.setUTCMonth(since.getUTCMonth() - 12);
  const db = getDb();
  const [policy, totals] = await Promise.all([
    db.select({ countsAsPlacedAt: placementCollegeRules.countsAsPlacedAt })
      .from(placementCollegeRules)
      .where(eq(placementCollegeRules.collegeId, collegeId)).limit(1),
    db.select({
      offers: sql<number>`count(distinct ${placementOffers.id})::integer`,
      acceptedStudents: sql<number>`count(distinct case when ${placementOffers.status}='ACCEPTED'
        then ${placementApplications.membershipId} end)::integer`,
      releasedStudents: sql<number>`count(distinct ${placementApplications.membershipId})::integer`,
      employers: sql<number>`count(distinct ${placementCompanyRelationships.companyId})::integer`,
      ctcStudentCount: sql<number>`count(distinct case when ${placementOffers.annualCtcInr} is not null
        then ${placementApplications.membershipId} end)::integer`,
      medianCtc: sql<number | null>`percentile_cont(0.5) within group
        (order by ${placementOffers.annualCtcInr})`,
      highestCtc: sql<number | null>`max(${placementOffers.annualCtcInr})`,
    }).from(placementOffers)
      .innerJoin(placementApplications,
        eq(placementApplications.id, placementOffers.applicationId))
      .innerJoin(placementJobs,
        eq(placementJobs.id, placementApplications.jobId))
      .innerJoin(placementCompanyRelationships,
        eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId))
      .where(and(
        eq(placementJobs.collegeId, collegeId),
        eq(placementCompanyRelationships.collegeId, collegeId),
        gte(placementOffers.issuedAt, since),
        inArray(placementOffers.status, ["ISSUED", "ACCEPTED"]),
        inArray(placementJobs.status, ["PUBLISHED", "CLOSED"]),
        eq(placementOffers.kind, "OFFER"),
      )),
  ]);
  const actual = totals[0];
  const placedAt = policy[0]?.countsAsPlacedAt ?? "OFFER_RELEASED";
  // SELECTED requires a distinct upstream selection ledger; it is never
  // silently equated to released or accepted offers.
  const placedCount = placedAt === "SELECTED" ? null
    : placedAt === "OFFER_ACCEPTED" ? actual?.acceptedStudents ?? 0
    : actual?.releasedStudents ?? 0;
  const input={enabled:row.enabled,collegeActive:true,population:row.population};
  // Offers and hiring employers can exceed the number of unique students.
  // They still need an eligible published cohort of at least five and their
  // own minimum-five count, but must not be falsely clamped to population.

  return {
    publishedAt:row.publishedAt.toISOString(),
    placed:publicMetricRelease({...input,count:placedCount}),
    population:publicMetricRelease({...input,count:row.population}),
    offers:publicIndependentPlacementCount(actual?.offers ?? 0,row.population),
    employers:publicIndependentPlacementCount(actual?.employers ?? 0,row.population),
    medianCtcInr: publicSalaryMetricsAllowed(actual?.ctcStudentCount ?? 0,row.population) ? Number(actual?.medianCtc ?? 0) : null,
    highestCtcInr: publicSalaryMetricsAllowed(actual?.ctcStudentCount ?? 0,row.population) ? Number(actual?.highestCtc ?? 0) : null,
  };
}
