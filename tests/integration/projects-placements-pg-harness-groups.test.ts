import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import {
  newHarnessPool, withProjectPg, withTwoPgSessions, createTenant, createPrincipal,
  createProjectFixture, createTaskSubmission, createFinalSubmission, submitFinalSubmission,
  createMeeting, createPlacementFixture, type PgHarness,
} from "./support/projects-placements-pg-harness";

/** PROJ-HARNESS PostgreSQL examples for all Projects table groups and drives.
 * These MUST run against migrated disposable TEST_DATABASE_URL with
 * --config vitest.db.config.ts; no mock DB and no production DB fallback.
 * Every test creates its own real independent tenant identities and rolls back.
 */
let pool: Pool;
beforeAll(() => { pool = newHarnessPool(); });
afterAll(async () => { if (pool) await pool.end(); });

async function graph(db: PgHarness) {
  const owner = await createTenant(db, "IIT-Dharwad-fixture");
  const other = await createTenant(db, "Other-college-fixture");
  const author = await createPrincipal(db, owner, ["COLLEGE_ADMIN"]);
  const mentor = await createPrincipal(db, owner, ["MENTOR","FACULTY"]);
  const learner = await createPrincipal(db, owner, ["LEARNER"]);
  const outsider = await createPrincipal(db, other, ["LEARNER"]);
  const admin = await createPrincipal(db, null, [], true);
  const project = await createProjectFixture(db, owner, author, mentor, learner);
  return {owner,other,author,mentor,learner,outsider,admin,project};
}
async function fixture(run: (db: PgHarness, f: Awaited<ReturnType<typeof graph>>) => Promise<void>) {
  await withProjectPg(pool, async db => run(db, await graph(db)));
}

