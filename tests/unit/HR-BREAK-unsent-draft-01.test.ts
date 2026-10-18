import {describe,expect,it} from "vitest";
import {emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";
import {hrDriveSessionStorageKey,saveHrUnsentDraft,restoreHrUnsentDraft}
 from "@/modules/placements/hr-unsent-draft-storage-model";
const a="123e4567-e89b-42d3-a456-426614174001";
const b="123e4567-e89b-42d3-a456-426614174002";
const c="123e4567-e89b-42d3-a456-426614174003";
const at=Date.UTC(2026,9,18,12);

describe("HR-BREAK-unsent-draft-01: safe local drafts, slow networks and stale tabs",()=>{
 it("draft keys isolate recruiter, college and optional source job",()=>{
  const original=hrDriveSessionStorageKey(a,b);
  expect(original).toContain(a);
  expect(original).toContain(b);
  expect(hrDriveSessionStorageKey(a,c)).not.toBe(original);
  expect(hrDriveSessionStorageKey(c,b)).not.toBe(original);
  expect(hrDriveSessionStorageKey(a,b,c)).not.toBe(original);
  for(const invalid of ["../college","not-a-uuid",""]){
   expect(()=>hrDriveSessionStorageKey(invalid,b)).toThrow();
   expect(()=>hrDriveSessionStorageKey(a,invalid)).toThrow();
  }
 });
 it("restores an incomplete, editable unsent request without silently removing the user's draft",()=>{
  const draft={...emptyHrDriveDraft(),title:"  Work in progress ",
   description:"Hiring for distributed systems",branches:["Computer Science"]};
  const stored=saveHrUnsentDraft(draft,at);
  expect(stored).not.toBeNull();
  const recovered=restoreHrUnsentDraft(stored,at+60_000);
  expect(recovered).toEqual(draft);
  expect(recovered?.title).toBe("  Work in progress ");
 });
 it("does not store empty forms or persist a claimed timestamp from the future",()=>{
  expect(saveHrUnsentDraft(emptyHrDriveDraft(),at)).toBeNull();
  expect(saveHrUnsentDraft({...emptyHrDriveDraft(),title:"Engineer"},Number.NaN)).toBeNull();
  const stored=saveHrUnsentDraft({...emptyHrDriveDraft(),title:"Engineer"},at);
  expect(restoreHrUnsentDraft(stored,at-1)).toBeNull();
  expect(restoreHrUnsentDraft(stored,at+24*60*60*1000)).not.toBeNull();
  expect(restoreHrUnsentDraft(stored,at+24*60*60*1000+1)).toBeNull();
 });
 it("blocks malformed JSON, oversized entries and untrusted extra draft fields",()=>{
  expect(restoreHrUnsentDraft("{broken",at)).toBeNull();
  expect(restoreHrUnsentDraft("x".repeat(20001),at)).toBeNull();
  expect(saveHrUnsentDraft({...emptyHrDriveDraft(),title:"Engineer",description:"x".repeat(5001)},at)).toBeNull();
  const base={...emptyHrDriveDraft(),title:"Engineer"};
  const tampered=JSON.stringify({version:2,savedAt:at,draft:{...base,staffPrivilege:true}});
  expect(restoreHrUnsentDraft(tampered,at)).toBeNull();
  const hugeBranches=JSON.stringify({version:2,savedAt:at,draft:{...base,branches:Array(31).fill("CS")}});
  expect(restoreHrUnsentDraft(hugeBranches,at)).toBeNull();
  const hugeRounds=JSON.stringify({version:2,savedAt:at,draft:{...base,rounds:Array(13).fill({kind:"TEST",name:"Round"})}});
  expect(restoreHrUnsentDraft(hugeRounds,at)).toBeNull();
 });
 it("legacy version-one drafts restore only after strict full schema validation",()=>{
  const valid={...emptyHrDriveDraft(),title:"Software engineer",ctcLpa:"12"};
  const historic=JSON.stringify({version:1,savedAt:at,draft:valid});
  expect(restoreHrUnsentDraft(historic,at)).toMatchObject({title:"Software engineer",ctcLpa:"12"});
  const invalid=JSON.stringify({version:1,savedAt:at,draft:{...valid,externalApplicationUrl:"javascript:alert(1)"}});
  expect(restoreHrUnsentDraft(invalid,at)).toBeNull();
  expect(restoreHrUnsentDraft(JSON.stringify({version:99,savedAt:at,draft:valid}),at)).toBeNull();
 });
});