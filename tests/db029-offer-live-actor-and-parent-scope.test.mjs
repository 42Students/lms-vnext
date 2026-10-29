import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const code=readFileSync("src/modules/placements/offer-service.ts","utf8");
const issue=code.slice(code.indexOf("export async function issuePlacementOffer("),
 code.indexOf("async function notifyCollegeTpoOfOfferResponse("));
const respond=code.slice(code.indexOf("export async function actOnPlacementOffer("),
 code.indexOf("export async function previewOwnOfferAcceptanceImpact("));
test("DB029 offer issuance reauthorizes staff under job/season write transaction locks",()=>{
 const job=issue.indexOf('.for("update").limit(1)');
 const season=issue.indexOf('.for("share").limit(1)',job);
 const actor=issue.indexOf('await assertPersistedPlatformPermission(tx,context,"placements.manage"');
 const insert=issue.indexOf('.insert(placementOffers)');
 assert.ok(job>=0&&season>job&&actor>season&&insert>actor);
 assert.match(issue,/const staffCollege=await requirePlacementManageScope/);
 assert.match(issue,/organizationId:staffCollege\.organizationId/);
});
test("DB029 offer response guards role revocation and staff authority before status mutation",()=>{
 const action=respond.indexOf('if (input.action === "ACCEPT"');
 const actor=respond.indexOf('const [learnerRole]=await tx.select');
 const author=respond.indexOf('await assertPersistedPlatformPermission(tx,context,"placements.manage"');
 const offer=respond.indexOf('.from(placementOffers)');
 const write=respond.indexOf('.update(placementOffers)');
 assert.ok(action>=0&&actor>action&&author>actor&&offer>author&&write>offer);
 assert.match(respond,/eq\(membershipRoles\.role,"LEARNER"\)/);
 assert.match(respond,/if\(!learnerRole\)throw new AuthorizationError\("placements\.read"\)/);
 assert.match(respond,/if\(!staffCollege\)throw new AuthorizationError\("placements\.manage"\)/);
 assert.match(respond,/organizationId:staffCollege\.organizationId/);
});
test("DB066 offer response locks still-parented application and scoped accepted role",()=>{
 assert.match(respond,/offer\.applicationId!==current\.application\.id/);
 assert.match(respond,/\.from\(placementApplications\)\.where\(\s*eq\(placementApplications\.id,offer\.applicationId\)\s*\)\.for\("share"\)/);
 assert.match(respond,/liveParent\.jobId!==current\.job\.id/);
 assert.match(respond,/liveParent\.membershipId!==current\.application\.membershipId/);
 assert.match(respond,/eq\(placementJobRoleOptions\.jobId,current\.job\.id\)/);
 assert.match(respond,/if\(!acceptedRole\)throw new PlacementsServiceError\("PLACEMENT_OFFER_NOT_READY"\)/);
});
