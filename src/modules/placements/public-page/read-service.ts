import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, organizations } from "@/db/schema";
import { publicPlacementPageSettings } from "./staged-schema";
import { publicPlacementTableReady } from "./readiness";
import { publicMetricRelease } from "@/modules/placements/public-metric-release";

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
  if(!row||!row.enabled||!row.publishedAt)return null;
  const input={enabled:row.enabled,collegeActive:true,population:row.population};
  return {
    placed:publicMetricRelease({...input,count:row.placed}),
    offers:publicMetricRelease({...input,count:row.offers}),
    // Employers may exceed cohort count, so this must be separately authored
    // and independently k-suppressed rather than compared against students.
    employers: row.employers!==null && Number.isSafeInteger(row.employers) &&
      row.employers>=5 && row.population!==null && row.population>=5
      ? row.employers : null,
  };
}
