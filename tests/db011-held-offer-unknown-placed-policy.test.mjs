import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync("src/modules/placements/held-offer-facts-service.ts","utf8");

test("DB-011 a NULL, unaudited campus placed flag still consumes held-offer capacity",()=>{
 assert.match(source,/or\(eq\(placementJobs\.countsAsPlaced, true\),\s*isNull\(placementJobs\.countsAsPlaced\)\)/);
 assert.match(source,/eq\(placementJobs\.collegeId, collegeId\)/);
 assert.match(source,/eq\(placementApplications\.membershipId, membershipId\)/);
 assert.match(source,/eq\(placementOffers\.kind, "OFFER"\)/);
 assert.match(source,/inArray\(placementOffers\.status, \["ISSUED", "ACCEPTED"\]\)/);
 assert.doesNotMatch(source,/eq\(placementJobs\.countsAsPlaced, false\)/);
});

test("DB-011 known false is excluded, external verified offers still count",()=>{
 assert.match(source,/eq\(placementExternalOffers\.collegeId, collegeId\)/);
 assert.match(source,/eq\(placementExternalOffers\.membershipId, membershipId\)/);
 assert.match(source,/eq\(placementExternalOffers\.status, "VERIFIED"\)/);
 assert.match(source,/verifiedExternalCtcInr\(row\.ctcLpa\)/);
});