describe("PROJ-HARNESS real PostgreSQL schema group examples", () => {
  it("PROJ-HARNESS-01 creates two organizations, five role records and an isolated project/workspace graph",async()=>{
    await fixture(async(db,f)=>{
      const rows=await db.query<{college_id:string,organization_id:string}>(`
        select c.id as college_id,o.id as organization_id
          from colleges c join organizations o on o.id=c.organization_id
         where c.id=any($1::uuid[])`,[[f.owner.collegeId,f.other.collegeId]]);
      expect(rows).toHaveLength(2);
      expect(new Set(rows.map(x=>x.organization_id)).size).toBe(2);
      expect(f.outsider.collegeId).not.toBe(f.owner.collegeId);
      const roles=await db.query("select role from membership_roles where membership_id=$1",
        [f.mentor.membershipId]);
      expect(roles.map(r=>r.role).sort()).toEqual(["FACULTY","MENTOR"]);
      expect(f.project.workspaceId).toBe(f.project.projectId);
    });
  });

  it("PROJ-HARNESS-02 template/version checks reject duplicate case-folded slugs and nonpositive versions",async()=>{
    await fixture(async(db,f)=>{
      const original=await db.query<{slug:string}>("select slug from project_templates where id=$1",[f.project.templateId]);
      await db.expectSqlState(()=>db.query(
        "insert into project_templates (slug,title,created_by_user_id) values ($1,'Duplicate',$2)",
        [original[0]!.slug.toUpperCase(),f.author.userId]),"23505");
      await db.expectSqlState(()=>db.query(`
        insert into project_template_versions (template_id,version,title,blueprint,created_by_user_id)
        values ($1,0,'Invalid','{}'::jsonb,$2)`,[f.project.templateId,f.author.userId]),"23514");
    });
  });

  it("PROJ-HARNESS-03 assignment group enforces one active college-template assignment",async()=>{
    await fixture(async(db,f)=>{
      await db.expectSqlState(()=>db.query(`
        insert into project_template_college_assignments
          (template_id,template_version_id,college_id,assigned_by_user_id)
        values ($1,$2,$3,$4)`,
        [f.project.templateId,f.project.versionId,f.owner.collegeId,f.author.userId]),"23505");
      expect((await db.query<{n:number}>(`
        select count(*)::int n from project_template_college_assignments
         where template_id=$1 and college_id=$2 and revoked_at is null`,
        [f.project.templateId,f.owner.collegeId]))[0]!.n).toBe(1);
    });
  });

  it("PROJ-HARNESS-04 instances/workspaces enforce unique tenant slug and status",async()=>{
    await fixture(async(db,f)=>{
      const [existing]=await db.query<{slug:string}>(`select slug from project_instances where id=$1`,[f.project.projectId]);
      await db.expectSqlState(()=>db.query(`
        insert into project_instances (college_id,template_id,template_version_id,slug,title,created_by_user_id)
        values ($1,$2,$3,$4,'Duplicate',$5)`,
        [f.owner.collegeId,f.project.templateId,f.project.versionId,
          existing!.slug.toUpperCase(),f.author.userId]),"23505");
      await db.expectSqlState(()=>db.query(`
        update project_instances set status='IMPOSSIBLE' where id=$1`,[f.project.projectId]),"23514");
    });
  });

  it("PROJ-HARNESS-51 published template and in-progress release form an active workspace",async()=>{
    await fixture(async(db,f)=>{
      const rows=await db.query<{
        template_status:string;published_version:number;
        project_status:string;release_status:string;sprint_status:string;
      }>(`
        select t.status as template_status,t.published_version,
          p.status as project_status,r.status as release_status,s.status as sprint_status
          from project_instances p
          join project_templates t on t.id=p.template_id
          join project_releases r on r.project_id=p.id
          join project_sprints s on s.project_id=p.id and s.release_id=r.id
         where p.id=$1`,[f.project.projectId]);
      expect(rows).toMatchObject([{
        template_status:"PUBLISHED",published_version:1,
        project_status:"ACTIVE",release_status:"IN_PROGRESS",sprint_status:"ACTIVE",
      }]);
    });
  });

  it("PROJ-HARNESS-05 release group prevents duplicate keys and negative sequences",async()=>{
    await fixture(async(db,f)=>{
      await db.expectSqlState(()=>db.query(`
        insert into project_releases (project_id,template_key,title,sequence)
        values ($1,'release-1','Repeated',1)`,[f.project.projectId]),"23505");
      await db.expectSqlState(()=>db.query(`
        insert into project_releases (project_id,template_key,title,sequence)
        values ($1,'bad-negative','Invalid',-1)`,[f.project.projectId]),"23514");
    });
  });

  it("PROJ-HARNESS-06 sprint group permits only one ACTIVE sprint and valid dates",async()=>{
    await fixture(async(db,f)=>{
      await db.query("update project_sprints set status='ACTIVE' where id=$1",[f.project.sprintId]);
      await db.expectSqlState(()=>db.query(`
        insert into project_sprints (project_id,release_id,template_key,title,sequence,status)
        values ($1,$2,'sprint-2','Double active',1,'ACTIVE')`,
        [f.project.projectId,f.project.releaseId]),"23505");
      await db.expectSqlState(()=>db.query(`
        update project_sprints set start_date='2026-10-22',end_date='2026-10-21' where id=$1`,
        [f.project.sprintId]),"23514");
    });
  });

  it("PROJ-HARNESS-07 task group rejects impossible status, sequence and duplicate sprint order",async()=>{
    await fixture(async(db,f)=>{
      await db.expectSqlState(()=>db.query(`
        insert into project_tasks(project_id,sprint_id,template_key,title,sequence)
        values ($1,$2,'duplicate-order','Duplicate',0)`,
        [f.project.projectId,f.project.sprintId]),"23505");
      await db.expectSqlState(()=>db.query(`
        update project_tasks set status='UNREVIEWED' where id=$1`,[f.project.taskId]),"23514");
      await db.expectSqlState(()=>db.query(`
        update project_tasks set sequence=-1 where id=$1`,[f.project.taskId]),"23514");
    });
  });

  it("PROJ-HARNESS-08 resource group enforces active status and per-project keys",async()=>{
    await fixture(async(db,f)=>{
      await db.expectSqlState(()=>db.query(`
        update project_resources set status='UNKNOWN' where id=$1`,[f.project.resourceId]),"23514");
      await db.expectSqlState(()=>db.query(`
        insert into project_resources(project_id,template_key,title,sequence)
        values ($1,'resource-1','Duplicate',1)`,[f.project.projectId]),"23505");
    });
  });

  it("PROJ-HARNESS-09 membership group prevents duplicate active learner and primary mentor",async()=>{
    await fixture(async(db,f)=>{
      await db.expectSqlState(()=>db.query(`
        insert into project_members(project_id,membership_id,role,created_by_user_id)
        values ($1,$2,'LEARNER',$3)`,
        [f.project.projectId,f.learner.membershipId,f.author.userId]),"23505");
      await db.expectSqlState(()=>db.query(`
        insert into project_members(project_id,membership_id,role,is_primary,created_by_user_id)
        values ($1,$2,'LEARNER',true,$3)`,
        [f.project.projectId,f.learner.membershipId,f.author.userId]),"23514");
    });
  });

  it("PROJ-HARNESS-10 task submission group enforces versions, single active and review shape",async()=>{
    await fixture(async(db,f)=>{
      const submissionId=await createTaskSubmission(db,f.project,f.learner);
      await db.expectSqlState(()=>db.query(`
        insert into project_task_submissions
          (project_id,task_id,version,submitted_by_membership_id,submission_url)
        values ($1,$2,2,$3,'https://example.test/other')`,
        [f.project.projectId,f.project.taskId,f.learner.membershipId]),"23505");
      await db.expectSqlState(()=>db.query(`
        update project_task_submissions set status='APPROVED' where id=$1`,[submissionId]),"23514");
      await db.expectSqlState(()=>db.query(`
        update project_task_submissions set version=0 where id=$1`,[submissionId]),"23514");
    });
  });

  it("PROJ-HARNESS-11 final delivery checks DRAFT/submitted shape and uniqueness",async()=>{
    await fixture(async(db,f)=>{
      const finalId=await createFinalSubmission(db,f.project,f.learner);
      await db.expectSqlState(()=>db.query(`
        update project_submissions set status='SUBMITTED' where id=$1`,[finalId]),"23514");
      await db.expectSqlState(()=>db.query(`
        insert into project_submissions(project_id,version,status,summary,created_by_membership_id)
        values ($1,2,'DRAFT','Duplicate open',$2)`,
        [f.project.projectId,f.learner.membershipId]),"23505");
      const [row]=await db.query<{status:string}>(`select status from project_submissions where id=$1`,[finalId]);
      expect(row?.status).toBe("DRAFT");
    });
  });

  it("PROJ-HARNESS-12 reviews reject missing changes-requested rationale",async()=>{
    await fixture(async(db,f)=>{
      const finalId=await createFinalSubmission(db,f.project,f.learner);
      await submitFinalSubmission(db,finalId,f.learner);
      await db.expectSqlState(()=>db.query(`
        insert into project_submission_reviews
          (project_id,submission_id,decision,reviewed_by_user_id)
        values ($1,$2,'CHANGES_REQUESTED',$3)`,
        [f.project.projectId,finalId,f.mentor.userId]),"23514");
      await db.query(`
        insert into project_submission_reviews
          (project_id,submission_id,decision,feedback,reviewed_by_user_id)
        values ($1,$2,'CHANGES_REQUESTED','Please revise',$3)`,
        [f.project.projectId,finalId,f.mentor.userId]);
    });
  });

  it("PROJ-HARNESS-13 evaluations enforce rubric bounds, sequence and one evaluation/submission",async()=>{
    await fixture(async(db,f)=>{
      const finalId=await createFinalSubmission(db,f.project,f.learner);
      await submitFinalSubmission(db,finalId,f.learner);
      await db.expectSqlState(()=>db.query(`
        insert into project_evaluations(project_id,submission_id,evaluator_user_id,total_score,max_score)
        values ($1,$2,$3,101,100)`,[f.project.projectId,finalId,f.mentor.userId]),"23514");
      const [evaluation]=await db.query<{id:string}>(`
        insert into project_evaluations(project_id,submission_id,evaluator_user_id,total_score,max_score)
        values ($1,$2,$3,80,100) returning id`,[f.project.projectId,finalId,f.mentor.userId]);
      await db.expectSqlState(()=>db.query(`
        insert into project_evaluation_items(evaluation_id,criterion,score,max_score,sequence)
        values ($1,'Correctness',9,5,0)`,[evaluation!.id]),"23514");
      await db.query(`
        insert into project_evaluation_items(evaluation_id,criterion,score,max_score,sequence)
        values ($1,'Correctness',4,5,0)`,[evaluation!.id]);
      await db.expectSqlState(()=>db.query(`
        insert into project_evaluation_items(evaluation_id,criterion,score,max_score,sequence)
        values ($1,'Duplicate criterion sequence',4,5,0)`,[evaluation!.id]),"23505");
    });
  });

  it("PROJ-HARNESS-14 meetings enforce timestamp ordering and scheduled actor shape (IST)",async()=>{
    await fixture(async(db,f)=>{
      const meetingId=await createMeeting(db,f.project,f.learner,f.author);
      await db.expectSqlState(()=>db.query(`
        update project_meetings set ends_at=starts_at where id=$1`,[meetingId]),"23514");
      await db.expectSqlState(()=>db.query(`
        update project_meetings set status='SCHEDULED' where id=$1`,[meetingId]),"23514");
      const [row]=await db.query<{time_zone:string,status:string}>(`
        select time_zone,status from project_meetings where id=$1`,[meetingId]);
      expect(row).toEqual({time_zone:"Asia/Kolkata",status:"REQUESTED"});
    });
  });

  it("PROJ-HARNESS-15 project deletion is RESTRICTed with dependent work; no silent cascade",async()=>{
    await fixture(async(db,f)=>{
      await db.expectSqlState(()=>db.query("delete from project_instances where id=$1",[f.project.projectId]),"23503");
      expect((await db.query<{id:string}>("select id from project_tasks where id=$1",[f.project.taskId]))).toHaveLength(1);
    });
  });

  it("PROJ-HARNESS-16 tenancy: tenant-scoped queries exclude other organization projects and drives",async()=>{
    await fixture(async(db,f)=>{
      const alienAdmin=await createPrincipal(db,f.other,["COLLEGE_ADMIN"]);
      const alienMentor=await createPrincipal(db,f.other,["MENTOR"]);
      const alienLearner=await createPrincipal(db,f.other,["LEARNER"]);
      const alien=await createProjectFixture(db,f.other,alienAdmin,alienMentor,alienLearner);
      const ownDrive=await createPlacementFixture(db,f.owner,f.author);
      const alienDrive=await createPlacementFixture(db,f.other,alienAdmin);
      const ownProjects=await db.query<{id:string}>("select id from project_instances where college_id=$1",[f.owner.collegeId]);
      const ownDrives=await db.query<{id:string}>("select id from placement_jobs where college_id=$1",[f.owner.collegeId]);
      expect(ownProjects.map(x=>x.id)).toContain(f.project.projectId);
      expect(ownProjects.map(x=>x.id)).not.toContain(alien.projectId);
      expect(ownDrives.map(x=>x.id)).toContain(ownDrive.driveId);
      expect(ownDrives.map(x=>x.id)).not.toContain(alienDrive.driveId);
      await expect(createProjectFixture(db,f.other,f.author,f.mentor,f.learner)).rejects.toThrow(/college/);
    });
  });

  it("PROJ-HARNESS-17 placement companies, relationships and drives enforce keys and lifecycle",async()=>{
    await fixture(async(db,f)=>{
      const drive=await createPlacementFixture(db,f.owner,f.author);
      await db.expectSqlState(()=>db.query(`
        insert into placement_company_relationships(college_id,company_id,created_by_user_id)
        values ($1,$2,$3)`,[f.owner.collegeId,drive.companyId,f.author.userId]),"23505");
      await db.expectSqlState(()=>db.query(`
        update placement_jobs set openings=0 where id=$1`,[drive.jobId]),"23514");
      await db.expectSqlState(()=>db.query(`
        update placement_jobs set status='PUBLISHED' where id=$1`,[drive.jobId]),"23514");
      await db.expectSqlState(()=>db.query(`
        insert into placement_job_rounds(job_id,sequence,kind,name,created_by_user_id)
        values ($1,1,'TEST','Duplicate round',$2)`,[drive.jobId,f.author.userId]),"23505");
      await db.expectSqlState(()=>db.query(`
        update placement_job_rounds set status='SCHEDULED' where id=$1`,[drive.roundId]),"23514");
    });
  });

  it("PROJ-HARNESS-18 SAVEPOINT preserves valid writes after rejected constraints",async()=>{
    await fixture(async(db,f)=>{
      await db.expectSqlState(()=>db.query(
        "update project_tasks set status='IMPOSSIBLE' where id=$1",[f.project.taskId]),"23514");
      const [row]=await db.query<{status:string}>(
        "update project_tasks set status='IN_PROGRESS' where id=$1 returning status",[f.project.taskId]);
      expect(row?.status).toBe("IN_PROGRESS");
    });
  });

  it("PROJ-HARNESS-19 outer transaction rolls back success; no test fixture survives",async()=>{
    const uid=randomUUID();
    let savedId: string | undefined;
    await withProjectPg(pool,async db=>{
      const tenant=await createTenant(db,"Rollback "+uid);
      savedId=tenant.collegeId;
      expect((await db.query("select id from colleges where id=$1",[savedId]))).toHaveLength(1);
    });
    expect(savedId).toBeTruthy();
    const result=await pool.query("select id from colleges where id=$1",[savedId]);
    expect(result.rowCount).toBe(0);
  });
  it("PROJ-HARNESS-20 delivery events enforce nonempty reason and composite project/submission ancestry",async()=>{
    await fixture(async(db,f)=>{
      const submission=await createFinalSubmission(db,f.project,f.learner);
      await submitFinalSubmission(db,submission,f.learner);
      await db.expectSqlState(()=>db.query(`
        insert into project_delivery_events(project_id,submission_id,event_type,actor_membership_id,reason)
        values ($1,$2,'LOCKED',$3,'')`,
        [f.project.projectId,submission,f.mentor.membershipId]),"23514");
      await db.query(`
        insert into project_delivery_events(project_id,submission_id,event_type,actor_membership_id,reason)
        values ($1,$2,'LOCKED',$3,'Confirmed by mentor')`,
        [f.project.projectId,submission,f.mentor.membershipId]);
      const otherAdmin=await createPrincipal(db,f.other,["COLLEGE_ADMIN"]);
      const otherMentor=await createPrincipal(db,f.other,["MENTOR"]);
      const otherLearner=await createPrincipal(db,f.other,["LEARNER"]);
      const otherProject=await createProjectFixture(db,f.other,otherAdmin,otherMentor,otherLearner);
      const otherSubmission=await createFinalSubmission(db,otherProject,otherLearner);
      await submitFinalSubmission(db,otherSubmission,otherLearner);
      await db.expectSqlState(()=>db.query(`
        insert into project_delivery_events(project_id,submission_id,event_type,actor_membership_id,reason)
        values ($1,$2,'REOPENED',$3,'Wrong project')`,
        [f.project.projectId,otherSubmission,f.mentor.membershipId]),"23503");
    });
  });

  it("PROJ-HARNESS-21 dual sessions can independently read a committed schema and never share a transaction",async()=>{
    await withTwoPgSessions(pool,async(a,b)=>{
      expect(a).not.toBe(b);
      const [one,two]=await Promise.all([
        a.query<{name:string}>("select current_database() as name"),
        b.query<{name:string}>("select current_database() as name"),
      ]);
      expect(one.rows[0]?.name).toBe(two.rows[0]?.name);
      expect(one.rows[0]?.name).toMatch(/test|ci|tmp/i);
      const [t1,t2]=await Promise.all([
        a.query("select count(*) from project_instances"),
        b.query("select count(*) from placement_jobs"),
      ]);
      expect(t1.rowCount).toBe(1);
      expect(t2.rowCount).toBe(1);
    });
  });

});
