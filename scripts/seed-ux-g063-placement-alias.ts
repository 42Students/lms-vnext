/**
 * UX-G063 opt-in positive-path fixture. Creates a valid college Placements
 * entitlement and learner eligibility ONLY in the disposable E2E database.
 * The production layout/participation guard remains fully enforced.
 */
import { eq, and } from "drizzle-orm";
import { getDb } from "../src/db/client";
import { collegeMemberships, moduleAccessRules, placementEligibilityDecisions } from "../src/db/schema";
import { SEED_IDS } from "./db-seed-data";

async function main() {
  const url = process.env.E2E_DATABASE_URL;
  if (process.env.E2E_AUTH_ENABLED !== "true" ||
      process.env.UX_G063_ENABLE_FIXTURE !== "true" ||
      !url || process.env.DATABASE_URL !== url ||
      process.env.TEST_DATABASE_URL !== url) {
    throw new Error("UX-G063 fixture requires explicit isolated E2E authentication/database consent");
  }
  const parsed = new URL(url);
  const dbName = decodeURIComponent(parsed.pathname.slice(1));
  if (!["127.0.0.1", "localhost"].includes(parsed.hostname) ||
      !/^(?:e2e_[a-z0-9_]+|[a-z0-9_]+_e2e(?:_[a-z0-9]+)*)$/i.test(dbName)) {
    throw new Error("UX-G063 fixture refuses a nonlocal or non-E2E database target");
  }

  const db = getDb();
  const [learner] = await db.select({
    collegeId: collegeMemberships.collegeId,
    status: collegeMemberships.status,
  }).from(collegeMemberships)
    .where(eq(collegeMemberships.id, SEED_IDS.learnerCollegeAMembership))
    .limit(1);
  if (!learner || learner.collegeId !== SEED_IDS.collegeA || learner.status !== "ACTIVE") {
    throw new Error("UX-G063 fixture learner is not the expected active College A identity");
  }

  // This is real persisted college module access, not a test-only bypass.
  await db.insert(moduleAccessRules).values({
    scopeType:"COLLEGE", scopeId:SEED_IDS.collegeA,
    module:"placements", enabled:true, locked:false,
    updatedByUserId:SEED_IDS.collegeAdminUser,
  }).onConflictDoNothing();

  // The same learner also needs a persisted TPO eligibility decision.
  // Existing authorized academic enrollment/section are seeded by db:e2e:prepare.
  await db.insert(placementEligibilityDecisions).values({
    collegeId:SEED_IDS.collegeA,
    scopeType:"MEMBERSHIP", scopeId:SEED_IDS.learnerCollegeAMembership,
    status:"ELIGIBLE", decidedByUserId:SEED_IDS.collegeAdminUser,
    note:"Isolated UX-G063 authenticated alias acceptance",
  }).onConflictDoNothing();

  const [[rule], [eligibility]] = await Promise.all([
    db.select({enabled:moduleAccessRules.enabled})
      .from(moduleAccessRules).where(and(
        eq(moduleAccessRules.scopeType,"COLLEGE"),
        eq(moduleAccessRules.scopeId,SEED_IDS.collegeA),
        eq(moduleAccessRules.module,"placements"),
      )).limit(1),
    db.select({status:placementEligibilityDecisions.status})
      .from(placementEligibilityDecisions).where(and(
        eq(placementEligibilityDecisions.scopeType,"MEMBERSHIP"),
        eq(placementEligibilityDecisions.scopeId,SEED_IDS.learnerCollegeAMembership),
        eq(placementEligibilityDecisions.collegeId,SEED_IDS.collegeA),
      )).limit(1),
  ]);
  if (!rule?.enabled || eligibility?.status !== "ELIGIBLE") {
    throw new Error("UX-G063 E2E college access/learner eligibility not verified");
  }
  process.stdout.write("Isolated UX-G063 learner Placements module and membership eligibility verified.\n");
}
main().catch(error => {
  process.stderr.write(String(error)+"\n");
  process.exitCode=1;
});
