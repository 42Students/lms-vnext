import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { createTenant, createPrincipal, createProjectFixture,
  newHarnessPool, withProjectPg, withTwoPgSessions, type PgHarness } from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{if(pool)await pool.end();});

async function prepared(db:PgHarness) {
 const tenant=await createTenant(db,"Rollback test campus");
 const owner=await createPrincipal(db,tenant,["COLLEGE_ADMIN"]);
 const mentor=await createPrincipal(db,tenant,["MENTOR"]);
 const learner=await createPrincipal(db,tenant,["LEARNER"]);
 const graph=await createProjectFixture(db,tenant,owner,mentor,learner);
 return {tenant,owner,mentor,learner,graph};
}

describe("PROJ-HARNESS-ROLLBACK real PostgreSQL: nested rollback and FK integrity",()=>{
 it("PROJ-HARNESS-ROLLBACK-01 failed callback rolls back entire fixture, not only successful callback",async()=>{
   let leaked: string|null=null;
   await expect(withProjectPg(pool,async db=>{
     const f=await prepared(db);
     leaked=f.graph.projectId;
     expect((await db.query("select id from project_instances where id=$1",[leaked]))).toHaveLength(1);
     throw new Error("intentional business process failure");
   })).rejects.toThrow("intentional business process failure");
   expect(leaked).not.toBeNull();
   expect((await pool.query("select id from project_instances where id=$1",[leaked])).rowCount).toBe(0);
 });
 it("PROJ-HARNESS-ROLLBACK-02 savepoint discard restores previous value without aborting transaction",async()=>{
   await withProjectPg(pool,async db=>{
     const f=await prepared(db);
     await db.savepoint(async()=>{
       await db.query("update project_tasks set status='IN_PROGRESS' where id=$1",[f.graph.taskId]);
       expect((await db.query<{status:string}>("select status from project_tasks where id=$1",
         [f.graph.taskId]))[0]?.status).toBe("IN_PROGRESS");
     },true);
     expect((await db.query<{status:string}>("select status from project_tasks where id=$1",
       [f.graph.taskId]))[0]?.status).toBe("TODO");
   });
 });
 it("PROJ-HARNESS-ROLLBACK-03 project template versions are immutable, preserving assigned lineage",async()=>{
   await withProjectPg(pool,async db=>{
     const f=await prepared(db);
     await db.expectSqlState(()=>db.query(
       "delete from project_template_versions where id=$1",[f.graph.versionId]),"23514");
     expect((await db.query("select id from project_template_versions where id=$1",
       [f.graph.versionId]))).toHaveLength(1);
     expect((await db.query("select id from project_instances where id=$1",
       [f.graph.projectId]))).toHaveLength(1);
   });
 });
 it("PROJ-HARNESS-ROLLBACK-04 wrong SQLSTATE does not poison the PostgreSQL transaction",async()=>{
   await withProjectPg(pool,async db=>{
     const f=await prepared(db);
     await expect(db.expectSqlState(()=>db.query(
       "update project_tasks set sequence=-1 where id=$1",[f.graph.taskId]),"23505"))
       .rejects.toThrow("expected SQLSTATE 23505 but received 23514");
     const rows=await db.query<{sequence:number}>(
       "select sequence from project_tasks where id=$1",[f.graph.taskId]);
     expect(rows).toHaveLength(1);
     expect(rows[0]!.sequence).toBeGreaterThanOrEqual(0);
     await db.expectSqlState(()=>db.query(
       "update project_tasks set sequence=-1 where id=$1",[f.graph.taskId]),"23514");
     expect((await db.query("select id from project_tasks where id=$1",[f.graph.taskId]))).toHaveLength(1);
   });
 });
 it("PROJ-HARNESS-ROLLBACK-06 both harness entrypoints force public as the fixture schema",async()=>{
   await withProjectPg(pool,async db=>{
     const path=await db.query<{schema:string}>("select current_schema() as schema");
     expect(path[0]?.schema).toBe("public");
     const tenant=await createTenant(db,"Search-path isolation fixture");
     expect(tenant.collegeId).toBeTruthy();
   });
   await withTwoPgSessions(pool,async(a,b)=>{
     const [first,second]=await Promise.all([
       a.query<{schema:string}>("select current_schema() as schema"),
       b.query<{schema:string}>("select current_schema() as schema"),
     ]);
     expect(first.rows[0]?.schema).toBe("public");
     expect(second.rows[0]?.schema).toBe("public");
   });
 });

 it("PROJ-HARNESS-ROLLBACK-05 both concurrent sessions roll back independently after callback failure",async()=>{
   const tag=randomUUID();
   const first="Harness concurrent rollback a "+tag;
   const second="Harness concurrent rollback b "+tag;
   await expect(withTwoPgSessions(pool,async(a,b)=>{
     await a.query("insert into organizations (name) values ($1)",[first]);
     await b.query("insert into organizations (name) values ($1)",[second]);
     expect((await a.query("select id from organizations where name=$1",[first])).rowCount).toBe(1);
     expect((await a.query("select id from organizations where name=$1",[second])).rowCount).toBe(0);
     expect((await b.query("select id from organizations where name=$1",[first])).rowCount).toBe(0);
     expect((await b.query("select id from organizations where name=$1",[second])).rowCount).toBe(1);
     throw new Error("intentional dual-session failure");
   })).rejects.toThrow("intentional dual-session failure");
   const persisted=await pool.query("select id from organizations where name = any($1::text[])",[[first,second]]);
   expect(persisted.rowCount).toBe(0);
 });
});
