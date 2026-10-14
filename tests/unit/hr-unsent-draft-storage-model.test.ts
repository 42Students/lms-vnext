import {describe,expect,it} from "vitest";
import {emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";
import {hrDriveSessionStorageKey,saveHrUnsentDraft,restoreHrUnsentDraft}
 from "@/modules/placements/hr-unsent-draft-storage-model";
const user="00000000-0000-4000-8000-000000000001",college="00000000-0000-4000-8000-000000000002";
describe("HR validated draft tab storage",()=>{
 it("separates users, colleges and Hire Again sources",()=>{
  const baseline=hrDriveSessionStorageKey(user,college);
  expect(baseline).not.toBe(hrDriveSessionStorageKey(user,"00000000-0000-4000-8000-000000000003"));
  expect(baseline).not.toBe(hrDriveSessionStorageKey(user,college,"00000000-0000-4000-8000-000000000004"));
  expect(()=>hrDriveSessionStorageKey("bad",college)).toThrow();
 });
 it("restores a valid unsent draft within 24h and rejects expired or invalid",()=>{
  const now=1792100000000;
  const draft={...emptyHrDriveDraft(),title:"Engineer",description:"Detailed role description for review.",location:"Hyderabad"};
  const raw=saveHrUnsentDraft(draft,now);
  expect(raw).not.toBeNull();
  expect(restoreHrUnsentDraft(raw,now+1000)).toEqual(draft);
  expect(restoreHrUnsentDraft(raw,now+25*3600000)).toBeNull();
  expect(restoreHrUnsentDraft('{"version":1,"draft":{}}',now)).toBeNull();
  expect(saveHrUnsentDraft(emptyHrDriveDraft(),now)).toBeNull();
 });
});
