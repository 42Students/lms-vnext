import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {
 parseModuleMetricsCollegeIds,assertModuleMetricsCollegeScopes,
} from "@/modules/module-access/admin-overview-metrics-scope";

const college="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const org="33333333-3333-4333-8333-333333333333";
const otherOrg="44444444-4444-4444-8444-444444444444";
const root:RequestContext={
 user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"admin",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
const first={id:college,organizationId:org,status:"ACTIVE"};
const another={id:other,organizationId:otherOrg,status:"ACTIVE"};

describe("SA-tenants-modules-R01 module access overview only counts authorized students",()=>{
 it("accepts at most 100 unique UUIDs and refuses wrong keys before querying the database",()=>{
  expect(parseModuleMetricsCollegeIds([])).toEqual([]);
  expect(parseModuleMetricsCollegeIds([college,other])).toEqual([college,other]);
  for(const bad of [[college,college],["../tenant"],["not-a-uuid"],
   Array.from({length:101},(_,i)=>i===0?college:other)]){
   expect(()=>parseModuleMetricsCollegeIds(bad)).toThrow(AuthorizationError);
  }
 });
 it("accepts visible active colleges in the Super Admin's exact selected scope",()=>{
  expect(()=>assertModuleMetricsCollegeScopes(root,[college,other],[first,another])).not.toThrow();
  const orgScoped={...root,adminScope:{organizationId:org,collegeId:null}};
  expect(()=>assertModuleMetricsCollegeScopes(orgScoped,[college],[first])).not.toThrow();
  expect(()=>assertModuleMetricsCollegeScopes(orgScoped,[other],[another])).toThrow(AuthorizationError);
  const collegeScoped={...root,adminScope:{organizationId:org,collegeId:college}};
  expect(()=>assertModuleMetricsCollegeScopes(collegeScoped,[college],[first])).not.toThrow();
  expect(()=>assertModuleMetricsCollegeScopes(collegeScoped,[other],[another])).toThrow(AuthorizationError);
 });
 it("rejects orphaned, inactive or cross-organization counts before issuing aggregate queries",()=>{
  expect(()=>assertModuleMetricsCollegeScopes(root,[college],[])).toThrow(AuthorizationError);
  expect(()=>assertModuleMetricsCollegeScopes(root,[college],[{...first,status:"ARCHIVED"}]))
   .toThrow(AuthorizationError);
  expect(()=>assertModuleMetricsCollegeScopes(root,[college],[another])).toThrow(AuthorizationError);
  const expired={...root,user:{...root.user,platformStatus:"DISABLED" as const}};
  const roleless={...root,user:{...root.user,systemRoles:[] as const}};
  expect(()=>assertModuleMetricsCollegeScopes(expired,[college],[first])).toThrow(AuthorizationError);
  expect(()=>assertModuleMetricsCollegeScopes(roleless,[college],[first])).toThrow(AuthorizationError);
 });
 it("counts only live learners' memberships and their membership-scoped rules",()=>{
  const service=readFileSync("src/modules/module-access/admin-overview-metrics-service.ts","utf8");
  const verify=service.indexOf("assertModuleMetricsCollegeScopes(context,ids,visible)");
  const aggregates=service.indexOf("Promise.all([");
  expect(verify).toBeGreaterThan(0);
  expect(aggregates).toBeGreaterThan(verify);
  expect(service).toContain("countDistinct(collegeMemberships.id)");
  expect(service).toContain("countDistinct(moduleAccessRules.id)");
  expect(service).toContain('eq(membershipRoles.role,"LEARNER")');
  expect(service).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(service).toContain('eq(moduleAccessRules.scopeType,"MEMBERSHIP")');
  expect(service).toContain("inArray(collegeMemberships.collegeId,ids)");
 });
});
