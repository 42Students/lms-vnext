import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {adminControlScopeTag,adminControlFeatureCounts} from "@/modules/module-access/admin-control-overview-model";
const read=(path:string)=>readFileSync(path,"utf8");
describe("Super Admin control-page overview final sprint",()=>{
 it("SA-tenants-modules-R01 displays accurate scope wording without assuming unselected tenant access",()=>{
  expect(adminControlScopeTag(null)).toBe("Platform view");
  expect(adminControlScopeTag({organizationId:"org"})).toBe("Organization scope");
  expect(adminControlScopeTag({organizationId:"org",collegeId:"college"})).toBe("One college");
  expect(adminControlFeatureCounts([
   {modules:[{module:"projects",enabled:true},{module:"placements",enabled:false}]},
   {modules:[{module:"projects",enabled:true},{module:"placements",enabled:true}]},
  ])).toEqual({projectsOn:2,placementsOn:1,shown:2});
 });
 it("SA-tenants-modules-R01 restores all three header-card contracts with truthful bounded counters",()=>{
  const features=read("src/app/(authenticated)/admin/features/page.tsx");
  const access=read("src/app/(authenticated)/admin/module-access/page.tsx");
  const settings=read("src/app/(authenticated)/admin/settings/page.tsx");
  for(const word of ["Module availability","Optional modules by college","Colleges in scope","Projects on","Placements on"])
   expect(features).toContain(word);
  for(const word of ["Effective access","Optional module access hierarchy","Hierarchy scopes","Students in largest scope","Student overrides"])
   expect(access).toContain(word);
  for(const word of ["Runtime configuration","Settings with explicit execution scope","Documented controls","Stored keys","Editing"])
   expect(settings).toContain(word);
  expect(features).toContain("adminControlScopeTag(context.adminScope)");
  expect(access).toContain("getModuleAccessOverviewMetrics(context,result.items.map(item=>item.id))");
  expect(settings).toContain("editorData?.ready?editorData.entries.length");
 });
 it("SA-tenants-modules-R01 never inflates visible module counts with disabled or duplicate settings",()=>{
  expect(adminControlFeatureCounts([])).toEqual({projectsOn:0,placementsOn:0,shown:0});
  expect(adminControlFeatureCounts([
   {modules:[{module:"projects",enabled:false},{module:"placements",enabled:true}]},
   {modules:[{module:"projects",enabled:true},{module:"projects",enabled:true},{module:"placements",enabled:false}]},
   {modules:[]},
  ])).toEqual({projectsOn:1,placementsOn:1,shown:3});
  expect(adminControlScopeTag({collegeId:null,organizationId:null})).toBe("Platform view");
  expect(adminControlScopeTag({collegeId:"college-b",organizationId:"org-a"})).toBe("One college");
 });
 it("SA-tenants-modules-R01 never computes learner or override counts outside the selected authorized college page",()=>{
  const service=read("src/modules/module-access/admin-overview-metrics-service.ts");
  expect(service).toContain('requirePermission(context,"admin-scope.select")');
  expect(service).toContain("parseModuleMetricsCollegeIds(visibleCollegeIds)");
  expect(service).toContain("assertModuleMetricsCollegeScopes(context,ids,visible)");
  expect(service).toContain("inArray(collegeMemberships.collegeId,ids)");
  expect(service).toContain('eq(membershipRoles.role,"LEARNER")');
  expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(service).toContain('eq(moduleAccessRules.scopeType,"MEMBERSHIP")');
  expect(service).toContain('eq(collegeMemberships.status,"ACTIVE")');
 });
});