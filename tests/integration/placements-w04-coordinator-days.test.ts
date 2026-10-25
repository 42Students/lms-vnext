import { publishableJobTerms } from "../support/publishable-job-terms";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createPlacementJob } from "@/modules/placements/job-service";
import {upsertJobEligibilityPolicy} from "@/modules/placements/eligibility-service";
import { publishPreparedPlacementJob } from "../support/publishable-job-fixture";
import { createPlacementRound, actOnPlacementRound } from "@/modules/placements/round-service";
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { decidePlacementScreening } from "@/modules/placements/screening-service";
import {
  assignDriveDayCoordinator,
  getDriveDayRoster,
  hasStudentCoordinatorAssignmentToday,
  listMyDriveDayRounds,
  markDriveDayAttendance,
  removeDriveDayCoordinator,
} from "@/modules/placements/drive-day-coordinator-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Isolated TEST_DATABASE_URL required for W04 DB tests");
const pool = new Pool({ connectionString: databaseUrl, max: 1 });

const coordinatorUserId = "f8040000-0000-4000-8000-000000000001";
const coordinatorMembershipId = "f8040000-0000-4000-8000-000000000002";
const coordinatorRoleId = "f8040000-0000-4000-8000-000000000003";
const dutyNow = new Date("2026-10-20T07:00:00.000Z");
const nextDay = new Date("2026-10-21T07:00:00.000Z");

const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["FACULTY", "TPO"] },
};
const applicant: RequestContext = {
  user: { id: SEED_IDS.learnerUser, identityUid: "seed-learner",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["LEARNER"] },
};
const coordinator: RequestContext = {
  user: { id: coordinatorUserId, identityUid: "w04-coordinator",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: coordinatorMembershipId,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["LEARNER"] },
};

async function cleanup() {
  await pool.query("delete from placement_round_attendance");
  await pool.query("delete from placement_drive_day_coordinator_assignments");
  await pool.query("delete from placement_round_results");
  await pool.query("delete from placement_job_round_events");
  await pool.query("delete from placement_job_rounds");
  await pool.query("delete from placement_application_screening_history");
  await pool.query("delete from placement_application_screenings");
  await pool.query("delete from placement_application_status_history");
  // Both College Admin and TPO stage projections reference live applications.
  // Their dependent stage history must be removed before its stage and parent.
  await pool.query("delete from placement_college_application_stage_history");
  await pool.query("delete from placement_college_application_stages");
  await pool.query("delete from placement_tpo_application_stages");
  await pool.query("delete from placement_applications");
  await pool.query("delete from placement_job_eligibility_policies");
  await pool.query("delete from placement_jobs");
  await pool.query("delete from placement_company_relationships");
  await pool.query("delete from placement_companies");
  await pool.query(
    "delete from placement_eligibility_decisions where scope_type='MEMBERSHIP' and scope_id=$1",
    [coordinatorMembershipId],
  );
  await pool.query(
    "delete from learner_program_enrollments where membership_id=$1",
    [coordinatorMembershipId],
  );
  // These are append-only by design: the registered database denies row
  // DELETE. This file runs alone in a disposable PostgreSQL test database;
  // truncate its temporary history before deleting the owned registration.
  await pool.query("TRUNCATE TABLE placement_batch_registration_events");
  await pool.query("delete from placement_batch_registrations where membership_id = $1", [coordinatorMembershipId]);
  await pool.query("delete from membership_roles where id = $1", [coordinatorRoleId]);
  await pool.query("delete from college_memberships where id = $1", [coordinatorMembershipId]);
  await pool.query("delete from users where id = $1", [coordinatorUserId]);
}

