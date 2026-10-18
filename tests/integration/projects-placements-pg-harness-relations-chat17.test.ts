import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import {
  newHarnessPool, withProjectPg, createTenant, createPrincipal,
  createProjectFixture, createTaskSubmission, createFinalSubmission,
} from "./support/projects-placements-pg-harness";

/** DB-backed schema witnesses: neither fake Drizzle rows nor a mock Pool. */
let pool:Pool;
beforeAll(() => { pool=newHarnessPool(); });
afterAll(async()=>{ if(pool) await pool.end(); });

describe("PROJ-HARNESS PostgreSQL relation and index witnesses",()=>{
  it("PROJ-HARNESS-29 registered tenant-scoped project indexes exist with unique/partial definitions",async()=>{
    await withProjectPg(pool,async db=>{
      const rows=await db.query<{indexname:string,indexdef:string}>(`
        select indexname,indexdef from pg_indexes
         where schemaname='public' and tablename=any($1::text[])`,
        [["project_instances","project_members","project_sprints","project_tasks",
          "project_task_submissions","project_submissions","project_evaluation_items"]]);
      const indexes=new Map(rows.map(row=>[row.indexname,row.indexdef]));
      for(const name of [
        "project_instances_college_slug_uq",
        "project_instances_college_status_idx",
        "project_members_active_membership_uq",
        "project_members_active_primary_mentor_uq",
        "project_sprints_active_project_uq",
        "project_tasks_project_status_idx",
        "project_task_submissions_active_uq",
        "project_submissions_open_project_uq",
        "project_evaluation_items_evaluation_sequence_uq",
      ])expect(indexes.has(name),name+" must be registered").toBe(true);
      expect(indexes.get("project_members_active_membership_uq")).toContain("ended_at");
      expect(indexes.get("project_sprints_active_project_uq")).toContain("ACTIVE");
    });
  });

  it("PROJ-HARNESS-30 PostgreSQL EXPLAIN accepts tenant-bounded workspace/task queries",async()=>{
    await withProjectPg(pool,async db=>{
      const tenant=await createTenant(db);
      const admin=await createPrincipal(db,tenant,["COLLEGE_ADMIN"]);
      const mentor=await createPrincipal(db,tenant,["MENTOR"]);
      const learner=await createPrincipal(db,tenant,["LEARNER"]);
      const project=await createProjectFixture(db,tenant,admin,mentor,learner);
      const [workspaces]=await db.query<{"QUERY PLAN":unknown}>(`
        explain (format json)
        select id from project_instances where college_id=$1 and status='ACTIVE'
        order by id limit 20`,[tenant.collegeId]);
      const [tasks]=await db.query<{"QUERY PLAN":unknown}>(`
        explain (format json)
        select id from project_tasks where project_id=$1
        order by id limit 20`,[project.projectId]);
      for(const result of [workspaces,tasks]){
        expect(Array.isArray(result?.["QUERY PLAN"])).toBe(true);
        const plans=result?.["QUERY PLAN"] as Array<{Plan?:{"Node Type"?:string}}>;
        expect(plans[0]?.Plan?.["Node Type"]).toBeTruthy();
      }
      // Planner may prefer sequential scan on tiny rollback fixtures.
      // Index existence is independently checked above; do not pretend
      // this one-row EXPLAIN proves large-tenant latency.
    });
  });

  it("PROJ-HARNESS-31 project dependents use RESTRICT instead of silent cascade",async()=>{
    await withProjectPg(pool,async db=>{
      const rows=await db.query<{conname:string,confdeltype:string}>(`
        select c.conname,c.confdeltype::text
          from pg_constraint c
          join pg_class t on t.oid=c.conrelid
         where c.contype='f'
           and c.conname=any($1::text[])`,[[
           "project_tasks_project_id_project_instances_id_fk",
           "project_members_project_id_project_instances_id_fk",
           "project_task_submissions_task_id_project_tasks_id_fk",
           "project_submissions_project_id_project_instances_id_fk",
          ]]);
      expect(rows).toHaveLength(4);
      for(const row of rows)expect(row.confdeltype).toBe("r");
    });
  });

  it("PROJ-HARNESS-32 failed dependent deletion cannot orphan a task submission or delivery",async()=>{
    await withProjectPg(pool,async db=>{
      const tenant=await createTenant(db);
      const admin=await createPrincipal(db,tenant,["COLLEGE_ADMIN"]);
      const mentor=await createPrincipal(db,tenant,["MENTOR"]);
      const learner=await createPrincipal(db,tenant,["LEARNER"]);
      const project=await createProjectFixture(db,tenant,admin,mentor,learner);
      const taskSubmission=await createTaskSubmission(db,project,learner);
      const final=await createFinalSubmission(db,project,learner);
      await db.expectSqlState(()=>db.query("delete from project_tasks where id=$1",
        [project.taskId]),"23503");
      await db.expectSqlState(()=>db.query("delete from project_instances where id=$1",
        [project.projectId]),"23503");
      expect(await db.query("select id from project_tasks where id=$1",[project.taskId]))
        .toHaveLength(1);
      expect(await db.query("select id from project_task_submissions where id=$1",[taskSubmission]))
        .toHaveLength(1);
      expect(await db.query("select id from project_submissions where id=$1",[final]))
        .toHaveLength(1);
    });
  });
});
