import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");

describe("Super Admin assignment and quiz authoring recoverable errors",()=>{
 it("SA-academics-people-64 does not expose unexpected API error identifiers while editing and reviewing assignments",()=>{
  const source=read("src/components/courses/college-assignment-actions.tsx");
  expect(source).toContain("Could not update assignment. Check the form and try again.");
  expect(source).toContain("Could not load assignment settings. Refresh this page and try again.");
  expect(source).not.toContain('typeof data?.error==="string"?data.error');
  expect(source).not.toContain('throw Error(\n        data?.error');
  expect(source).toContain("setBusy(false)");
  expect(source).toContain("Another author edited the assignment.");
 });
 it("SA-academics-people-65 renders friendly failure text for quiz updates and submissions without leaking internal errors",()=>{
  const edit=read("src/components/courses/college-quiz-actions.tsx");
  const attempts=read("src/components/courses/college-quiz-attempts.tsx");
  expect(edit).toContain("Unable to update quiz. Check the form and try again.");
  expect(edit).toContain("Unable to load Quiz metadata. Refresh this page and try again.");
  expect(attempts).toContain("Could not load quiz attempts. Check your selected Section and try again.");
  expect(edit).not.toContain('typeof data?.error==="string"?data.error');
  expect(attempts).not.toContain('typeof data?.error==="string"?data.error');
  expect(edit).toContain("setBusy(false)");
  expect(attempts).toContain("setLoading(false)");
 });
});
