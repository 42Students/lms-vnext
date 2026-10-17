import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("chat-12 touched TPO pages degrade gracefully",()=>{
 it("TPO-requests-verification-18 / GR-19 / GR-20 provide request loading and friendly error screens",()=>{
  const loading=read("src/app/(authenticated)/tpo/requests/loading.tsx");
  const error=read("src/app/(authenticated)/tpo/requests/error.tsx");
  expect(loading).toContain('aria-busy="true"');
  expect(loading).toContain('role="status"');
  expect(error).toContain('role="alert"');
  expect(error).toContain("Retry requests");
  expect(error).not.toContain("error.message");
 });
 it("GR-71 / GR-73 keep filters on requests and verification failure with a keyboard retry",()=>{
  for(const path of ["src/app/(authenticated)/tpo/requests/error.tsx","src/app/(authenticated)/tpo/verification/error.tsx"]){
   const source=read(path);
   expect(source).toContain("onClick={reset}");
   expect(source).toContain("focus-visible:ring-2");
   expect(source).toContain("role=\"alert\"");
  }
 });
 it("GR-90 / GR-91 offer plain announced retryable student-panel errors",()=>{
  const panel=read("src/components/tpo/tpo-student-quick-panel.tsx");
  expect(panel).toContain("Retry loading student details");
  expect(panel).toContain('role="alert"');
  expect(panel).not.toContain("body?.error??");
 });
 it("GR-32 preserves the academic import draft on conflict and never renders the raw backend code",()=>{
  const source=read("src/components/tpo/tpo-academic-import-workspace.tsx");
  expect(source).toContain("This changed while you were working.");
  expect(source).toContain("Your academic import choices are kept below");
  expect(source).toContain("cause instanceof FriendlyFetchError && cause.status===409");
  expect(source).not.toContain("window.confirm(");
  expect(source).not.toContain("body?.error");
 });
 it("GR-31 blocks duplicate sends and hides backend error codes from TPO messages",()=>{
  const source=read("src/components/tpo/tpo-student-nudge-panel.tsx");
  expect(source).toContain("apiFetch<");
  expect(source).toContain("disabled={pending");
  expect(source).not.toContain("data.error");
 });
 it("GR-72 keeps verified rows visible when individual bulk decisions fail",()=>{
  const source=read("src/components/tpo/tpo-roster-verification-bulk.tsx");
  expect(source).toContain("setOutcomes(result.outcomes)");
  expect(source).toContain('role="alert"');
  expect(source).not.toContain("result?.error??");
 });
});
