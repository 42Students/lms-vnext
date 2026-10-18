import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { disposableDatabaseUrl, newHarnessPool } from "../integration/support/projects-placements-pg-harness";

const helper=readFileSync(join(process.cwd(),"tests/integration/support/projects-placements-pg-harness.ts"),"utf8");
const examples=readFileSync(join(process.cwd(),"tests/integration/projects-placements-pg-harness-groups.test.ts"),"utf8");
const withUrl=async<T>(url:string|undefined,run:()=>Promise<T>|T)=>{
 const previous=process.env.TEST_DATABASE_URL;
 try{
   if(url===undefined) delete process.env.TEST_DATABASE_URL;
   else process.env.TEST_DATABASE_URL=url;
   return await run();
 }finally{
   if(previous===undefined)delete process.env.TEST_DATABASE_URL;
   else process.env.TEST_DATABASE_URL=previous;
 }
};

describe("PROJ-HARNESS source and environment guard",()=>{
 it("PROJ-HARNESS-GUARD-01 never silently uses application DATABASE_URL",async()=>{
  await withUrl(undefined,()=>{
    expect(()=>disposableDatabaseUrl()).toThrow("TEST_DATABASE_URL");
    expect(()=>newHarnessPool()).toThrow("TEST_DATABASE_URL");
  });
 });
 it.each([
   "postgresql://localhost:5432/lms_prod",
   "postgresql://localhost:5432/contest_users",
   "postgresql://localhost:5432/financial_records",
   "postgresql://localhost:5432/lms_staging_test",
   "postgresql://localhost:5432/lms_live_test",
   "postgresql://localhost:5432/postgres",
   "postgresql://localhost:5432/production",
   "https://localhost/lms_test",
   "not a URL"
 ])("PROJ-HARNESS-GUARD-02 rejects unsafe or invalid connection: %s",async url=>{
   await withUrl(url,()=>expect(()=>disposableDatabaseUrl()).toThrow());
 });
 it("PROJ-HARNESS-GUARD-03 explicit disposable naming passes without opening a connection",async()=>{
   await withUrl("postgresql://localhost:5432/lms_projects_test",async()=>{
     expect(disposableDatabaseUrl()).toContain("lms_projects_test");
     const pool=newHarnessPool();
     await pool.end();
   });
 });
 it("PROJ-HARNESS-GUARD-04 verifies current_database and migration tables before BEGIN",()=>{
   expect(helper).toContain("await assertHarnessSchema(client)");
   expect(helper.indexOf("await assertHarnessSchema(client)")).toBeLessThan(helper.indexOf('await client.query("BEGIN")'));
   expect(helper).toContain("current_database()");
   expect(helper).toContain("to_regclass(");
   expect(helper).toContain("REQUIRED_TABLES");
   expect(helper).toContain("information_schema.columns");
   expect(helper).toContain('"can_mutate"');
   expect(helper).toContain('"ended_at"');
   expect(helper).toContain("u.platform_status = 'ACTIVE'");
 });
 it("PROJ-HARNESS-GUARD-08 role and lineage guards fail closed without narrowing collaborative final delivery",()=>{
   expect(helper).toContain("org.status = 'ACTIVE'");
   expect(helper).toContain("c.status = 'ACTIVE'");
   expect(helper).toContain("mr.role = 'LEARNER'");
   expect(helper).toContain("task does not belong to this project");
   expect(helper).toContain("task assignee is not the submitting learner");
   expect(helper).toContain("task sprint or task state cannot accept a submission");
   expect(helper).toContain("assignee_membership_id");
   expect(helper).toContain("s.status as sprint_status");
   expect(helper).toContain("'Harness sprint',0,'ACTIVE'");

   expect(helper).toContain("meeting mentor is not active on this project");
   expect(helper).toContain("requireMutableFixtureProject");
   expect(helper).toContain('"final delivery"');
   expect(helper).toContain('"task submissions"');
   expect(helper).toContain('"meetings"');
   expect(helper).toContain("where id=$1 and status='ACTIVE'");
   expect(helper).toContain("where id=$1 and status='DRAFT'");
   expect(helper).not.toContain("where id=$1 and created_by_membership_id=$2 and status='DRAFT'");
 });

 it("PROJ-HARNESS-GUARD-09 active projects and durable future dates match production lifecycle",()=>{
   expect(helper).toContain("(college_id,template_id,template_version_id,slug,title,status,created_by_user_id)");
   expect(helper).toContain("'ACTIVE',$6");
   expect(helper).toContain("where id=$1 and status='ACTIVE'");
   expect(helper).toContain('"2099-10-20T04:30:00Z"');
   expect(helper).toContain('"2099-10-01"');
   expect(helper).not.toContain('"2026-10-20T04:30:00Z"');
 });

 it("PROJ-HARNESS-GUARD-05 always rolls back transaction and savepoint errors",()=>{
   expect(helper).toContain('if (begun) await client.query("ROLLBACK")');
   expect(helper).toContain("client.release()");
   expect(helper).toContain("ROLLBACK TO SAVEPOINT");
   expect(helper).toContain("RELEASE SAVEPOINT");
   expect(helper).toContain("db.savepoint(");
   expect(helper).not.toMatch(/client\.query\(["'`]COMMIT/);
   expect(helper).not.toMatch(/(?:truncate table|drop table|delete from [a-z_]+ cascade)/i);
 });
 it("PROJ-HARNESS-GUARD-06 shared fixtures cover tenants/roles/project groups/placements",()=>{
   for(const exported of [
     "createTenant","createPrincipal","createProjectFixture","createTaskSubmission",
     "createFinalSubmission","createMeeting","createPlacementFixture","withProjectPg",
   ])expect(helper).toContain("export async function "+exported);
   expect(helper).toContain("organizationId");
   expect(helper).toContain("collegeId");
   expect(helper).toContain("membership_roles");
   expect(helper).toContain("project_template_versions");
   expect(helper).toContain("project_sprints");
   expect(helper).toContain("project_task_submissions");
   expect(helper).toContain("placement_job_rounds");
   expect(helper).toContain("export async function withTwoPgSessions");
   expect(helper).toContain("SET LOCAL lock_timeout");
 });
 it("PROJ-HARNESS-GUARD-07 all 21 SQL group, rollback and two-session integration examples remain registered",()=>{
   for(let i=1;i<=21;i++){
     expect(examples).toContain("PROJ-HARNESS-"+String(i).padStart(2,"0"));
   }
   expect(examples).toContain("23505");
   expect(examples).toContain("23514");
   expect(examples).toContain("23503");
   expect(examples).toContain("project_delivery_events");
   expect(examples).toContain("pool.query");
   expect(examples).toContain("not.toContain(alien.projectId)");
 });
});
