import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {
 newHarnessPool,withProjectPg,createTenant,createPrincipal,createProjectFixture,
} from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{if(pool)await pool.end();});

/**
 * Real PostgreSQL witness of the same membership/college/role join used by
 * requireProjectReadAccess. Fixtures live inside rollback-only transactions.
 * This proves SQL scoping, NOT an HTTP or separate-connection service call.
 */
async function fixture(){
 return withProjectPg(pool,async db=>{
  const college=await createTenant(db,"IIT Dharwad TPO isolation");
  const foreign=await createTenant(db,"External university");
  const admin=await createPrincipal(db,college,["COLLEGE_ADMIN"]);
  const mentor=await createPrincipal(db,college,["MENTOR"]);
  const learner=await createPrincipal(db,college,["LEARNER"]);
  const tpo=await createPrincipal(db,college,["TPO"]);
  const outsider=await createPrincipal(db,foreign,["TPO"]);
  const project=await createProjectFixture(db,college,admin,mentor,learner);
  const query=async(membershipId:string,collegeId:string)=>
   db.query<{membership_id:string,project_id:string}>(`
    select pm.membership_id,pm.project_id
    from project_instances p
    inner join project_members pm on pm.project_id=p.id and pm.ended_at is null
    inner join college_memberships cm
      on cm.id=pm.membership_id and cm.college_id=p.college_id
    inner join users u on u.id=cm.user_id and u.platform_status='ACTIVE'
    inner join membership_roles mr on mr.membership_id=pm.membership_id
      and mr.role::text=pm.role
    where p.id=$1 and p.college_id=$2 and cm.id=$3 and cm.status='ACTIVE'`,
    [project.projectId,collegeId,membershipId]);
  expect(await query(learner.membershipId!,college.collegeId))
   .toMatchObject([{project_id:project.projectId,membership_id:learner.membershipId}]);
  expect(await query(tpo.membershipId!,college.collegeId)).toEqual([]);
  expect(await query(outsider.membershipId!,college.collegeId)).toEqual([]);
  expect(await query(learner.membershipId!,foreign.collegeId)).toEqual([]);
  await db.query("delete from membership_roles where membership_id=$1 and role='LEARNER'",
   [learner.membershipId]);
  expect(await query(learner.membershipId!,college.collegeId)).toEqual([]);
 });
}
describe("PROJ-BREAK-TPO-DB-01 canonical Projects roster SQL isolation",()=>{
 it("protects workspace members from unassigned TPO, wrong tenant and revoked project roles",async()=>{
  await fixture();
 });
});
