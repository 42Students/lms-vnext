import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {createPrincipal,createProjectFixture,createTenant,
 newHarnessPool,withProjectPg,type PgHarness}
 from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{if(pool)await pool.end();});

/** Mirrors the persisted identity and live roster joins in projects/access.ts;
 * this SQL integration witness does not substitute for the external HTTP gate. */
async function liveMentorRows(db:PgHarness,projectId:string,membershipId:string,
 actorId:string,collegeId:string){
 return db.query<{id:string;can_mutate:boolean;role_kind:string}>(`
  select pm.id,pm.can_mutate,pm.role_kind::text as role_kind
    from project_members pm
    join college_memberships cm on cm.id=pm.membership_id
    join users u on u.id=cm.user_id
    join membership_roles mr on mr.membership_id=cm.id
       and mr.role::text=pm.role::text
   where pm.project_id=$1 and pm.membership_id=$2
     and pm.ended_at is null and pm.role='MENTOR'
     and cm.college_id=$4 and cm.user_id=$3
     and cm.status='ACTIVE' and u.platform_status='ACTIVE'`,
  [projectId,membershipId,actorId,collegeId]);
}
async function fixture(db:PgHarness){
 const home=await createTenant(db,"Faculty project home");
 const foreign=await createTenant(db,"Faculty project outsider");
 const admin=await createPrincipal(db,home,["COLLEGE_ADMIN"]);
 const mentor=await createPrincipal(db,home,["MENTOR","FACULTY"]);
 const learner=await createPrincipal(db,home,["LEARNER"]);
 const other=await createPrincipal(db,foreign,["MENTOR","FACULTY"]);
 const project=await createProjectFixture(db,home,admin,mentor,learner);
 return {home,foreign,mentor,learner,other,project};
}

describe("PROJ-BREAK-FACULTY-PG-01 persisted Mentor identity/tenant access predicates",()=>{
 it("a currently assigned Faculty/Mentor requires live project grant, current user, role and college",async()=>{
  await withProjectPg(pool,async db=>{
   const f=await fixture(db);
   const direct=await liveMentorRows(db,f.project.projectId,
    f.mentor.membershipId!,f.mentor.userId,f.home.collegeId);
   expect(direct).toHaveLength(1);
   expect(direct[0]!.role_kind).toBe("MENTOR");
   expect(await liveMentorRows(db,f.project.projectId,
    f.other.membershipId!,f.other.userId,f.home.collegeId)).toHaveLength(0);
   expect(await liveMentorRows(db,f.project.projectId,
    f.mentor.membershipId!,f.other.userId,f.home.collegeId)).toHaveLength(0);
   expect(await liveMentorRows(db,f.project.projectId,
    f.mentor.membershipId!,f.mentor.userId,f.foreign.collegeId)).toHaveLength(0);
   expect(await liveMentorRows(db,f.project.projectId,
    f.learner.membershipId!,f.learner.userId,f.home.collegeId)).toHaveLength(0);
  });
 });
 it("suspended/ended membership and disabled principal cannot reuse project URL or mentor grant",async()=>{
  for(const change of [
   "update college_memberships set status='SUSPENDED' where id=$1",
   "update college_memberships set status='ENDED' where id=$1",
   "update users set platform_status='DISABLED' where id=$1",
  ]){
   await withProjectPg(pool,async db=>{
    const f=await fixture(db);
    await db.query(change,[change.includes("users")?f.mentor.userId:f.mentor.membershipId]);
    const rows=await liveMentorRows(db,f.project.projectId,
     f.mentor.membershipId!,f.mentor.userId,f.home.collegeId);
    expect(rows).toHaveLength(0);
   });
  }
 });
 it("removing the persisted MENTOR role invalidates an otherwise live project assignment",async()=>{
  await withProjectPg(pool,async db=>{
   const f=await fixture(db);
   await db.query("delete from membership_roles where membership_id=$1 and role='MENTOR'",
    [f.mentor.membershipId]);
   expect(await liveMentorRows(db,f.project.projectId,
    f.mentor.membershipId!,f.mentor.userId,f.home.collegeId)).toHaveLength(0);
  });
 });
 it("ending project membership and setting read-only mutation bits cannot retain write permissions",async()=>{
  await withProjectPg(pool,async db=>{
   const f=await fixture(db);
   await db.query("update project_members set can_mutate=false where id=$1",
    [f.project.mentorMemberId]);
   const readOnly=await liveMentorRows(db,f.project.projectId,
    f.mentor.membershipId!,f.mentor.userId,f.home.collegeId);
   expect(readOnly).toHaveLength(1);
   expect(readOnly[0]!.can_mutate).toBe(false);
   await db.query("update project_members set ended_at=now() where id=$1",
    [f.project.mentorMemberId]);
   expect(await liveMentorRows(db,f.project.projectId,
    f.mentor.membershipId!,f.mentor.userId,f.home.collegeId)).toHaveLength(0);
  });
 });
});
