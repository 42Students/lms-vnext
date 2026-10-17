import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listCollegeRoleDirectory} from "@/modules/people/college-role-directory-service";
import {exportCollegeRoleDirectoryCsv} from "@/modules/people/college-role-directory-export-service";
import {getCollegePersonAudit} from "@/modules/people/college-person-audit-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB09_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const admin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"college-people-verifier",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const otherCollege:RequestContext={...admin,membership:{
 ...admin.membership!,collegeId:SEED_IDS.collegeB,
}};
const learner:RequestContext={...admin,membership:{
 ...admin.membership!,roles:["LEARNER"],
}};
describe.skipIf(!enabled)("College People verified gap contracts with real PostgreSQL",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("COL-people-17 / COL-people-08 directory lists actual own-college faculty and students, never foreign role memberships",async()=>{
  const faculty=await listCollegeRoleDirectory(admin,"FACULTY",{});
  const students=await listCollegeRoleDirectory(admin,"LEARNER",{});
  expect(faculty.items.map(row=>row.membershipId)).toContain(SEED_IDS.facultyCollegeAMembership);
  expect(faculty.items.map(row=>row.membershipId)).not.toContain(SEED_IDS.facultyCollegeBMembership);
  expect(students.items.map(row=>row.membershipId)).toContain(SEED_IDS.learnerCollegeAMembership);
  expect(students.items.map(row=>row.membershipId)).not.toContain(SEED_IDS.facultyCollegeBMembership);
 });
 it("COL-people-15 / COL-people-22 role-aware faculty and learner filters retain tenant isolation",async()=>{
  const faculty=await listCollegeRoleDirectory(admin,"FACULTY",{teaching:"ALL",page:1,pageSize:10});
  expect(faculty.items.every(row=>row.membershipId!==SEED_IDS.facultyCollegeBMembership)).toBe(true);
  await expect(listCollegeRoleDirectory(learner,"FACULTY",{})).rejects.toBeInstanceOf(AuthorizationError);
  await expect(listCollegeRoleDirectory(otherCollege,"LEARNER",{})).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("COL-people-16 faculty CSV is generated only from own-college membership results",async()=>{
  const report=await exportCollegeRoleDirectoryCsv(admin,"FACULTY",{});
  expect(report.csv).toContain('"Name","Email","Membership"');
  expect(report.csv).toContain("Joined (IST)");
  expect(report.exported).toBeLessThanOrEqual(1000);
  await expect(exportCollegeRoleDirectoryCsv(learner,"LEARNER",{})).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("COL-people-10 read-only person audit cannot inspect a foreign college membership",async()=>{
  const audit=await getCollegePersonAudit(admin,SEED_IDS.facultyCollegeAMembership,"FACULTY");
  expect(audit.person.id).toBe(SEED_IDS.facultyCollegeAMembership);
  await expect(getCollegePersonAudit(admin,SEED_IDS.facultyCollegeBMembership,"FACULTY")).rejects.toBeDefined();
 });
});
