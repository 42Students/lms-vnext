import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("SA-tenants-modules-29 population-aware confirmation",()=>{
 it("SA-tenants-modules-29 fetches verified active population, otherwise fails closed",()=>{
  const s=read("src/components/admin/college-feature-rule-editor.tsx");
  expect(s).toContain('"/impact?module="+encodeURIComponent(module)');
  expect(s).toContain("const canSave=students!==null&&(students<100||acknowledgedPopulation)");
  expect(s).toContain("Student population could not be confirmed. The change will not be saved.");
  expect(s).toContain("confirmDisabled={busy||impactBusy||!dirty||(ancestorLocked&&choice!==\"INHERIT\")||!canSave}");
 });
 it("SA-tenants-modules-29 requires acknowledgement at 100 learners and separately warns for lock changes",()=>{
  const s=read("src/components/admin/college-feature-rule-editor.tsx");
  expect(s).toContain("students<100||acknowledgedPopulation");
  expect(s).toContain("I understand this may change access for");
  expect(s).toContain("Confirm college feature lock change");
  expect(s).toContain("Descendant overrides may gain or lose the ability to take effect.");
 });
});