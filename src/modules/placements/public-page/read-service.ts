import "server-only";
import { and, eq, isNotNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  colleges, organizations, placementApplications, placementJobs,
  placementOffers, placementCompanyRelationships,
} from "@/db/schema";
import { placementPublicPageSettings as publicPlacementPageSettings } from "@/db/schema";
import { publicPlacementTableReady } from "./readiness";
import { publicMetricRelease } from "@/modules/placements/public-metric-release";
import {publicIndependentPlacementCount} from "./independent-count-model";
import {publicPublicationFresh} from "./publication-freshness-model";
import {publicSalaryMetricsAllowed} from "./salary-privacy-model";

/** Only aggregated, college-scoped opt-in PUBLIC statistics leave this
 * boundary. No learner name, contact, offer body, letter or individual
 * compensation is returned. Offer-ledger rows are queried internally to
 * compute accepted-only distinct learner and company counts. */
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
  // Legacy publication is controlled by the college's enabled flag, not by
  // an arbitrary rolling expiry. A never-published draft stays private;
  // a published page can remain visible but MUST disclose snapshot staleness.
  if(!row||!row.enabled||row.publishedAt===null)return null;
  const publicationFresh=publicPublicationFresh(row.publishedAt,new Date());
  // T-S2-08: never display stale manually entered totals as "live". Read
  // the actual 12-month college-scoped offer ledger only after public opt-in.
  const now = new Date();
  const since = new Date(now);
  since.setUTCMonth(since.getUTCMonth() - 12);
  const db = getDb();
  // Legacy public placements: accepted distinct learners and employers,
  // but all *released or accepted* offer records for the offer total.
  // Keep this separate from an institution's private "counts as placed" rule.
  const totals = await db.select({
      offers: sql<number>`count(distinct ${placementOffers.id})::integer`,
      acceptedStudents: sql<number>`count(distinct case when ${placementOffers.status}='ACCEPTED'
        then ${placementApplications.membershipId} end)::integer`,
      employers: sql<number>`count(distinct case when ${placementOffers.status}='ACCEPTED'
        then ${placementCompanyRelationships.companyId} end)::integer`,
      ctcStudentCount: sql<number>`count(distinct case when ${placementOffers.status}='ACCEPTED'
        and ${placementOffers.annualCtcInr} is not null then ${placementApplications.membershipId} end)::integer`,
      medianCtc: sql<number | null>`percentile_cont(0.5) within group
        (order by case when ${placementOffers.status}='ACCEPTED'
          then ${placementOffers.annualCtcInr} end)`,
      highestCtc: sql<number | null>`max(case when ${placementOffers.status}='ACCEPTED'
        then ${placementOffers.annualCtcInr} end)`,
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
        sql`coalesce(${placementOffers.legacyCreatedAt},${placementOffers.issuedAt}) >= ${since}`,
        or(eq(placementOffers.status,"ACCEPTED"),
          and(eq(placementOffers.status,"ISSUED"),isNotNull(placementOffers.releasedAt))),
        eq(placementOffers.kind, "OFFER"),
      ));
  const actual = totals[0];
  const placedCount = actual?.acceptedStudents ?? 0;
  const input={enabled:row.enabled,collegeActive:true,population:row.population};
  // Offers and hiring employers can exceed the number of unique students.
  // They still need an eligible published cohort of at least five and their
  // own minimum-five count, but must not be falsely clamped to population.

  return {
    publishedAt:row.publishedAt.toISOString(),
    // vNext has an explicit published eligibility snapshot, whereas legacy
    // recomputed PlacementEligibilityService live. Never imply that this
    // denominator includes new/revoked learners after publication.
    publicationFresh,
    statisticsAsOf:now.toISOString(),
    eligibilitySnapshotAsOf:row.publishedAt.toISOString(),
    eligibilitySnapshotWarning:publicationFresh?null:
      "The eligible student count is an older published snapshot. Ask the placement cell to refresh it.",
    populationBasis:"PUBLISHED_ELIGIBLE_SNAPSHOT" as const,
    placementBasis:"ACCEPTED_OFFERS" as const,
    offerWindowMonths:12,
    placed:publicMetricRelease({...input,count:placedCount}),
    population:publicMetricRelease({...input,count:row.population}),
    offers:publicIndependentPlacementCount(actual?.offers ?? 0,row.population),
    employers:publicIndependentPlacementCount(actual?.employers ?? 0,row.population),
    medianCtcInr: publicSalaryMetricsAllowed(actual?.ctcStudentCount ?? 0,row.population) ? Number(actual?.medianCtc ?? 0) : null,
    highestCtcInr: publicSalaryMetricsAllowed(actual?.ctcStudentCount ?? 0,row.population) ? Number(actual?.highestCtc ?? 0) : null,
  };
}
