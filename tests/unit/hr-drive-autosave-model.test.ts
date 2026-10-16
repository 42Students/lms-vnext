import {describe,expect,it} from "vitest";
import {emptyHrDriveDraft,hrDriveDraftSchema} from "@/modules/placements/hr-drive-draft-model";
import {saveHrAutoDraft,restoreHrAutoDraft} from "@/modules/placements/hr-drive-autosave-model";
import {hrDriveSessionStorageKey} from "@/modules/placements/hr-unsent-draft-storage-model";
describe("REC-home-drives-29 local draft autosave",()=>{
 it("keeps separate unsent edits from distinct pending requests",()=>{
  const user="550e8400-e29b-41d4-a716-446655440000";
  const college="550e8400-e29b-41d4-a716-446655440001";
  const first="550e8400-e29b-41d4-a716-446655440002";
  const second="550e8400-e29b-41d4-a716-446655440003";
  expect(hrDriveSessionStorageKey(user,college,first))
   .not.toBe(hrDriveSessionStorageKey(user,college,second));
  expect(hrDriveSessionStorageKey(user,college,null))
   .not.toBe(hrDriveSessionStorageKey(user,college,first));
 });
 it("restores even a partially entered role without formally submitting it",()=>{
  const incomplete={...emptyHrDriveDraft(),title:"In-progress role"};
  expect(hrDriveDraftSchema.safeParse(incomplete).success).toBe(false);
  const raw=saveHrAutoDraft(incomplete);
  expect(raw).not.toBeNull();
  expect(restoreHrAutoDraft(raw)).toEqual(incomplete);
 });
 it("refuses unknown keys, malformed objects and oversize drafts",()=>{
  const valid=emptyHrDriveDraft();
  expect(saveHrAutoDraft({...valid,unexpected:"private"} as typeof valid)).toBeNull();
  expect(restoreHrAutoDraft("not json")).toBeNull();
  expect(restoreHrAutoDraft("x".repeat(20001))).toBeNull();
  expect(restoreHrAutoDraft(JSON.stringify({version:2,draft:{}}))).toBeNull();
 });
 it("does not accept an altered version or a poisoned round kind",()=>{
  const original=saveHrAutoDraft(emptyHrDriveDraft());
  expect(original).not.toBeNull();
  const doc=JSON.parse(original!) as {version:number;draft:{rounds:{kind:string}[]}};
  expect(restoreHrAutoDraft(JSON.stringify({...doc,version:3}))).toBeNull();
  doc.draft.rounds[0]!.kind="UNKNOWN";
  expect(restoreHrAutoDraft(JSON.stringify(doc))).toBeNull();
 });
});
