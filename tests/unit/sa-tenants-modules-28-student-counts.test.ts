import {it,expect} from "vitest";
import {academicScopeStudents} from "@/modules/module-access/admin-descendant-rule-model";
it("SA-tenants-modules-28 separates student totals by scope type and scope ID",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 const totals=academicScopeStudents([
  {scopeType:"SECTION",scopeId:id,studentsInScope:12},
  {scopeType:"COHORT",scopeId:id,studentsInScope:44},
 ]);
 expect(totals.get("SECTION:"+id)).toBe(12);
 expect(totals.get("COHORT:"+id)).toBe(44);
});