async function setup() {
  await pool.query(
    `insert into users(id, identity_uid, phone_e164, email, display_name, platform_status)
     values($1,'w04-coordinator','+919123450804','coordinator-w04@example.com',
       'W04 Coordinator','ACTIVE')`,
    [coordinatorUserId],
  );
  await pool.query(
    "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
    [coordinatorMembershipId, coordinatorUserId, SEED_IDS.collegeA],
  );
  await pool.query(
    "insert into membership_roles(id,membership_id,role) values($1,$2,'LEARNER')",
    [coordinatorRoleId, coordinatorMembershipId],
  );

  const company = await createPlacementCompany(tpo, {
    collegeId: SEED_IDS.collegeA,
    name: "W04 Coordinator Date QA",
    primaryDomain: "w04-coordinator-scope.example",
  });
  const job = await createPlacementJob(tpo, {
      ...publishableJobTerms,
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId: company.relationship.id,
    title: "Drive Day QA Engineer",
    description: "Same-job different-day coordinator access check",
    employmentType: "FULL_TIME", workMode: "HYBRID",
    applicationMode: "INTERNAL",
  });
  const todayRound = await createPlacementRound(tpo, job.id, {
    kind: "TEST", name: "Today Aptitude Test", durationMinutes: 60,
  });
  const tomorrowRound = await createPlacementRound(tpo, job.id, {
    kind: "INTERVIEW", name: "Tomorrow Interview", durationMinutes: 60,
  });
  await upsertJobEligibilityPolicy(tpo,job.id,{missingEvidencePolicy:"ALLOW_WITH_FLAG"});
  await publishPreparedPlacementJob(tpo, job.id);
  const application = await applyToPlacementJob(applicant, job.id, {});
  await decidePlacementScreening(tpo, application.id, {
    decision: "SHORTLISTED", candidateMessage: "Selected",
  });
  await actOnPlacementRound(tpo, todayRound.id, {
    action: "SCHEDULE",
    scheduledAt: new Date("2026-10-20T04:30:00.000Z"),
    timezone: "Asia/Kolkata", mode: "ON_CAMPUS", venue: "Hall A",
  });
  await actOnPlacementRound(tpo, tomorrowRound.id, {
    action: "SCHEDULE",
    scheduledAt: new Date("2026-10-21T04:30:00.000Z"),
    timezone: "Asia/Kolkata", mode: "ON_CAMPUS", venue: "Hall B",
  });
  const assignment = await assignDriveDayCoordinator(tpo, job.id, {
    learnerMembershipId: coordinatorMembershipId,
    onDate: "2026-10-20",
  });
  return { job, todayRound, tomorrowRound, assignment, application };
}

