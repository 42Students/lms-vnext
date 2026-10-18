import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {
 newHarnessPool,withProjectPg,createTenant,createPrincipal,createPlacementFixture,
} from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{await pool?.end();});

/** HR-GRANT-EXPIRE-39: use real PostgreSQL and rollback-only fixtures.
 * This checks the exact fail-closed conditions used by recruiter job, round,
 * slot, company-team and applicant-count authorization predicates.
 */
describe("HR-GRANT-EXPIRE-39 persisted recruiter grant and relationship gates",()=>{
 it("denies pending, missing-expiry, expired, wrong-capability and revoked grants",async()=>{
  await withProjectPg(pool,async db=>{
   const tenant=await createTenant(db,"HR grant expiry");
   const tpo=await createPrincipal(db,tenant,["TPO"]);
   const recruiter=await createPrincipal(db,null,[]);
   const job=await createPlacementFixture(db,tenant,tpo);
   await db.query(`
    insert into placement_recruiter_profiles(user_id,company_id,created_by_user_id)
    values ($1,$2,$3)`,[recruiter.userId,job.companyId,tpo.userId]);
   const [grant]=await db.query<{id:string}>(`
    insert into placement_recruiter_college_grants
      (recruiter_user_id,company_relationship_id,granted_by_user_id,
       status,verification_status,valid_until,capabilities)
    values ($1,$2,$3,'ACTIVE','VERIFIED',$4,ARRAY['DRIVES','MESSAGES']::text[])
    returning id`,[recruiter.userId,job.relationshipId,tpo.userId,
     new Date("2099-01-01T00:00:00.000Z")]);
   expect(grant?.id).toBeTruthy();

   const authorized=async()=>db.query<{id:string}>(`
    select g.id from placement_recruiter_college_grants g
    join placement_recruiter_profiles p
      on p.user_id=g.recruiter_user_id and p.status='ACTIVE'
    join placement_company_relationships r
      on r.id=g.company_relationship_id and r.company_id=p.company_id
      and r.status='ACTIVE'
    join placement_companies c
      on c.id=r.company_id and c.status='ACTIVE'
    join colleges co
      on co.id=r.college_id and co.status='ACTIVE'
    join users u
      on u.id=g.recruiter_user_id and u.platform_status='ACTIVE'
    where g.recruiter_user_id=$1 and g.company_relationship_id=$2
      and g.status='ACTIVE' and g.verification_status='VERIFIED'
      and g.valid_until>now() and 'DRIVES'=ANY(g.capabilities)
   `,[recruiter.userId,job.relationshipId]);

   expect((await authorized()).map(row=>row.id)).toEqual([grant!.id]);
   for(const [field,value] of [
    ["valid_until",null],
    ["valid_until",new Date("2000-01-01T00:00:00.000Z")],
    ["verification_status","PENDING"],
    ["capabilities",["MESSAGES"]],
    ["status","REVOKED"],
   ] as const){
    await db.savepoint(async()=>{
     // Parameterized values; only field names from the hardcoded allowlist.
     await db.query(`update placement_recruiter_college_grants
      set ${field}=$1 where id=$2`,[value,grant!.id]);
     expect(await authorized()).toEqual([]);
    },true);
   }
   expect((await authorized()).map(row=>row.id)).toEqual([grant!.id]);
   const wrong=await db.query<{id:string}>(`
    select id from placement_recruiter_college_grants
    where recruiter_user_id=$1 and company_relationship_id=$2`,
    [recruiter.userId,tenant.collegeId]);
   expect(wrong).toEqual([]);
  });
 });
});
