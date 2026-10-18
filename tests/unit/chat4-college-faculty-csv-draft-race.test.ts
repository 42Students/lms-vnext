import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {facultyCsvResponseBelongsToDraft} from "@/modules/people/college-faculty-csv-draft-model";

describe("COL-people-faculty-csv-RACE-03 stale preview and draft integrity",()=>{
 it("accepts a preview only for the exact uploaded/typed CSV revision",()=>{
  expect(facultyCsvResponseBelongsToDraft(0,0)).toBe(true);
  expect(facultyCsvResponseBelongsToDraft(1,1)).toBe(true);
  expect(facultyCsvResponseBelongsToDraft(1,2)).toBe(false);
  expect(facultyCsvResponseBelongsToDraft(2,1)).toBe(false);
 });
 it("rejects invalid revision numbers rather than trusting malformed client state",()=>{
  for(const value of [-1,0.5,NaN,Infinity]){
   expect(facultyCsvResponseBelongsToDraft(value,value)).toBe(false);
  }
 });
 it("a slow previous validation never unlocks import on a newer draft",()=>{
  const firstCsv="Faculty A";
  const changedCsv="Faculty B";
  let shownPreview:string|null=null;
  let submittedCsv=firstCsv,revision=0;
  revision++;
  submittedCsv=changedCsv;
  if(facultyCsvResponseBelongsToDraft(0,revision))shownPreview=firstCsv;
  expect(shownPreview).toBeNull();
  if(facultyCsvResponseBelongsToDraft(revision,revision))shownPreview=submittedCsv;
  expect(shownPreview).toBe(changedCsv);
 });
 it("guards file-read errors and preview results, clears confirmation, and disables edits while registering",()=>{
  const code=readFileSync("src/components/college/college-faculty-csv-import.tsx","utf8");
  expect(code).toContain("const revision=csvRevision.current");
  expect(code).toContain("const submittedCsv=csv");
  expect(code).toContain('csv:submittedCsv');
  expect(code).toContain('if(action==="PREVIEW" && !facultyCsvResponseBelongsToDraft(revision,csvRevision.current))return');
  expect(code).toContain("const version=++csvRevision.current");
  expect(code).toContain("facultyCsvResponseBelongsToDraft(version,csvRevision.current)");
  expect(code).toContain("setReport(null);setConfirmed(false)");
  expect(code).toContain('disabled={pending}');
  expect(code).toContain("Unable to read CSV. Choose the file again.");
  expect(code).not.toContain("setError(reason.message)");
 });
});
