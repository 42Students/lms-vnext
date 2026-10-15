import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, organizations } from "@/db/schema";
import { publicPlacementPageSettings } from "./staged-schema";
import { publicPlacementTableReady } from "./readiness";
import { publicMetricRelease } from "@/modules/placements/public-metric-release";
import {publicIndependentPlacementCount} from "./independent-count-model";

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
  // Offers and hiring employers can exceed the number of unique students.
  // They still need an eligible published cohort of at least five and their
  // own minimum-five count, but must not be falsely clamped to population.

  return {
    placed:publicMetricRelease({...input,count:row.placed}),
    offers:publicIndependentPlacementCount(row.offers,row.population),
    employers:publicIndependentPlacementCount(row.employers,row.population),
  };
}
