import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {
  createPrincipal,createProjectFixture,createTenant,newHarnessPool,withProjectPg,
} from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{if(pool)await pool.end();});

describe("PROJ-BREAK-SA-36 registered PostgreSQL mentor identity safety",()=>{
  it("drops a disabled primary mentor from both the admin cards and risk-queue relationship joins",async()=>{
    await withProjectPg(pool,async db=>{
      const owner=await createTenant(db,"Mentor revocation A");
      const other=await createTenant(db,"Mentor revocation B");
      const author=await createPrincipal(db,owner,["COLLEGE_ADMIN"]);
      const mentor=await createPrincipal(db,owner,["MENTOR"]);
      const learner=await createPrincipal(db,owner,["LEARNER"]);
      const outsider=await createPrincipal(db,other,["MENTOR"]);
      const project=await createProjectFixture(db,owner,author,mentor,learner);

      const query=async()=>db.query<{membership_id:string}>(`
        select pm.membership_id
        from project_members pm
        join college_memberships cm on cm.id=pm.membership_id
          and cm.college_id=$2 and cm.status='ACTIVE'
        join users u on u.id=cm.user_id and u.platform_status='ACTIVE'
        where pm.project_id=$1 and pm.role='MENTOR'
          and pm.ended_at is null
        order by pm.id`,[project.projectId,owner.collegeId]);
      expect((await query()).map(row=>row.membership_id)).toEqual([mentor.membershipId]);

      // The project member row still exists, but revoked identity can
      // no longer be presented as a live mentor.
      await db.query(`update users set platform_status='DISABLED' where id=$1`,[mentor.userId]);
      expect(await query()).toEqual([]);
      const unguarded=await db.query<{membership_id:string}>(`
        select pm.membership_id
        from project_members pm
        join college_memberships cm on cm.id=pm.membership_id
          and cm.college_id=$2 and cm.status='ACTIVE'
        join users u on u.id=cm.user_id
        where pm.project_id=$1 and pm.role='MENTOR' and pm.ended_at is null`,
        [project.projectId,owner.collegeId]);
      expect(unguarded).toEqual([{membership_id:mentor.membershipId}]);
      expect((await query()).some(row=>row.membership_id===outsider.membershipId)).toBe(false);
    });
  });
});