beforeEach(async () => {
  await cleanup();
  await enableSeedLearnerPlacementAccess(pool);
});
afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("W04 coordinator same-day / tenant authorization", () => {
  it("limits listing and roster to the assigned day's actual rounds", async () => {
    const { todayRound, tomorrowRound, application } = await setup();
    expect(await hasStudentCoordinatorAssignmentToday(coordinator, dutyNow)).toBe(true);
    expect(await hasStudentCoordinatorAssignmentToday(coordinator, nextDay)).toBe(false);
    const rounds = await listMyDriveDayRounds(coordinator, dutyNow);
    expect(rounds.map(row => row.roundId)).toEqual([todayRound.id]);

    const roster = await getDriveDayRoster(coordinator, todayRound.id, dutyNow);
    expect(roster.access).toMatchObject({ fullAccess: false, coordinator: true });
    expect(roster.students).toEqual(expect.arrayContaining([
      expect.objectContaining({ applicationId: application.id, email: null, phoneE164: null }),
    ]));
    await expect(getDriveDayRoster(coordinator, tomorrowRound.id, dutyNow))
      .rejects.toMatchObject({ code: "PLACEMENT_DRIVE_DAY_ACCESS_DENIED" });
    await expect(markDriveDayAttendance(coordinator, tomorrowRound.id, {
      applicationId: application.id, status: "PRESENT",
    }, dutyNow)).rejects.toMatchObject({ code: "PLACEMENT_DRIVE_DAY_ACCESS_DENIED" });

    const marked = await markDriveDayAttendance(coordinator, todayRound.id, {
      applicationId: application.id, status: "PRESENT",
    }, dutyNow);
    expect(marked.status).toBe("PRESENT");
    // Concurrent retry from two mobile sessions must not throw a unique
    // constraint error or create duplicate attendance rows.
    const retries = await Promise.all([
      markDriveDayAttendance(coordinator, todayRound.id, {
        applicationId: application.id, status: "PRESENT",
      }, dutyNow),
      markDriveDayAttendance(coordinator, todayRound.id, {
        applicationId: application.id, status: "PRESENT",
      }, dutyNow),
    ]);
    expect(retries.every(row => row.status === "PRESENT")).toBe(true);
    const count = await pool.query<{ total: string }>(
      "select count(*)::text as total from placement_round_attendance where round_id=$1 and application_id=$2",
      [todayRound.id, application.id],
    );
    expect(count.rows[0]?.total).toBe("1");
  });

  it("revokes roster access immediately when assignment is removed", async () => {
    const { job, todayRound, assignment } = await setup();
    await removeDriveDayCoordinator(tpo, job.id, assignment.id);
    await expect(getDriveDayRoster(coordinator, todayRound.id, dutyNow))
      .rejects.toMatchObject({ code: "PLACEMENT_DRIVE_DAY_ACCESS_DENIED" });
  });

  it("does not treat a forged authenticated user as the assigned learner", async () => {
    const { todayRound } = await setup();
    const forged = {
      ...coordinator,
      user: { ...coordinator.user, id: SEED_IDS.learnerUser },
    };
    await expect(getDriveDayRoster(forged, todayRound.id, dutyNow))
      .rejects.toMatchObject({ code: "PLACEMENT_DRIVE_DAY_ACCESS_DENIED" });
  });
  it("keeps cross-college managers out while preserving an authorized TPO's historical round view", async () => {
    const { tomorrowRound } = await setup();
    const otherCollegeTpo: RequestContext = {
      ...tpo,
      membership: {
        ...tpo.membership!,
        id: SEED_IDS.facultyCollegeBMembership,
        collegeId: SEED_IDS.collegeB,
      },
    };
    await expect(getDriveDayRoster(otherCollegeTpo, tomorrowRound.id, dutyNow))
      .rejects.toThrow("Missing permission: placements.manage");
    const managerView = await getDriveDayRoster(tpo, tomorrowRound.id, dutyNow);
    expect(managerView.access).toMatchObject({ fullAccess: true, coordinator: false });
  });

  it("rejects adding an existing applicant as a Drive Day coordinator", async () => {
    const { job } = await setup();
    await expect(assignDriveDayCoordinator(tpo, job.id, {
      learnerMembershipId: SEED_IDS.learnerCollegeAMembership,
      onDate: "2026-10-20",
    })).rejects.toMatchObject({ code: "PLACEMENT_COORDINATOR_APPLICANT_CONFLICT" });
  });

  it("serializes application versus coordinator assignment so neither role can coexist", async () => {
    const { job } = await setup();
    await pool.query(
      `insert into learner_program_enrollments(membership_id,program_id,cohort_id,status)
       select $1,program_id,cohort_id,'ACTIVE'
         from learner_program_enrollments
        where membership_id=$2 and status='ACTIVE'`,
      [coordinatorMembershipId, SEED_IDS.learnerCollegeAMembership],
    );
    await pool.query(
      `insert into placement_eligibility_decisions
         (college_id,scope_type,scope_id,status,decided_by_user_id)
       values($1,'MEMBERSHIP',$2,'ELIGIBLE',$3)`,
      [SEED_IDS.collegeA, coordinatorMembershipId, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      `insert into placement_batch_registrations
         (college_id,cohort_id,membership_id,choice,consent_version,consent_at,source,recorded_by_user_id)
       select $1,cohort_id,$2,'PLACEMENTS','fixture',now(),'BACKFILL',$3
         from learner_program_enrollments
        where membership_id=$2 and status='ACTIVE'`,
      [SEED_IDS.collegeA, coordinatorMembershipId, SEED_IDS.collegeAdminUser],
    );

    // Already a coordinator, so an application must be rejected, not silently
    // accepted by a job-specific eligibility INCLUDE.
    await expect(applyToPlacementJob(coordinator, job.id, {}))
      .rejects.toMatchObject({ code: "PLACEMENT_COORDINATOR_APPLICANT_CONFLICT" });

    // Remove today's assignment, then race the two writers for tomorrow.
    const rows = await pool.query<{ id: string }>(
      "select id from placement_drive_day_coordinator_assignments where job_id=$1 and learner_membership_id=$2",
      [job.id, coordinatorMembershipId],
    );
    for (const row of rows.rows) {
      await removeDriveDayCoordinator(tpo, job.id, row.id);
    }

    const decisions = await Promise.allSettled([
      applyToPlacementJob(coordinator, job.id, {}),
      assignDriveDayCoordinator(tpo, job.id, {
        learnerMembershipId: coordinatorMembershipId,
        onDate: "2026-10-21",
      }),
    ]);
    expect(decisions.filter(result => result.status === "fulfilled")).toHaveLength(1);
    const loser = decisions.find(result => result.status === "rejected");
    expect(loser).toMatchObject({
      status: "rejected",
      reason: expect.objectContaining({ code: "PLACEMENT_COORDINATOR_APPLICANT_CONFLICT" }),
    });
  });

});
