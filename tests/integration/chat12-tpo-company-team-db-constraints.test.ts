import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {
 newHarnessPool,withProjectPg,createTenant,createPrincipal,createPlacementFixture,
} from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{if(pool)await pool.end();});

describe("TPO-BREAK-company-team-PG-01 tenant FK and concurrent-retry invariants",()=>{
 it("enforces same college author and recipient FKs, one send per key and valid ask state",async()=>{
  await withProjectPg(pool,async db=>{
   const own=await createTenant(db,"TPO team isolation");
   const foreign=await createTenant(db,"TPO team foreign college");
   const owner=await createPrincipal(db,own,["TPO"]);
   const outsider=await createPrincipal(db,foreign,["TPO"]);
   const job=await createPlacementFixture(db,own,owner);
   const key=randomUUID();
   const message=await db.query<{id:string}>(`
    insert into placement_tpo_company_team_messages
      (college_id,company_id,author_membership_id,idempotency_key,body)
    values ($1,$2,$3,$4,'Private placement handover') returning id`,
    [own.collegeId,job.companyId,owner.membershipId,key]);
   expect(message).toHaveLength(1);
   // Unique key serializes repeated submissions, not just UI double-clicks.
   await db.expectSqlState(()=>db.query(`
    insert into placement_tpo_company_team_messages
      (college_id,company_id,author_membership_id,idempotency_key,body)
    values ($1,$2,$3,$4,'Private placement handover')`,
    [own.collegeId,job.companyId,owner.membershipId,key]),"23505");
   // A selected company ID cannot be paired with another college's member.
   await db.expectSqlState(()=>db.query(`
    insert into placement_tpo_company_team_messages
      (college_id,company_id,author_membership_id,body)
    values ($1,$2,$3,'Foreign author')`,
    [own.collegeId,job.companyId,outsider.membershipId]),"23503");
   await db.expectSqlState(()=>db.query(`
    insert into placement_tpo_company_team_messages
      (college_id,company_id,author_membership_id,body,ask_assignee_membership_id,ask_status)
    values ($1,$2,$3,'Private ask',$4,'OPEN')`,
    [own.collegeId,job.companyId,owner.membershipId,outsider.membershipId]),"23503");
   await db.expectSqlState(()=>db.query(`
    insert into placement_tpo_company_team_messages
      (college_id,company_id,author_membership_id,body,ask_status)
    values ($1,$2,$3,'Unassigned ask','OPEN')`,
    [own.collegeId,job.companyId,owner.membershipId]),"23514");
   await db.expectSqlState(()=>db.query(`
    insert into placement_tpo_company_team_messages
      (college_id,company_id,author_membership_id,body)
    values ($1,$2,$3,'    ')`,
    [own.collegeId,job.companyId,owner.membershipId]),"23514");
   const follow=await db.query(`
    insert into placement_tpo_company_team_follows
      (college_id,company_id,membership_id)
    values ($1,$2,$3) returning membership_id`,
    [own.collegeId,job.companyId,owner.membershipId]);
   expect(follow).toHaveLength(1);
   await db.expectSqlState(()=>db.query(`
    insert into placement_tpo_company_team_follows
      (college_id,company_id,membership_id) values ($1,$2,$3)`,
    [own.collegeId,job.companyId,owner.membershipId]),"23505");
   await db.expectSqlState(()=>db.query(`
    insert into placement_tpo_company_team_follows
      (college_id,company_id,membership_id) values ($1,$2,$3)`,
    [own.collegeId,job.companyId,outsider.membershipId]),"23503");
  });
 });
});
