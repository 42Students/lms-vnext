import {describe,expect,it} from "vitest";
import {superAdminReadinessQuerySchema,visibleReadinessChecks} from "@/modules/colleges/admin-readiness-filter";
import type {CollegeReadinessCheck} from "@/modules/colleges/readiness-model";
const rows:CollegeReadinessCheck[]=[
 {id:"COLLEGE_ACTIVE",label:"Active",status:"PASS",evidence:"",remediation:""},
 {id:"LEARNERS",label:"Learners",status:"FAIL",evidence:"",remediation:""},
 {id:"TENANT_DOMAIN",label:"DNS",status:"UNKNOWN",evidence:"",remediation:""},
];
describe("Super Admin readiness subset",()=>{
 it("preserves the global ten-check verdict while displaying unresolved work",()=>{
  expect(visibleReadinessChecks(rows,"NEEDS_ATTENTION").map(x=>x.id)).toEqual(["LEARNERS","TENANT_DOMAIN"]);
  expect(visibleReadinessChecks(rows,"FAIL")).toHaveLength(1);
  expect(visibleReadinessChecks(rows,"UNKNOWN")).toHaveLength(1);
  expect(rows).toHaveLength(3);
  expect(visibleReadinessChecks(rows,"NEEDS_ATTENTION","DOMAINS").map(x=>x.id)).toEqual(["TENANT_DOMAIN"]);
 });
 it("rejects ambiguous status and setup areas",()=>{
  expect(superAdminReadinessQuerySchema.safeParse({status:"READY"}).success).toBe(false);
  expect(superAdminReadinessQuerySchema.safeParse({area:"SECRETS"}).success).toBe(false);
 });
});
