import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {isCurrentCollegeImportHistoryRequest} from "@/modules/people/college-import-history-request-model";

describe("COL-people-import-history-RACE-02 page race and modal close semantics",()=>{
 it("accepts only the latest non-aborted response, never a previous page or a closed dialog",()=>{
  const oldest=1,newest=2;
  expect(isCurrentCollegeImportHistoryRequest(oldest,newest,false)).toBe(false);
  expect(isCurrentCollegeImportHistoryRequest(newest,newest,false)).toBe(true);
  expect(isCurrentCollegeImportHistoryRequest(newest,newest,true)).toBe(false);
  // Closing the modal invalidates the latest request, even when a fetch
  // implementation cannot abort a response that is already in flight.
  expect(isCurrentCollegeImportHistoryRequest(newest,3,false)).toBe(false);
 });
 it("rejects invalid request versions rather than assuming unknown responses belong to the active view",()=>{
  for(const value of [0,-1,0.5,NaN,Infinity]){
   expect(isCurrentCollegeImportHistoryRequest(value,value,false)).toBe(false);
  }
 });
 it("preserves user-visible history page until a newer successful response completes",()=>{
  const first={page:1,rows:["one"],hasNext:true};
  const second={page:2,rows:["two"],hasNext:false};
  let shown=first;
  if(isCurrentCollegeImportHistoryRequest(1,2,false))shown=first;
  expect(shown).toEqual(first);
  if(isCurrentCollegeImportHistoryRequest(2,2,false))shown=second;
  expect(shown).toEqual(second);
 });
 it("applies the token gate after reading JSON and also to request errors; closing aborts the old request",()=>{
  const code=readFileSync("src/components/college/college-student-import-history.tsx","utf8");
  expect(code).toContain("requestVersion.current++");
  expect(code).toContain("activeRequest.current?.abort()");
  expect(code).toContain("const version=++requestVersion.current");
  expect(code).toContain("signal:controller.signal");
  expect(code).toContain("Array.isArray(body?.items)");
  expect(code).toContain("isCurrentCollegeImportHistoryRequest(version,requestVersion.current,controller.signal.aborted)");
  expect(code).toContain("onOpenChange={next=>{if(next)setOpen(true);else close();}}");
  expect(code).toContain('setError("Import history unavailable. Please try again.")');
  expect(code).not.toContain("setError(e.message)");
 });
});
