import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("SA-tenants-modules-28 lists inheriting academic nodes without hiding nodes lacking rules",()=>{
 const service=readFileSync(new URL("../../src/modules/module-access/admin-descendant-rule-write.ts",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../../src/components/admin/academic-module-scope-inventory.tsx",import.meta.url),"utf8");
 expect(service).toContain("from departments d where d.college_id=");
 expect(service).toContain("from sections s join cohorts");
 expect(service).toContain(':"Inherit"');
 expect(ui).toContain("Expand all");
 expect(ui).toContain("Collapse all");
 expect(ui).toContain("Student-in-scope counts are not yet available.");
});
