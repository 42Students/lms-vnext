import { randomUUID } from "node:crypto";
import { publishableJobTerms } from "../support/publishable-job-terms";
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection,getDb } from "@/db/client";
import {placementJobEligibilityPolicies} from "@/db/schema";
import {createPlacementRound} from "@/modules/placements/round-service";
import type { RequestContext } from "@/modules/identity/context";
import {
  applyToPlacementJob,
  withdrawPlacementApplication,
} from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  createPlacementJob,
  publishPlacementJob,
} from "@/modules/placements/job-service";
import {
  decidePlacementScreening,
  ensurePlacementScreeningPending,
  getPlacementScreening,
  listPlacementScreeningQueue,
  listPlacementScreeningQueuePage,
} from "@/modules/placements/screening-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { deletePlacementRowTrees } from "../support/placement-job-tree-cleanup";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
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

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "seed-learner",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

const otherCollegeTpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};

async function cleanup() {
  // Clear every drive child (rounds, applications, stages, offers, ...) first.
  await deletePlacementRowTrees(pool);
  await pool.query("delete from placement_college_application_stage_history");
  await pool.query("delete from placement_college_application_stages");
  await pool.query(
    "delete from placement_application_screening_history",
  );
  await pool.query(
    "delete from placement_application_screenings",
  );
  await pool.query(
    "delete from placement_application_status_history",
  );
  await pool.query(
    "delete from placement_applications",
  );
  await pool.query(
    "delete from placement_eligibility_overrides",
  );
  await pool.query(
    "delete from placement_job_eligibility_policies",
  );
  await pool.query(
    "delete from placement_candidate_academic_evidence",
  );
  await pool.query("delete from placement_jobs");
  await pool.query(
    "delete from placement_company_relationships",
  );
  await pool.query("delete from placement_companies");
}

async function createPublishedJob() {
  const company = await createPlacementCompany(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      name: "Screening Systems",
      primaryDomain: "screening.example",
    },
  );
  const job = await createPlacementJob(tpo, {
    ...publishableJobTerms,
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId:
      company.relationship.id,
    title: "Screening Engineer",
    description:
      "Screening state-machine test role",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    applicationMode: "INTERNAL",
  });
  await createPlacementRound(tpo,job.id,{kind:"INTERVIEW",name:"Screening evaluation",durationMinutes:30});
  await getDb().insert(placementJobEligibilityPolicies).values({
    jobId:job.id,updatedByUserId:tpo.user.id,
  });
  return publishPlacementJob(tpo, job.id);
}

async function createApplication() {
  const job = await createPublishedJob();
  const application = await applyToPlacementJob(
    learner,
    job.id,
    {},
  );
  return { job, application };
}

/**
 * An actual independent learner for destructive role-revocation negatives.
 * DB02 permanently WITHDRAWNs academic enrollment on LEARNER role deletion;
 * NEVER revoke and re-add the shared seed learner role just to fake a test
 * rollback. Unique fixtures remain on the disposable PG17 test database only.
 */
