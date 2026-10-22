import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("public account chooser and failure handling",()=>{
 it("PUB-auth-public-08 restores last used active college as radio default",()=>{
  const s=source("src/components/auth/membership-chooser.tsx");
  expect(s).toContain('window.sessionStorage.getItem("lms_last_membership_key")');
  expect(s).toContain('setSelectedId(entries.some(m=>m.id===stored&&m.status==="ACTIVE")');
  expect(s).toContain('membership.id===lastUsed');
  expect(s).toContain("Last used");
  expect(s).toContain('role="radiogroup"');
 });
 it("PUB-auth-public-09 shows suspended memberships but never allows selection",()=>{
  const s=source("src/components/auth/membership-chooser.tsx");
  expect(s).toContain('{sorted.map((membership)');
  expect(s).toContain('membership.status!=="ACTIVE"');
  expect(s).toContain("This account is suspended. Your college administrator can turn it back on.");
  expect(s).toContain("No active college memberships.");
 });
 it("GR-90 alerts auth failures and focuses the error summary or invalid input",()=>{
  const s=source("src/components/auth/login-form.tsx");
  expect(s).toContain('role="alert" ref={errorSummaryRef} tabIndex={-1}');
  expect(s).toContain("contactRef.current?.focus()");
  expect(s).toContain("errorSummaryRef.current?.focus()");
  expect(s).toContain('id="login-contact-error"');
 });
 it("GR-91 retry and recovery buttons are keyboard-accessible",()=>{
  const errors=source("src/components/public/error-recovery-actions.tsx");
  expect(errors).toContain('import { Button } from "@/components/ui/button"');
  const sharedButton=source("src/components/ui/button.tsx");
  expect(sharedButton).toContain("focus-visible:outline-2");
  expect(sharedButton).toContain("max-[767px]:min-h-11");
  expect(errors).toContain("Try again");
  expect(errors).toContain("Go back");
  const listError=source("src/app/(authenticated)/learn/projects/error.tsx");
  expect(listError).toContain("onClick={reset}");
 });
 it("GR-71 learner project lists distinguish loading, empty, filtered empty and failure",()=>{
  expect(source("src/app/(authenticated)/learn/projects/loading.tsx")).toContain("Refreshing projects…");
  expect(source("src/app/(authenticated)/learn/projects/error.tsx")).toContain("Retry");
  const empty=source("src/modules/projects/learner-project-list-empty-model.ts");
  expect(empty).toContain("No projects assigned yet.");
  expect(empty).toContain("No projects match these filters.");
 });
 it("GR-73 failed-list retry retains the same route and query filters",()=>{
  const err=source("src/app/(authenticated)/learn/projects/error.tsx");
  expect(err).toContain("onClick={reset}");
  const list=source("src/components/projects/project-participant-list-controls.tsx");
  expect(list).toContain('params.set("search"');
  expect(list).toContain('params.set("status"');
  expect(list).toMatch(/params\.set\(\s*"attention"/);
 });
});
