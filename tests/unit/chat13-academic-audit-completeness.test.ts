import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin audit coverage across academic and people mutations",()=>{
 it("SA-academics-people-R04 records period cohort and section mutations with the same transaction",()=>{
  const paths=["period","cohort","section"].map(x=>"src/modules/academics/"+x+"-service.ts");
  for(const path of paths){
   const service=read(path);
   expect((service.match(/db.transaction\(async \(tx\)/g)||[]).length).toBeGreaterThanOrEqual(3);
   expect((service.match(/recordActivityEventInTransaction\(tx,context/g)||[]).length).toBe(3);
  }
 });
 it("SA-academics-people-R04 verifies people onboarding, roles and lifecycle events in repository",()=>{
  const repo=read("src/modules/people/repository.ts");
  for(const name of ["IDENTITY_PERSON_ONBOARDED","IDENTITY_ROLES_CHANGED"])
   expect(repo).toContain(name);
  expect(repo).toContain("transitionMembershipLifecycle(");
  expect((repo.match(/recordActivityEventInTransaction\(/g)||[]).length).toBeGreaterThanOrEqual(4);
 });
 it("SA-academics-people-R04 preserves attendance policy audit in same transaction",()=>{
  const src=read("src/modules/attendance/policy-service.ts");
  expect(src).toContain('eventType: "ATTENDANCE_POLICY_UPDATED"');
  expect(src).toContain("await tx.insert(activityEvents)");
 });
});