async function createRevocableLearnerApplication() {
  const userId=randomUUID(), membershipId=randomUUID();
  const identityUid="p18-revocation-"+userId;
  await pool.query(
    "INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,'P18 revocation witness')",
    [userId,identityUid],
  );
  await pool.query(
    "INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
    [membershipId,userId,SEED_IDS.collegeA],
  );
  await pool.query(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'LEARNER')",
    [membershipId],
  );
  const enrolled=await pool.query<{program_id:string;cohort_id:string}>(
    "SELECT program_id,cohort_id FROM learner_program_enrollments WHERE membership_id=$1 AND status='ACTIVE' LIMIT 1",
    [SEED_IDS.learnerCollegeAMembership],
  );
  const current=enrolled.rows[0];
  if(!current)throw new Error("Expected a registered W04 placement cohort for independent learner");
  await pool.query(
    "INSERT INTO learner_program_enrollments(membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,'ACTIVE')",
    [membershipId,current.program_id,current.cohort_id],
  );
  await pool.query(
    "INSERT INTO placement_eligibility_decisions(college_id,scope_type,scope_id,status,decided_by_user_id) VALUES($1,'MEMBERSHIP',$2,'ELIGIBLE',$3)",
    [SEED_IDS.collegeA,membershipId,SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    "INSERT INTO placement_batch_registrations(college_id,cohort_id,membership_id,choice,consent_version,consent_at,source,recorded_by_user_id) VALUES($1,$2,$3,'PLACEMENTS','fixture',now(),'BACKFILL',$4)",
    [SEED_IDS.collegeA,current.cohort_id,membershipId,SEED_IDS.collegeAdminUser],
  );
  const ownContext:RequestContext={
    user:{id:userId,identityUid,platformStatus:"ACTIVE",systemRoles:[]},
    membership:{id:membershipId,collegeId:SEED_IDS.collegeA,
      organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
  };
  const job=await createPublishedJob();
  const application=await applyToPlacementJob(ownContext,job.id,{});
  return {ownContext,application,membershipId};
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

describe("Placement P6A screening", () => {
  it("creates a pending screening queue item and exposes only learner-safe state", async () => {
    const { job, application } =
      await createApplication();

    const queue =
      await listPlacementScreeningQueue(
        tpo,
        job.id,
      );
    expect(queue).toHaveLength(1);
    expect(queue[0]?.screening).toMatchObject({
      applicationId: application.id,
      status: "PENDING",
    });

    const publicView =
      await getPlacementScreening(
        learner,
        application.id,
      );
    expect(publicView).toMatchObject({
      applicationId: application.id,
      status: "UNDER_REVIEW",
      candidateMessage: null,
    });
    expect(publicView).not.toHaveProperty(
      "internalReason",
    );
  });

  it("rejects learner screening reads after a persisted LEARNER role revoke", async () => {
    const {ownContext,application,membershipId}=await createRevocableLearnerApplication();
    await pool.query(
      "DELETE FROM membership_roles WHERE membership_id=$1 AND role='LEARNER'",
      [membershipId],
    );
    // Revocation correctly creates durable WITHDRAWN academic history.
    // The stale context must not expose a screening or private manager notes.
    await expect(getPlacementScreening(ownContext, application.id))
      .rejects.toThrow("Missing permission: placements.read");
    const historical=await pool.query(
      "SELECT status,withdrawn_at FROM learner_program_enrollments WHERE membership_id=$1",
      [membershipId],
    );
    expect(historical.rows[0]?.status).toBe("WITHDRAWN");
    expect(historical.rows[0]?.withdrawn_at).toBeTruthy();
  });

  it("rejects a stale screening read when the persisted learner account is disabled", async () => {
    const { application } = await createApplication();
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",
      [SEED_IDS.learnerUser]);
    try {
      await expect(getPlacementScreening(learner, application.id))
        .rejects.toThrow("Missing permission: placements.read");
    } finally {
      await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",
        [SEED_IDS.learnerUser]);
    }
  });

  it("audits hold-to-shortlist transitions without leaking internal notes", async () => {
    const { application } =
      await createApplication();

    await decidePlacementScreening(
      tpo,
      application.id,
      {
        decision: "HOLD",
        internalReason:
          "Recruiter requested manual review",
      },
    );

    const holdView =
      await getPlacementScreening(
        learner,
        application.id,
      );
    expect(holdView).toMatchObject({
      status: "UNDER_REVIEW",
      candidateMessage: null,
    });
    expect(holdView).not.toHaveProperty(
      "internalReason",
    );

    const shortlisted =
      await decidePlacementScreening(
        tpo,
        application.id,
        {
          decision: "SHORTLISTED",
          candidateMessage:
            "Shortlisted for the next stage",
        },
      );
    expect(shortlisted.status).toBe(
      "SHORTLISTED",
    );

    const repeated =
      await decidePlacementScreening(
        tpo,
        application.id,
        {
          decision: "SHORTLISTED",
        },
      );
    expect(repeated.status).toBe(
      "SHORTLISTED",
    );

    const managerView =
      await getPlacementScreening(
        tpo,
        application.id,
      );
    if (!("history" in managerView)) {
      throw new Error(
        "Manager screening view must include history",
      );
    }
    expect(managerView.history).toHaveLength(2);
    expect(
      managerView.history.map((item) => [
        item.fromStatus,
        item.toStatus,
      ]),
    ).toEqual([
      ["PENDING", "HOLD"],
      ["HOLD", "SHORTLISTED"],
    ]);

    await expect(
      decidePlacementScreening(
        tpo,
        application.id,
        {
          decision: "REJECTED",
          candidateMessage:
            "Not selected after review",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_SCREENING_INVALID_TRANSITION",
    });
  });

  it("keeps rejection internals private while exposing candidate-safe wording", async () => {
    const { application } =
      await createApplication();

    await decidePlacementScreening(
      tpo,
      application.id,
      {
        decision: "REJECTED",
        candidateMessage:
          "Not shortlisted for this opportunity",
        internalReason:
          "Role-specific recruiter assessment",
      },
    );

    const publicView =
      await getPlacementScreening(
        learner,
        application.id,
      );
    expect(publicView).toMatchObject({
      status: "REJECTED",
      candidateMessage:
        "Not shortlisted for this opportunity",
    });
    expect(publicView).not.toHaveProperty(
      "internalReason",
    );

    const managerView =
      await getPlacementScreening(
        tpo,
        application.id,
      );
    if (!("screening" in managerView)) {
      throw new Error(
        "Manager screening view must include internal state",
      );
    }
    expect(
      managerView.screening.internalReason,
    ).toBe(
      "Role-specific recruiter assessment",
    );
  });

  it("removes withdrawn applications from the active queue and blocks later decisions", async () => {
    const { job, application } =
      await createApplication();
    await withdrawPlacementApplication(
      learner,
      application.id,
    );

    await expect(
      listPlacementScreeningQueue(tpo, job.id),
    ).resolves.toEqual([]);

    await expect(
      decidePlacementScreening(
        tpo,
        application.id,
        {
          decision: "SHORTLISTED",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_SCREENING_APPLICATION_INACTIVE",
    });
  });

  it("blocks a decision when the persisted TPO role is revoked after authentication", async () => {
    const { application } = await createApplication();
    await pool.query(
      "DELETE FROM membership_roles WHERE membership_id=$1 AND role='TPO'",
      [SEED_IDS.facultyCollegeAMembership],
    );
    try {
      await expect(decidePlacementScreening(tpo, application.id, {
        decision: "SHORTLISTED", candidateMessage: "Should never be visible",
      })).rejects.toThrow("Missing permission: membership.role.manage");
      const [screening, history] = await Promise.all([
        pool.query("SELECT status FROM placement_application_screenings WHERE application_id=$1",
          [application.id]),
        pool.query("SELECT id FROM placement_application_screening_history WHERE application_id=$1",
          [application.id]),
      ]);
      expect(screening.rows[0]?.status).toBe("PENDING");
      expect(history.rows).toHaveLength(0);
    } finally {
      await pool.query(
        "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING",
        [SEED_IDS.facultyCollegeAMembership],
      );
    }
  });

  it("serializes screening decisions with an in-flight TPO grant revoke", async () => {
    const { application } = await createApplication();
    // This suite's pool has max=1. A separate holder connection allows the
    // observer to query pg_stat_activity while the screening writer waits.
    const blockerPool = new Pool({ connectionString: databaseUrl, max: 1 });
    const holder = await blockerPool.connect();
    let held = false;
    let pending: Promise<{ok:boolean;error?:unknown}> | null = null;
    try {
      await holder.query("BEGIN");
      held = true;
      const grants = await holder.query(
        "SELECT membership_id FROM membership_roles WHERE membership_id=$1 AND role='TPO' FOR UPDATE",
        [SEED_IDS.facultyCollegeAMembership],
      );
      expect(grants.rows).toHaveLength(1);
      pending = decidePlacementScreening(tpo, application.id, {
        decision: "SHORTLISTED",
        candidateMessage: "A revoked actor cannot submit this decision",
      }).then(() => ({ok:true}), error => ({ok:false,error}));

      let blocked = false;
      for (let attempt = 0; attempt < 160; attempt++) {
        const activity = await pool.query<{blocked:string}>(
          "SELECT count(*)::text AS blocked FROM pg_stat_activity " +
          "WHERE datname=current_database() AND pid<>pg_backend_pid() " +
          "AND wait_event_type='Lock' AND query ILIKE '%membership_roles%'",
        );
        if (Number(activity.rows[0]?.blocked ?? 0) > 0) {
          blocked = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      expect(blocked).toBe(true);
      await holder.query(
        "DELETE FROM membership_roles WHERE membership_id=$1 AND role='TPO'",
        [SEED_IDS.facultyCollegeAMembership],
      );
      await holder.query("COMMIT");
      held = false;
      const outcome = await pending;
      expect(outcome).toMatchObject({ok:false});
      expect(String((outcome.error as Error)?.message ?? ""))
        .toContain("Missing permission: membership.role.manage");
      const [rows, history] = await Promise.all([
        pool.query("SELECT status FROM placement_application_screenings WHERE application_id=$1",
          [application.id]),
        pool.query("SELECT id FROM placement_application_screening_history WHERE application_id=$1",
          [application.id]),
      ]);
      expect(rows.rows[0]?.status).toBe("PENDING");
      expect(history.rows).toHaveLength(0);
    } finally {
      if (held) await holder.query("ROLLBACK").catch(() => undefined);
      holder.release();
      if (pending) await pending;
      await blockerPool.end();
      await pool.query(
        "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING",
        [SEED_IDS.facultyCollegeAMembership],
      );
    }
  }, 20_000);

  it("blocks a decision when the persisted screening manager account is disabled", async () => {
    const { application } = await createApplication();
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",
      [SEED_IDS.facultyUser]);
    try {
      await expect(decidePlacementScreening(tpo, application.id, {
        decision: "REJECTED", candidateMessage: "Not selected", internalReason: "Stale actor",
      })).rejects.toThrow("Missing permission: placements.manage");
      const history = await pool.query(
        "SELECT id FROM placement_application_screening_history WHERE application_id=$1",
        [application.id],
      );
      expect(history.rows).toHaveLength(0);
    } finally {
      await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",
        [SEED_IDS.facultyUser]);
    }
  });

  it("cannot recreate a missing screening row after staff grant revocation", async () => {
    const { application } = await createApplication();
    await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1",
      [application.id]);
    await pool.query(
      "DELETE FROM membership_roles WHERE membership_id=$1 AND role='TPO'",
      [SEED_IDS.facultyCollegeAMembership],
    );
    try {
      await expect(ensurePlacementScreeningPending(tpo, application.id))
        .rejects.toThrow("Missing permission: membership.role.manage");
      const rows = await pool.query(
        "SELECT application_id FROM placement_application_screenings WHERE application_id=$1",
        [application.id],
      );
      expect(rows.rows).toHaveLength(0);
    } finally {
      await pool.query(
        "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING",
        [SEED_IDS.facultyCollegeAMembership],
      );
    }
  });

  it("cannot repair a screening row for a withdrawn application", async () => {
    const { application } = await createApplication();
    await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1",
      [application.id]);
    await withdrawPlacementApplication(learner, application.id);
    await expect(ensurePlacementScreeningPending(tpo, application.id))
      .rejects.toMatchObject({code:"PLACEMENT_SCREENING_APPLICATION_INACTIVE"});
    const rows = await pool.query(
      "SELECT application_id FROM placement_application_screenings WHERE application_id=$1",
      [application.id],
    );
    expect(rows.rows).toHaveLength(0);
  });

  it("denies candidate-contact queue, paged queue and private history after persisted staff role revoke", async () => {
    const { job, application } = await createApplication();
    await pool.query(
      "DELETE FROM membership_roles WHERE membership_id=$1 AND role='TPO'",
      [SEED_IDS.facultyCollegeAMembership],
    );
    try {
      await expect(listPlacementScreeningQueue(tpo, job.id))
        .rejects.toThrow("Missing permission: membership.role.manage");
      await expect(listPlacementScreeningQueuePage(tpo, job.id, {page:1,size:10}))
        .rejects.toThrow("Missing permission: membership.role.manage");
      await expect(getPlacementScreening(tpo, application.id))
        .rejects.toThrow("Missing permission: membership.role.manage");
    } finally {
      await pool.query(
        "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING",
        [SEED_IDS.facultyCollegeAMembership],
      );
    }
  });

  it("denies staff-only queue and history while persisted manager account is disabled", async () => {
    const { job, application } = await createApplication();
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",
      [SEED_IDS.facultyUser]);
    try {
      await expect(listPlacementScreeningQueue(tpo, job.id))
        .rejects.toThrow("Missing permission: placements.manage");
      await expect(getPlacementScreening(tpo, application.id))
        .rejects.toThrow("Missing permission: placements.manage");
    } finally {
      await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",
        [SEED_IDS.facultyUser]);
    }
  });

  it("does not reveal the staff screening queue when a grant revoke wins the read race", async () => {
    const { job } = await createApplication();
    const blockerPool = new Pool({ connectionString: databaseUrl, max: 1 });
    const holder = await blockerPool.connect();
    let held = false;
    let pending: Promise<{ok:boolean;error?:unknown}> | null = null;
    try {
      await holder.query("BEGIN");
      held = true;
      const grants = await holder.query(
        "SELECT membership_id FROM membership_roles WHERE membership_id=$1 AND role='TPO' FOR UPDATE",
        [SEED_IDS.facultyCollegeAMembership],
      );
      expect(grants.rows).toHaveLength(1);
      pending = listPlacementScreeningQueue(tpo, job.id)
        .then(() => ({ok:true}), error => ({ok:false,error}));
      let blocked=false;
      for(let attempt=0;attempt<160;attempt++){
        const activity=await pool.query<{blocked:string}>(
          "SELECT count(*)::text AS blocked FROM pg_stat_activity " +
          "WHERE datname=current_database() AND pid<>pg_backend_pid() " +
          "AND wait_event_type='Lock' AND query ILIKE '%membership_roles%'",
        );
        if(Number(activity.rows[0]?.blocked??0)>0){blocked=true;break;}
        await new Promise(resolve=>setTimeout(resolve,25));
      }
      expect(blocked).toBe(true);
      await holder.query(
        "DELETE FROM membership_roles WHERE membership_id=$1 AND role='TPO'",
        [SEED_IDS.facultyCollegeAMembership],
      );
      await holder.query("COMMIT");
      held=false;
      const outcome=await pending;
      expect(outcome.ok).toBe(false);
      expect(String((outcome.error as Error)?.message??""))
        .toContain("Missing permission: membership.role.manage");
    } finally {
      if(held)await holder.query("ROLLBACK").catch(()=>undefined);
      holder.release();
      if(pending)await pending;
      await blockerPool.end();
      await pool.query(
        "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING",
        [SEED_IDS.facultyCollegeAMembership],
      );
    }
  }, 20_000);

  it("rejects a screening manager from another college", async () => {
    const { job, application } =
      await createApplication();

    await expect(
      listPlacementScreeningQueue(
        otherCollegeTpo,
        job.id,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );

    await expect(
      decidePlacementScreening(
        otherCollegeTpo,
        application.id,
        {
          decision: "SHORTLISTED",
        },
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
  });
});
