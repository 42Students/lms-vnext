import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoOutcomeLabelsAlreadyApplied} from "@/modules/placements/tpo-outcome-label-retry-model";

const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const saved=[
 {id:a,label:"Preparing exams",outcome:"COMPETITIVE_EXAMS"},
 {id:b,label:"Joining higher studies",outcome:"HIGHER_STUDIES"},
];

describe("TPO-settings-audit-OUTCOME-CAS-01 custom outcome label retries",()=>{
 it("treats an already-applied save with generated identifiers as harmless, preserving returned identifiers",()=>{
  expect(tpoOutcomeLabelsAlreadyApplied(saved,saved)).toBe(true);
  expect(tpoOutcomeLabelsAlreadyApplied(saved,saved.map(({label,outcome})=>({label,outcome})))).toBe(true);
  expect(tpoOutcomeLabelsAlreadyApplied([],[])).toBe(true);
 });
 it("does not silently accept removed, reordered, renamed, reclassified or foreign-ID edits",()=>{
  for(const other of [
   [saved[0]],[saved[1],saved[0]],
   [{...saved[0],label:"Changed"},saved[1]],
   [{...saved[0],outcome:"HIGHER_STUDIES"},saved[1]],
   [{...saved[0],id:b},saved[1]],
   [{...saved[0],label:"Preparing exams"},{...saved[1],id:a}],
  ])expect(tpoOutcomeLabelsAlreadyApplied(saved,other)).toBe(false);
 });
 it("checks live actor permissions before the locked read and all CAS/audit writes",()=>{
  const source=readFileSync("src/modules/placements/tpo-outcome-label-settings-service.ts","utf8");
  // Read-only catalog has an earlier permission check; inspect the save
  // transaction itself for the locking and CAS ordering.
  const service=source.slice(source.indexOf("export async function saveTpoOutcomeLabels("));
  const lock=service.indexOf('.for("update")');
  const persisted=service.indexOf('assertPersistedPlatformPermission(tx,context,"placements.manage"');
  const same=service.indexOf("tpoOutcomeLabelsAlreadyApplied(");
  const stale=service.indexOf('new TpoOutcomeLabelError("TPO_SETTINGS_STALE")');
  const update=service.indexOf(".set({\n   outcomeLabels:labels,updatedAt:");
  const activity=service.indexOf("await tx.insert(activityEvents)");
  expect(lock).toBeGreaterThan(0);
  expect(persisted).toBeGreaterThan(lock);
  expect(same).toBeGreaterThan(persisted);
  expect(service).toContain("stored.data.map(row=>({...row,id:row.id??null}))");
  expect(service).toContain("input.labels.map(row=>({...row,id:row.id??null}))");
  expect(stale).toBeGreaterThan(same);
  expect(update).toBeGreaterThan(stale);
  expect(activity).toBeGreaterThan(update);
  expect(service).toContain("z.array(entrySchema).safeParse(current.outcomeLabels)");
  expect(service).toContain("greatest(clock_timestamp(),date_trunc('milliseconds'");
  expect(service).toContain("return {labels:stored.data.map(row=>({...row,id:row.id??null}))");
 });
});
