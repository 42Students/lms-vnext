import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Chat13 Super Admin interview graceful operation",()=>{
 it("SA-placements-projects-22 confirms audited interview outcomes without browser prompts",()=>{
  const c=source("src/components/placements/college-interview-appointments.tsx");
  expect(c).toContain("confirmDecision()");
  expect(c).toContain("ConfirmDialog");
  expect(c).toContain("NO_SHOW");
  expect(c).toContain("Interview scheduled and candidate notified.");
  expect(c).not.toContain("window.prompt");
 });
 it("GR-35 destructive interview cancellation has a named confirmation dialog",()=>{
  const c=source("src/components/placements/college-interview-appointments.tsx");
  expect(c).toContain('"Cancel interview?"');
  expect(c).toContain("confirmDisabled={decisionReason.trim().length<3}");
 });
 it("GR-90 interview API failures are friendly, persistent and announced with an alert",()=>{
  const c=source("src/components/placements/college-interview-appointments.tsx");
  expect(c).toContain("apiFetch<{status?:string}>");
  expect(c).toContain('role="alert"');
  expect(c).not.toContain("throw Error(data.issues");
 });
});
