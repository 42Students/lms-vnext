import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {placementEligibilityOverrideInputSchema} from "@/modules/placements/validation";
import {tpoDriveVisibilitySelection,tpoDriveVisibilityValid}
 from "@/modules/placements/tpo-drive-visibility-bulk-model";

const ids=Array.from({length:220},(_,i)=>"student-"+i);
const learners=ids.map(id=>({id,name:id}));
const JOB="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OVERRIDE="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("TPO-students-12 200-learner show/hide and stale visibility CAS",()=>{
 it("accepts 200 selected filtered learners with stable row order and rejects a 201st action",()=>{
  expect(tpoDriveVisibilitySelection(ids,learners,200)).toHaveLength(200);
  expect(tpoDriveVisibilitySelection(ids,learners,200).at(-1)?.id).toBe("student-199");
  expect(tpoDriveVisibilityValid({jobId:JOB,decision:"INCLUDE",count:200,reason:"Placement exception"})).toBe(true);
  expect(tpoDriveVisibilityValid({jobId:JOB,decision:"EXCLUDE",count:201,reason:"Placement exception"})).toBe(false);
  expect(tpoDriveVisibilityValid({jobId:JOB,decision:"CLEAR",count:0,reason:"Restore rules"})).toBe(false);
  expect(tpoDriveVisibilityValid({jobId:JOB,decision:"CLEAR",count:200,reason:"Restore rules"})).toBe(true);
 });
 it("the same strict production schema accepts a current override ID, or explicit no override",()=>{
  const base={decision:"INCLUDE",reason:"College placement exception"};
  expect(placementEligibilityOverrideInputSchema.safeParse(base).success).toBe(true);
  expect(placementEligibilityOverrideInputSchema.safeParse({...base,expectedOverrideId:OVERRIDE}).success).toBe(true);
  expect(placementEligibilityOverrideInputSchema.safeParse({...base,expectedOverrideId:null}).success).toBe(true);
  expect(placementEligibilityOverrideInputSchema.safeParse({...base,expectedOverrideId:"../../other-college"}).success).toBe(false);
  expect(placementEligibilityOverrideInputSchema.safeParse({...base,unexpected:"WRITE_ALL"}).success).toBe(false);
 });
 it("both set and revoke transactions enforce current persisted placement authorization",()=>{
  const service=src("src/modules/placements/eligibility-service.ts");
  const set=service.slice(service.indexOf("export async function setEligibilityOverride("),
    service.indexOf("export async function revokeEligibilityOverride("));
  const revoke=service.slice(service.indexOf("export async function revokeEligibilityOverride("),
    service.indexOf("function numericCheck("));
  const policy=service.slice(service.indexOf("export async function upsertJobEligibilityPolicy("),
    service.indexOf("async function recordEligibilityOverrideAudit("));
  for(const writer of [set,revoke,policy]){
   expect(writer).toContain('assertPersistedPlatformPermission(tx,context,"placements.manage"');
   expect(writer).toContain("liveJob.collegeId");
  }
  expect(set).toContain("current?.id??null");
  expect(set).toContain("input.expectedOverrideId");
  expect(set).toContain("PLACEMENT_ELIGIBILITY_OVERRIDE_STALE");
  expect(set).toContain('.for("update").limit(1)');
  expect(revoke).toContain("options.expectedOverrideId?");
 });
 it("UI uses bounded previewed-row CAS and only undoes its exact saved override IDs",()=>{
  const ui=src("src/components/tpo/tpo-students-drive-visibility.tsx");
  expect(ui).toContain("tpoDriveVisibilitySelection(selection?.selected??[],learners,200)");
  expect(ui).toContain("mapTpoBulkBounded(picked,async(learner)");
  expect(ui).toContain("mapTpoBulkBounded(restorable,async(row)");
  expect(ui).toContain("expectedOverrideId:current.eligibility.override?.id");
  expect(ui).toContain("expectedOverrideId:row.overrideId");
  expect(ui).toContain('method:"PUT",credentials:"same-origin"');
  expect(ui).toContain('method:"DELETE",credentials:"same-origin"');
  expect(ui).toContain("selected from the current filtered roster (up to 200 per review)");
 });
});
