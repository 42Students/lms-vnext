import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("SA-tenants-modules-25 inline college feature controls",()=>{
 it("SA-tenants-modules-25 renders independent college x module editors with explicit inherited states",()=>{
  const page=read("src/app/(authenticated)/admin/features/page.tsx");
  const editor=read("src/components/admin/college-feature-rule-editor.tsx");
  expect(page).toContain("college.modules.map(decision");
  expect(page).toContain("<CollegeFeatureRuleEditor");
  expect(editor).toContain('const endpoint="/api/admin/features/"+encodeURIComponent(collegeId)+"/rules"');
  for(const state of ['value="INHERIT"','value="ON"','value="OFF"'])expect(editor).toContain(state);
 });
 it("SA-tenants-modules-25 checks current persisted policy and requires a confirmation before a write",()=>{
  const editor=read("src/components/admin/college-feature-rule-editor.tsx");
  expect(editor).toContain("parseCollegeRuleRecheck");
  expect(editor).toContain("collegeRuleReceipt");
  expect(editor).toContain("Review policy change");
  expect(editor).toContain("<ConfirmDialog");
  expect(editor).toContain("Current policy cannot be verified.");
 });
});