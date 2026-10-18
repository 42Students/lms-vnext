import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=readFileSync("src/modules/placements/tpo-job-type-write-service.ts","utf8");
const writes=[
 "createTpoJobType","setTpoJobTypeActive","renameTpoJobType",
 "setTpoBuiltinJobTypeActive","setTpoJobTypeCountsAsPlaced",
] as const;
describe("TPO-settings-audit-23 active-college lock for job-type writes",()=>{
 it.each(writes)("TPO-settings-audit-23 %s rejects archived college before authorizing or mutating",(name)=>{
  const start=source.indexOf("export async function "+name+"(");
  const next=source.indexOf("export async function ",start+1);
  expect(start).toBeGreaterThanOrEqual(0);
  const body=source.slice(start,next<0?source.length:next);
  const transaction=body.indexOf("getDb().transaction(async tx=>");
  const lock=body.indexOf('.for("update").limit(1)');
  const active=body.indexOf('if(!college||college.status!=="ACTIVE")');
  const persisted=body.indexOf("assertPersistedPlatformPermission(tx,");
  const activity=body.indexOf("tx.insert(activityEvents)");
  expect(transaction).toBeGreaterThan(0);
  expect(lock).toBeGreaterThan(transaction);
  expect(active).toBeGreaterThan(lock);
  expect(persisted).toBeGreaterThan(active);
  expect(activity).toBeGreaterThan(persisted);
  expect(body).toContain("status:colleges.status");
  expect(body).toContain('"TPO_SETTINGS_NOT_FOUND"');
  expect(body.slice(persisted,activity)).toContain("college.organizationId");
 });
 it("retains the same-college resource filters and source-of-truth role preflight",()=>{
  expect(source).toContain("requireTpoBatchActor(context)");
  expect(source).toContain("requireTpoBatchActor(ctx)");
  expect(source).toContain("eq(placementTpoJobTypes.collegeId,collegeId)");
  expect(source).toContain("TPO_JOB_TYPE_LAST_ACTIVE");
  expect(source).toContain("TPO_SETTINGS_STALE");
 });
});
