import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {hrRoundEditorHasUnsavedChanges} from "@/modules/placements/hr-round-editor-model";

describe("UX-HR-ROUND-UNSAVED-32: protected round-edit dialog changes",()=>{
 const original={name:"Technical round",kind:"INTERVIEW",mode:"VIRTUAL"};
 it("keeps an untouched new or existing round freely dismissible",()=>{
  expect(hrRoundEditorHasUnsavedChanges({name:"",kind:"INTERVIEW",mode:""},null)).toBe(false);
  expect(hrRoundEditorHasUnsavedChanges(original,original)).toBe(false);
  expect(hrRoundEditorHasUnsavedChanges({...original}, {...original})).toBe(false);
 });
 it.each([
  {name:"Other round",kind:"INTERVIEW",mode:"VIRTUAL"},
  {name:"Technical round",kind:"TEST",mode:"VIRTUAL"},
  {name:"Technical round",kind:"INTERVIEW",mode:"ON_CAMPUS"},
 ])("detects altered name/type/mode %j before discard",draft=>{
  expect(hrRoundEditorHasUnsavedChanges(draft,original)).toBe(true);
 });
 it("prompts when a partly completed new round has unsent fields",()=>{
  expect(hrRoundEditorHasUnsavedChanges({name:"   ",kind:"INTERVIEW",mode:""},null)).toBe(true);
  expect(hrRoundEditorHasUnsavedChanges({name:"",kind:"TEST",mode:""},null)).toBe(true);
  expect(hrRoundEditorHasUnsavedChanges({name:"",kind:"INTERVIEW",mode:"VIRTUAL"},null)).toBe(true);
 });
 it("routes Escape/backdrop and Cancel through confirmation, and keeps remove confirmation distinct",()=>{
  const source=readFileSync("src/components/hr/recruiter-round-inline-editor.tsx","utf8");
  expect(source).toContain("if(dirty){setConfirmDiscard(true);return;}");
  expect(source).toContain("onOpenChange={next=>{if(!next)requestClose();}}");
  expect(source).toContain('onClick={requestClose}');
  expect(source).toContain('open={confirmDiscard} title="Discard unsaved round changes?"');
  expect(source).toContain('onCancel={()=>setConfirmDiscard(false)} onConfirm={reset}');
  expect(source).toContain('open={confirmRemove} title="Remove this round?"');
 });
});
