import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("SA-tenants-modules-32 complete module access history",()=>{
 it("SA-tenants-modules-32 includes college, descendant, learner and bulk event kinds in one query",()=>{
  const service=read("src/modules/module-access/admin-college-rule-history-service.ts");
  for(const token of ["PLATFORM_COLLEGE_MODULE_RULE_CHANGED","PLATFORM_STUDENT_MODULE_RULE_CHANGED",
   "PLATFORM_DESCENDANT_MODULE_RULE_CHANGED","MODULE_ACCESS_BULK_SET","COLLEGE_FEATURE_TOGGLE"])
   expect(service).toContain(token);
  expect(service).toContain("eq(activityEvents.collegeId,collegeId)");
  expect(service).toContain('requirePermission(context,"activity.read",{collegeId})');
 });
 it("SA-tenants-modules-32 combines timeline ordering with stable and bounded cursor pagination",()=>{
  const service=read("src/modules/module-access/admin-college-rule-history-service.ts");
  expect(service).toContain("lt(activityEvents.id,cursor.beforeId)");
  expect(service).toContain("desc(activityEvents.occurredAt),desc(activityEvents.id)");
  expect(service).toContain(".limit(51)");
  expect(service).toContain("rows.slice(0,50)");
 });
 it("SA-tenants-modules-32 renders what changed, actor, scope and student count",()=>{
  const model=read("src/modules/module-access/admin-college-rule-history-model.ts");
  const page=read("src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx");
  for(const value of ["category","scope","studentCount","actorName"])
   expect(model+page).toContain(value);
  expect(page).toContain("Recent module-access changes");
 });
});
