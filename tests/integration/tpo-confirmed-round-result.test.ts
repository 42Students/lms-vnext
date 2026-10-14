import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { confirmTpoRoundResult } from "@/modules/placements/tpo-confirmed-round-result-service";
import { applyPlacementRoundResult } from "@/modules/placements/result-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "tpo-confirmed-result-fixture",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};

type Fixture = {
  companyId: string;
  relationshipId: string;
  jobId: string;
  roleId: string;
  applicationId: string;
  roundId: string;
};
const created: Fixture[] = [];

async function fixture(): Promise<Fixture> {
  if (!pool) throw new Error("Disposable PostgreSQL is required");
  const tag = randomUUID();
  const companyId = randomUUID();
  const relationshipId = randomUUID();
  const jobId = randomUUID();
  const roleId = randomUUID();
  const applicationId = randomUUID();
  const roundId = randomUUID();
  const f = { companyId, relationshipId, jobId, roleId, applicationId, roundId };
  await pool.query(
    "INSERT INTO placement_companies(id,name,created_by_user_id) VALUES ($1,$2,$3)",
    [companyId, "Round result fixture " + tag, tpo.user.id],
  );
  created.push(f);
  await pool.query(
    "INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) " +
      "VALUES ($1,$2,$3,$4)",
    [relationshipId, SEED_IDS.collegeA, companyId, tpo.user.id],
  );
  await pool.query(
    "INSERT INTO placement_jobs(id,college_id,season_id,company_relationship_id," +
      "title,description,employment_type,work_mode,application_mode,status," +
      "published_at,created_by_user_id) VALUES ($1,$2,$3,$4,$5,$6," +
      "'FULL_TIME','HYBRID','INTERNAL','PUBLISHED',now(),$7)",
    [jobId, SEED_IDS.collegeA, SEED_IDS.placementSeasonA, relationshipId,
      "Result role " + tag, "Isolated round result test", tpo.user.id],
  );
  await pool.query(
    "INSERT INTO placement_job_role_options(id,job_id,title,employment_type,work_mode,is_primary) " +
      "VALUES ($1,$2,$3,'FULL_TIME','HYBRID',true)",
    [roleId, jobId, "Test role " + tag],
  );
  await pool.query(
    "INSERT INTO placement_applications(id,job_id,role_option_id,membership_id," +
      "channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) " +
      "VALUES ($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)",
    [applicationId, jobId, roleId, SEED_IDS.learnerCollegeAMembership, SEED_IDS.learnerUser],
  );
  await pool.query(
    "INSERT INTO placement_application_screenings(application_id,status,decided_by_user_id,decided_at) " +
      "VALUES ($1,'SHORTLISTED',$2,now())",
    [applicationId, tpo.user.id],
  );
  await pool.query(
    "INSERT INTO placement_job_rounds(id,job_id,sequence,kind,name,status,scheduled_at," +
      "timezone,mode,meeting_url,created_by_user_id) VALUES ($1,$2,1,'INTERVIEW',$3," +
      "'SCHEDULED',now(),'Asia/Kolkata','VIRTUAL','https://meet.example.test/round',$4)",
    [roundId, jobId, "Interview " + tag, tpo.user.id],
  );
  return f;
}

async function cleanup() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const f of created) {
      await client.query(
        "DELETE FROM in_app_notifications WHERE event_id IN (" +
          "SELECT id FROM activity_events WHERE metadata->>'jobId'=$1)",
        [f.jobId],
      );
      await client.query(
        "DELETE FROM activity_events WHERE metadata->>'jobId'=$1",
        [f.jobId],
      );
      await client.query("DELETE FROM placement_round_results WHERE round_id=$1", [f.roundId]);
      await client.query("DELETE FROM placement_job_round_events WHERE round_id=$1", [f.roundId]);
      await client.query("DELETE FROM placement_job_rounds WHERE id=$1", [f.roundId]);
      await client.query("DELETE FROM placement_application_screening_history WHERE application_id=$1", [f.applicationId]);
      await client.query("DELETE FROM placement_application_screenings WHERE application_id=$1", [f.applicationId]);
      await client.query("DELETE FROM placement_application_status_history WHERE application_id=$1", [f.applicationId]);
      await client.query("DELETE FROM placement_applications WHERE id=$1", [f.applicationId]);
      await client.query("DELETE FROM placement_job_role_options WHERE id=$1", [f.roleId]);
      await client.query("DELETE FROM placement_jobs WHERE id=$1", [f.jobId]);
      await client.query("DELETE FROM placement_company_relationships WHERE id=$1", [f.relationshipId]);
      await client.query("DELETE FROM placement_companies WHERE id=$1", [f.companyId]);
    }
    await client.query("COMMIT");
    created.length = 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

describe.skipIf(!enabled)("confirmed TPO round-result PostgreSQL", () => {
  afterAll(async () => {
    await cleanup();
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("stages with one actor audit, denies stale/foreign/wrong-role, then applies", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const f = await fixture();
    const body = {
      confirmed: true as const,
      expectedCurrentResultId: null,
      result: { applicationId: f.applicationId, outcome: "PASS" as const },
    };
    const wrongRole: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, roles: ["FACULTY"] },
    };
    await expect(confirmTpoRoundResult(wrongRole, f.roundId, body))
      .rejects.toBeInstanceOf(AuthorizationError);
    const foreign: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, id: SEED_IDS.facultyCollegeBMembership,
        collegeId: SEED_IDS.collegeB },
    };
    await expect(confirmTpoRoundResult(foreign, f.roundId, body))
      .rejects.toMatchObject({ code: "PLACEMENT_ROUND_NOT_FOUND" });

    const staged = await confirmTpoRoundResult(tpo, f.roundId, body);
    expect(staged.status).toBe("STAGED");
    expect(staged.outcome).toBe("PASS");

    await expect(confirmTpoRoundResult(tpo, f.roundId, body))
      .rejects.toMatchObject({ code: "PLACEMENT_RESULT_NOT_FOUND" });
    const audit = (await pool.query<{
      event_type: string;
      actor_user_id: string;
      actor_membership_id: string;
      subject_id: string;
    }>(
      "SELECT event_type,actor_user_id,actor_membership_id,subject_id " +
        "FROM activity_events WHERE event_type='placements.result.staged' " +
        "AND subject_id=$1", [staged.id],
    )).rows;
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      actor_user_id: tpo.user.id,
      actor_membership_id: tpo.membership!.id,
      subject_id: staged.id,
    });
    const rows = (await pool.query(
      "SELECT id,status,outcome FROM placement_round_results WHERE round_id=$1",
      [f.roundId],
    )).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: staged.id, status: "STAGED", outcome: "PASS" });

    await pool.query(
      "UPDATE placement_job_rounds SET status='COMPLETED',completed_at=now(),updated_at=now() " +
        "WHERE id=$1", [f.roundId],
    );
    const applied = await applyPlacementRoundResult(tpo, staged.id);
    expect(applied.status).toBe("APPLIED");
    const appliedAudits = (await pool.query(
      "SELECT id FROM activity_events WHERE event_type='placements.result.applied' " +
        "AND subject_id=$1", [staged.id],
    )).rows;
    expect(appliedAudits).toHaveLength(1);
    await expect(confirmTpoRoundResult(tpo, f.roundId, {
      ...body, expectedCurrentResultId: staged.id,
    })).rejects.toMatchObject({ code: "PLACEMENT_RESULT_ALREADY_APPLIED" });
  });
});
