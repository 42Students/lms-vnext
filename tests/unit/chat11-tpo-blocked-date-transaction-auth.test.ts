import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=readFileSync("src/modules/placements/tpo-blocked-date-write-service.ts","utf8");
const names=["createBlockedDate","deleteBlockedDate","removeBlockedRange"] as const;
function handler(name:(typeof names)[number]){
 const start=source.indexOf("export async function "+name+"(");
 const end=names.map(item=>source.indexOf("export async function "+item+"("))
  .filter(i=>i>start).reduce((min,n)=>Math.min(min,n),source.length);
 expect(start).toBeGreaterThan(0);
 return source.slice(start,end);
}
describe("TPO-settings-audit-43 per-college blocked-date safety",()=>{
 it.each(names)("TPO-settings-audit-43 %s denies revoked actors inside the locked transaction",(name)=>{
  const segment=handler(name);
  const txn=segment.indexOf("getDb().transaction(async tx=>");
  const collegeLock=segment.indexOf('.for("update").limit(1)');
  const assert=segment.indexOf('assertPersistedPlatformPermission(tx,ctx,"placements.manage"');
  const version=segment.indexOf("DATE_STALE");
  const mutating=segment.indexOf(name==="createBlockedDate"?"tx.insert(placementTpoBlockedDates)":"tx.delete(placementTpoBlockedDates)");
  const audit=segment.indexOf("tx.insert(activityEvents)");
  expect(txn).toBeGreaterThan(0);
  expect(collegeLock).toBeGreaterThan(txn);
  expect(assert).toBeGreaterThan(collegeLock);
  expect(segment.slice(assert,mutating)).toContain("collegeId,organizationId:college.organizationId");
  expect(mutating).toBeGreaterThan(assert);
  expect(audit).toBeGreaterThan(mutating);
  if(name!=="createBlockedDate")expect(version).toBeGreaterThan(assert);
  expect(segment).toContain("eq(placementTpoBlockedDates.collegeId,collegeId)");
 });
 it("TPO-settings-audit-43 bounds range creation/removal to 90 days and same tenant",()=>{
  expect(source).toContain("count<1||count>90");
  expect(source).toContain("tpoIndiaCalendarDay(new Date())");
  expect(source).toContain("z.iso.date()");
  expect(source).toContain("days.length!==input.versions.length");
  expect(source).toContain("records.length!==days.length");
 });
});
