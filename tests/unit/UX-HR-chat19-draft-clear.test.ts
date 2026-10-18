import {describe,expect,it,vi} from "vitest";
import {clearHrUnsentDraftStores} from "@/modules/placements/hr-unsent-draft-storage-model";
import {readFileSync} from "node:fs";

const key="recruiter-college-draft";
function store(initial:string|null,fail=false){
 let value=initial;
 return {getItem:vi.fn(()=>value),
  removeItem:vi.fn(()=>{if(fail)throw new Error("Storage blocked");value=null;})};
}
describe("UX-HR-DRAFT-CLEAR-47 pending unsent recruiter form cannot vanish on failed storage deletion",()=>{
 it("deletes and verifies both local and session copies before hiding the draft",()=>{
  const local=store("draftA"),session=store("draftB");
  expect(clearHrUnsentDraftStores([local,session],key)).toBe(true);
  expect(local.getItem(key)).toBeNull();
  expect(session.getItem(key)).toBeNull();
  expect(local.removeItem).toHaveBeenCalledWith(key);
  expect(session.removeItem).toHaveBeenCalledWith(key);
 });
 it("does not claim success if either browser store fails deletion",()=>{
  expect(clearHrUnsentDraftStores([store("a",true),store("b")],key)).toBe(false);
  expect(clearHrUnsentDraftStores([store("a"),store("b",true)],key)).toBe(false);
 });
 it("requires a valid key and a destination store before success",()=>{
  expect(clearHrUnsentDraftStores([],key)).toBe(false);
  expect(clearHrUnsentDraftStores([store("draft")],"")).toBe(false);
 });
 it("uses accessible confirm, retains draft after failed delete, and keeps 44px actions",()=>{
  const src=readFileSync("src/components/hr/hr-unsent-drive-alert.tsx","utf8");
  expect(src).toContain('<ConfirmActionDialog open={confirmDiscard}');
  expect(src).toContain('if(!clearHrUnsentDraftStores(');
  const guard=src.indexOf('if(!clearHrUnsentDraftStores(');
  const hide=src.indexOf("setHasDraft(false);setConfirmDiscard(false)");
  expect(hide).toBeGreaterThan(guard);
  expect(src).toContain("Could not clear this saved draft. Try again or continue editing.");
  expect(src).not.toContain("window.confirm(");
  expect(src).toContain("min-h-11");
 });
});
