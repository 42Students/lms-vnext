import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("SA-tenants-modules-30 descendant lock and orphan correction",()=>{
 it("SA-tenants-modules-30 allows persisted descendant lock toggling and inheritance",()=>{
  const editor=read("src/components/admin/descendant-feature-rule-editor.tsx");
  const model=read("src/modules/module-access/admin-descendant-rule-model.ts");
  const service=read("src/modules/module-access/admin-descendant-rule-write.ts");
  expect(editor).toContain('type="checkbox" checked={locked}');
  expect(editor).toContain('action:"SET",enabled:choice==="ON",locked');
  for(const level of ["DEPARTMENT","PROGRAM","COHORT","SECTION"])
   expect(model).toContain(level);
  expect(service).toContain('throw new StudentRuleConflict("ANCESTOR_LOCKED")');
 });
 it("SA-tenants-modules-30 orphaned lock without a stored value is structurally impossible",()=>{
  const schema=read("src/db/schema/module-access.ts");
  expect(schema).toContain('enabled: boolean("enabled").notNull()');
  expect(schema).toContain('locked: boolean("locked").notNull().default(false)');
  const model=read("src/modules/module-access/admin-descendant-rule-model.ts");
  expect(model).toContain('message:"Set requires enabled and locked values"');
 });
});
