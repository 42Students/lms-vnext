import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync("src/modules/placements/request-service.ts","utf8");
const start=source.indexOf("export async function actOnPlacementRequest(");
const end=source.indexOf("\nfunction requestListQuery(",start);
assert.ok(start>=0&&end>start,"request action transaction not found");
const action=source.slice(start,end);

test("DB-066 decision binds the locked request to its pre-authorized application, type and targets",()=>{
 const lock=action.indexOf(".from(placementLearnerRequests)");
 const stale=action.indexOf("request.applicationId !== current.application.id");
 const parent=action.indexOf("persistedApplication.jobId !== current.job.id");
 const mutation=action.indexOf(".update(placementLearnerRequests)");
 assert.ok(lock>=0&&stale>lock&&parent>stale&&mutation>parent,
  "Request and parent locks must precede any decision update");
 for(const guard of [
  "request.applicationId !== current.application.id",
  "request.requestType !== current.request.requestType",
  "request.roundId !== current.request.roundId",
  "request.offerId !== current.request.offerId",
  "persistedApplication.jobId !== current.job.id",
  "persistedApplication.membershipId !== current.application.membershipId",
 ])assert.ok(action.includes(guard), "Missing ancestry guard: "+guard);
 assert.match(action,/\.from\(placementApplications\)\.where\(\s*eq\(placementApplications\.id,request\.applicationId\)\s*\)\.for\("share"\)/);
 assert.match(action,/"PLACEMENT_REQUEST_TARGET_MISMATCH"/);
});

test("DB-066 checks live persisted staff/learner permission inside same write transaction",()=>{
 const tx=action.indexOf("return db.transaction(async (tx) =>");
 const permission=action.indexOf("await assertPersistedPlatformPermission(tx,context,requiredPermission");
 const mutation=action.indexOf(".update(placementLearnerRequests)");
 assert.ok(tx>=0&&permission>tx&&mutation>permission);
 assert.match(action,/input\.action === "CANCEL"\s*\?\s*"placements\.read"/);
 assert.match(action,/: "placements\.manage" as const/);
 assert.match(action,/collegeId:current\.job\.collegeId/);
 assert.match(source,/import \{assertPersistedPlatformPermission\} from "@\/modules\/permissions\/persisted-actor";/);
});
