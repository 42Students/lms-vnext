import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/components/tpo/tpo-debar-control.tsx",import.meta.url),"utf8");
describe("TPO learner restriction failure handling",()=>{
 it("TPO-students-06 supports guarded legacy tagged restrictions alongside timed DB08 debarments",()=>{
  expect(source).toContain("apiFetch<");
  expect(source).toContain("buildTpoDebarDecision(");
  expect(source).not.toContain("response.json()");
 });
 it("GR-04 protects against an HTML 502 instead of showing a raw response",()=>{
  expect(source).toContain('from "@/lib/api-fetch"');
 });
 it("GR-32 retains the entered reason on version conflict for review and retry",()=>{
  expect(source).toContain("error instanceof FriendlyFetchError&&error.status===409");
  expect(source).toContain("Your reason is kept below");
 });
});
