import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const blocked=readFileSync("src/modules/placements/tpo-blocked-date-write-service.ts","utf8");
const outcome=readFileSync("src/modules/placements/tpo-outcome-label-settings-service.ts","utf8");
function functionBody(source:string,name:string){
 const begin=source.indexOf("export async function "+name+"(");
 const next=source.indexOf("export async function ",begin+1);
 expect(begin).toBeGreaterThanOrEqual(0);
 return source.slice(begin,next<0?source.length:next);
}
describe("TPO-settings-audit-43 college lifecycle on blocked scheduling date writes",()=>{
 it.each(["createBlockedDate","deleteBlockedDate","removeBlockedRange"])(
  "TPO-settings-audit-43 %s denies archives under college lock",name=>{
   const source=functionBody(blocked,name);
   const lock=source.indexOf('.for("update").limit(1)');
   const active=source.indexOf('if(!college||college.status!=="ACTIVE")',lock);
   const role=source.indexOf('assertPersistedPlatformPermission(tx,ctx,"placements.manage"',active);
   const data=source.indexOf("placementTpoBlockedDates",role);
   const event=source.indexOf("tx.insert(activityEvents)",data);
   expect(lock).toBeGreaterThan(0);
   expect(active).toBeGreaterThan(lock);
   expect(role).toBeGreaterThan(active);
   expect(data).toBeGreaterThan(role);
   expect(event).toBeGreaterThan(data);
   expect(source).toContain("status:colleges.status");
   expect(source).toContain("collegeId,organizationId:college.organizationId");
  },
 );
});
describe("TPO-settings-audit-OUTCOME-CAS-01 live college state for custom outcomes",()=>{
 it("refuses archived tenants before no-op CAS or any outcome-label mutation",()=>{
  const save=functionBody(outcome,"saveTpoOutcomeLabels");
  const lock=save.indexOf('.for("update").limit(1)');
  const active=save.indexOf('if(!college||college.status!=="ACTIVE")',lock);
  const role=save.indexOf('assertPersistedPlatformPermission(tx,context,"placements.manage"',active);
  const noOp=save.indexOf("tpoOutcomeLabelsAlreadyApplied(",role);
  const mutate=save.indexOf("tx.update(placementTpoCollegeSettings)",noOp);
  expect(lock).toBeGreaterThan(0);
  expect(active).toBeGreaterThan(lock);
  expect(role).toBeGreaterThan(active);
  expect(noOp).toBeGreaterThan(role);
  expect(mutate).toBeGreaterThan(noOp);
  expect(save).toContain("status:colleges.status");
  expect(save).toContain("TPO_SETTINGS_STALE");
 });
 it("holds active college and persisted actor locks while reading private labels",()=>{
  const read=functionBody(outcome,"readTpoOutcomeLabels");
  const transaction=read.indexOf("getDb().transaction(async tx=>");
  const lock=read.indexOf('.for("share").limit(1)',transaction);
  const active=read.indexOf('college.status!=="ACTIVE"',lock);
  const role=read.indexOf('assertPersistedPlatformPermission(tx,context,"placements.manage"',active);
  const labels=read.indexOf("await tx.select({labels:placementTpoCollegeSettings.outcomeLabels",role);
  const result=read.indexOf("return {ready:true as const,labels:",labels);
  expect(transaction).toBeGreaterThan(0);
  expect(lock).toBeGreaterThan(transaction);
  expect(active).toBeGreaterThan(lock);
  expect(role).toBeGreaterThan(active);
  expect(labels).toBeGreaterThan(role);
  expect(result).toBeGreaterThan(labels);
  expect(read).not.toContain("await getDb().select({labels:");
 });
});
