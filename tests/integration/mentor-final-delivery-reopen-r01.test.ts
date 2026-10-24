import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { createProjectTemplate, publishProjectTemplate, assignProjectTemplateToCollege } from "@/modules/projects/template-service";
import { createProjectInstance } from "@/modules/projects/instance-service";
import { addProjectMember } from "@/modules/projects/member-service";
import { decideMentorFinalDelivery } from "@/modules/projects/mentor-final-delivery-decision-service";
import { reopenApprovedProjectDelivery } from "@/modules/projects/delivery-reopen-service";

const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;
const root: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "mentor-r01-root",
  platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: null };
const scoped = { ...root, adminScope: { collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization } };
const admin: RequestContext = { user: { id: SEED_IDS.collegeAdminUser, identityUid: "mentor-r01-admin",
  platformStatus: "ACTIVE", systemRoles: [] }, membership: { id: SEED_IDS.collegeAdminMembership,
  collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
  status: "ACTIVE", roles: ["COLLEGE_ADMIN"] } };
const mentor: RequestContext = { user: { id: SEED_IDS.facultyUser, identityUid: "mentor-r01",
  platformStatus: "ACTIVE", systemRoles: [] }, membership: { id: SEED_IDS.facultyCollegeAMembership,
  collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
  status: "ACTIVE", roles: ["MENTOR", "FACULTY"] } };

describe.skipIf(!enabled)("MEN-projects-meetings-R01 mentor approval locks then reopens", () => {
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });
  it("persists one LOCKED event and reopens an approved delivery without bypassing review authorization", async () => {
    const suffix = randomUUID().slice(0, 12);
    const template = await createProjectTemplate(root, {
      slug: "mentor-reopen-r01-" + suffix, title: "R01",
      blueprint: { overview: { goal: "Review", deliverables: ["Demo"] },
        releases: [{ key: "r", title: "Release", sequence: 0 }],
        sprints: [{ key: "s", releaseKey: "r", title: "Sprint", sequence: 0 }],
        tasks: [{ key: "t", sprintKey: "s", title: "Task", sequence: 0, priority: "MEDIUM" }],
        resources: [] },
    });
    await publishProjectTemplate(root, template.template.id);
    await assignProjectTemplateToCollege(scoped, template.template.id, SEED_IDS.collegeA);
    const project = await createProjectInstance(admin, { collegeId: SEED_IDS.collegeA,
      templateId: template.template.id, slug: "mentor-reopen-r01-" + suffix, title: "R01 workspace" });
    await addProjectMember(admin, project.id, {
      membershipId: SEED_IDS.facultyCollegeAMembership, role: "MENTOR", isPrimary: true,
    });
    await addProjectMember(admin, project.id, {
      membershipId: SEED_IDS.learnerCollegeAMembership, role: "LEARNER",
    });
    await pool!.query("update project_instances set status='ACTIVE' where id=$1", [project.id]);
    const inserted = await pool!.query<{ id: string; updated_at: Date }>(
      `insert into project_submissions(project_id,version,status,summary,created_by_membership_id,
        submitted_by_membership_id,submitted_at) values($1,1,'SUBMITTED','Demo',$2,$2,now())
        returning id,updated_at`, [project.id, SEED_IDS.learnerCollegeAMembership],
    );
    const submission = inserted.rows[0]!;
    // An ACTIVE status cannot revive a soft-deleted project for review.
    await pool!.query("update project_instances set deleted_at=now() where id=$1",[project.id]);
    try{
      await expect(decideMentorFinalDelivery(mentor,project.id,submission.id,{
        decision:"APPROVED",expectedUpdatedAt:submission.updated_at.toISOString(),
        confirmed:true,
      })).rejects.toBeDefined();
      const denied=await pool!.query<{count:string}>(`select count(*)::text as count
        from project_submission_reviews where submission_id=$1`,[submission.id]);
      expect(denied.rows[0]?.count).toBe("0");
    }finally{
      await pool!.query("update project_instances set deleted_at=null where id=$1",[project.id]);
    }
    const approved = await decideMentorFinalDelivery(mentor, project.id, submission.id, {
      decision: "APPROVED", expectedUpdatedAt: submission.updated_at.toISOString(), confirmed: true,
    });
    expect(approved.submission.lockedAt).toBeInstanceOf(Date);
    // A saved stale decision must not produce a duplicate immutable review,
    // second lock, or another learner notification.
    await expect(decideMentorFinalDelivery(mentor,project.id,submission.id,{
      decision:"APPROVED",expectedUpdatedAt:submission.updated_at.toISOString(),
      confirmed:true,
    })).rejects.toMatchObject({code:"PROJECT_SUBMISSION_INVALID_STATE"});
    const reviews=await pool!.query<{count:string}>(`select count(*)::text as count
      from project_submission_reviews where submission_id=$1`,[submission.id]);
    expect(reviews.rows[0]?.count).toBe("1");
    const learnerNotices=await pool!.query<{count:string}>(`select count(*)::text as count
      from in_app_notifications notice
      inner join activity_events activity on activity.id=notice.event_id
      where notice.user_id=$1 and activity.subject_id=$2
        and activity.event_type='projects.delivery.reviewed'`,[
      SEED_IDS.learnerUser,submission.id,
    ]);
    expect(learnerNotices.rows[0]?.count).toBe("1");
    const locks = await pool!.query("select event_type from project_delivery_events where submission_id=$1", [submission.id]);
    expect(locks.rows).toEqual([{ event_type: "LOCKED" }]);
    // Removing the Mentor grant after approval may not reopen the delivery,
    // even with a still-valid approval timestamp in a saved browser tab.
    await pool!.query(`update project_members set can_mutate=false
      where project_id=$1 and membership_id=$2 and role='MENTOR'`,[
      project.id,SEED_IDS.facultyCollegeAMembership,
    ]);
    try{
      await expect(reopenApprovedProjectDelivery(mentor,project.id,submission.id,{
        expectedUpdatedAt:approved.submission.updatedAt.toISOString(),
        reason:"Attempt while no longer authorized",
      })).rejects.toBeDefined();
      const rejected=await pool!.query<{count:string}>(`select count(*)::text as count
        from project_delivery_events where submission_id=$1 and event_type='REOPENED'`,[
        submission.id,
      ]);
      expect(rejected.rows[0]?.count).toBe("0");
    }finally{
      await pool!.query(`update project_members set can_mutate=true
        where project_id=$1 and membership_id=$2 and role='MENTOR'`,[
        project.id,SEED_IDS.facultyCollegeAMembership,
      ]);
    }
    const reopened = await reopenApprovedProjectDelivery(mentor, project.id, submission.id, {
      expectedUpdatedAt: approved.submission.updatedAt.toISOString(), reason: "Learner needs revision",
    });
    expect(reopened.reopened).toBe(true);
    await expect(reopenApprovedProjectDelivery(mentor, project.id, submission.id, {
      expectedUpdatedAt: approved.submission.updatedAt.toISOString(), reason: "Replay",
    })).rejects.toMatchObject({ code: "PROJECT_SUBMISSION_INVALID_STATE" });
    const events = await pool!.query("select event_type from project_delivery_events where submission_id=$1 order by occurred_at",
      [submission.id]);
    expect(events.rows.map(row => row.event_type).sort()).toEqual(["LOCKED", "REOPENED"]);
  });
});
