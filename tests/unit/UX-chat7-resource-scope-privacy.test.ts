import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const read=()=>readFileSync("src/components/courses/lesson-resource-materials-control.tsx","utf8");
describe("LEARNER-RESOURCE-SCOPE-12 stale Section/acting college material isolation",()=>{
 it("clears previous private material state immediately when the content or Section URL changes",()=>{
  const src=read();
  expect(src).toContain("if(prevUri!==uri)");
  for(const reset of [
   "setMaterials([])","setDraft(blank)","setEditing(null)",
   "setBusy(false)","setError(null)","setLoading(true)",
  ])expect(src).toContain(reset);
  expect(src).toContain("currentUriRef.current=uri");
 });
 it("ignores a slow request from a previous Section even if the fetch returned successfully",()=>{
  const src=read();
  expect(src).toContain("!controller.signal.aborted&&currentUriRef.current===uri");
  expect(src).toContain("if(currentUriRef.current===uri)setMaterials(");
  expect(src).toContain("if(currentUriRef.current!==uri)return");
 });
 it("a stale prior-tenant mutation never overwrites the new scope's notices, draft or busy state",()=>{
  const src=read();
  expect(src).toContain("if(currentUriRef.current===uri)setError(");
  expect(src).toContain("if(currentUriRef.current===uri)setBusy(false)");
  const guard=src.indexOf("if(currentUriRef.current!==uri)return");
  const mutation=src.indexOf("setNotice(action===");
  expect(guard).toBeGreaterThan(0);
  expect(mutation).toBeGreaterThan(guard);
 });
 it("requires a permissioned delivery route rather than constructing a raw college-supplied URL",()=>{
  const src=read();
  expect(src).toContain('encodeURIComponent(contentId)+"/materials"');
  expect(src).toContain('encodeURIComponent(deliveryId)');
  expect(src).toContain('cache:"no-store"');
 });
});
