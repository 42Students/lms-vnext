/**
 * UX-G076 test-only fixture. Run only AFTER db:e2e:prepare against the guard-approved
 * disposable *_e2e database; never use with production credentials.
 */
import { getDb } from "../src/db/client";
import { tenantDomains, placementPublicPageSettings, placementPublicPageContent } from "../src/db/schema";
import { SEED_IDS } from "./db-seed-data";

const url=process.env.E2E_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url||process.env.TEST_DATABASE_URL!==url||
   !/\/[a-z0-9_]*_e2e(?:_[a-z0-9]+)*$/i.test(new URL(url).pathname)){
 throw new Error("UX_G076_REQUIRES_ISOLATED_E2E_DATABASE");
}
const db=getDb();
await db.insert(tenantDomains).values({
 collegeId:SEED_IDS.collegeA,
 host:"public-g076.localhost",
 isVerified:true,isPrimary:true,verifiedAt:new Date(),
}).onConflictDoNothing();
await db.insert(placementPublicPageSettings).values({
 collegeId:SEED_IDS.collegeA,
 enabled:true,publishedAt:new Date(),populationCount:30,
 placedCount:0,offerCount:0,employerCount:0,
 updatedByUserId:SEED_IDS.collegeAdminUser,
}).onConflictDoNothing();
await db.insert(placementPublicPageContent).values({
 collegeId:SEED_IDS.collegeA,
 about:"E2E public placements overview",
 metricKeys:["STUDENTS"],
}).onConflictDoNothing();
console.log("UX-G076 disposable verified-host and public-only placement publication seeded");
