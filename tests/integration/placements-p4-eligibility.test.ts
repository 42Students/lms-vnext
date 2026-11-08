import { randomUUID } from "node:crypto";
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  createPlacementJob,
} from "@/modules/placements/job-service";
import {
  evaluatePlacementEligibility,
  getManagedAcademicEvidence,
  setEligibilityOverride,
  upsertJobEligibilityPolicy,
  upsertOwnAcademicEvidence,
  upsertVerifiedAcademicEvidence,
} from "@/modules/placements/eligibility-service";
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

const otherMembership = {
  id: "79000000-0000-4000-8000-000000000001",
  roleId: "79000000-0000-4000-8000-000000000002",
};

async function cleanup() {
  // Clear every drive child (rounds, applications, stages, offers, ...) first.
  await deletePlacementRowTrees(pool);
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
  await pool.query(
    "delete from membership_roles where id = $1",
    [otherMembership.roleId],
  );
  await pool.query(
    "delete from college_memberships where id = $1",
    [otherMembership.id],
  );
}

async function createJob() {
  const company = await createPlacementCompany(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      name: "Eligibility Systems",
      primaryDomain: "eligibility.example",
    },
  );

  return createPlacementJob(tpo, {
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId:
      company.relationship.id,
    title: "Eligibility Engineer",
    description: "Eligibility test role",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    locations: ["Hyderabad"],
    applicationMode: "INTERNAL",
  });
}

beforeEach(async () => {
  await cleanup();
  await enableSeedLearnerPlacementAccess(pool);
  await pool.query(
    `insert into college_memberships
      (id, user_id, college_id, status)
     values ($1, $2, $3, 'ACTIVE')`,
    [
      otherMembership.id,
      SEED_IDS.learnerUser,
      SEED_IDS.collegeB,
    ],
  );
  await pool.query(
    `insert into membership_roles
      (id, membership_id, role)
     values ($1, $2, 'LEARNER')`,
    [otherMembership.roleId, otherMembership.id],
  );
});

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Placement P4 eligibility", () => {
  it("distinguishes missing evidence, hard failure and verified eligibility", async () => {
    const job = await createJob();
    await upsertJobEligibilityPolicy(
      tpo,
      job.id,
      {
        minCgpa: 7.5,
        maxActiveBacklogs: 0,
        minTenthPercentage: 60,
      },
    );

    await expect(
      evaluatePlacementEligibility(
        learner,
        job.id,
      ),
    ).resolves.toMatchObject({
      status:
        "ELIGIBLE_WITH_MISSING_EVIDENCE",
      checks: expect.arrayContaining([
        expect.objectContaining({
          criterion: "CGPA",
          status: "MISSING",
        }),
      ]),
    });

    await upsertOwnAcademicEvidence(learner, {
      cgpa: 7.1,
      activeBacklogs: 0,
      tenthPercentage: 82,
    });
    await expect(
      evaluatePlacementEligibility(
        learner,
        job.id,
      ),
    ).resolves.toMatchObject({
      status: "INELIGIBLE",
      checks: expect.arrayContaining([
        expect.objectContaining({
          criterion: "CGPA",
          status: "FAIL",
        }),
      ]),
    });

    await upsertVerifiedAcademicEvidence(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
      {
        cgpa: 8.2,
        activeBacklogs: 0,
        tenthPercentage: 82,
      },
    );
    await expect(
      evaluatePlacementEligibility(
        learner,
        job.id,
      ),
    ).resolves.toMatchObject({
      status: "ELIGIBLE",
    });

    await expect(
      upsertOwnAcademicEvidence(learner, {
        cgpa: 9,
      }),
    ).rejects.toMatchObject({
      code: "PLACEMENT_ACADEMIC_EVIDENCE_VERIFIED",
    });
  });

  it("lets managers read normalized candidate evidence only inside their placement tenant", async () => {
    await upsertOwnAcademicEvidence(learner, {
      cgpa: 8.15,
      activeBacklogs: 1,
      tenthPercentage: 82.75,
      twelfthPercentage: 79.5,
      gapYears: 0,
      passingYear: 2026,
    });

    await expect(
      getManagedAcademicEvidence(
        tpo,
        SEED_IDS.learnerCollegeAMembership,
      ),
    ).resolves.toMatchObject({
      membershipId:
        SEED_IDS.learnerCollegeAMembership,
      source: "SELF",
      cgpa: 8.15,
      activeBacklogs: 1,
      tenthPercentage: 82.75,
      twelfthPercentage: 79.5,
      passingYear: 2026,
    });

    await upsertVerifiedAcademicEvidence(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
      {
        cgpa: 8.25,
        activeBacklogs: 0,
        tenthPercentage: 83,
        twelfthPercentage: 80,
        gapYears: 0,
        passingYear: 2026,
      },
    );

    await expect(
      getManagedAcademicEvidence(
        tpo,
        SEED_IDS.learnerCollegeAMembership,
      ),
    ).resolves.toMatchObject({
      source: "VERIFIED",
      cgpa: 8.25,
      activeBacklogs: 0,
      tenthPercentage: 83,
      twelfthPercentage: 80,
    });

    await expect(
      getManagedAcademicEvidence(
        tpo,
        otherMembership.id,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
  });

  it("denies private academic evidence reads with stale manager TPO grant", async () => {
    await upsertOwnAcademicEvidence(learner,{cgpa:7.7});
    await pool.query(
      "DELETE FROM membership_roles WHERE membership_id=$1 AND role='TPO'",
      [SEED_IDS.facultyCollegeAMembership],
    );
    try {
      await expect(getManagedAcademicEvidence(tpo,SEED_IDS.learnerCollegeAMembership))
        .rejects.toThrow("Missing permission: placements.manage");
    } finally {
      await pool.query(
        "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING",
        [SEED_IDS.facultyCollegeAMembership],
      );
    }
  });

  it("denies private academic evidence reads when persisted manager is disabled", async () => {
    await upsertOwnAcademicEvidence(learner,{cgpa:7.7});
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",
      [SEED_IDS.facultyUser]);
    try {
      await expect(getManagedAcademicEvidence(tpo,SEED_IDS.learnerCollegeAMembership))
        .rejects.toThrow("Missing permission: placements.manage");
    } finally {
      await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",
        [SEED_IDS.facultyUser]);
    }
  });

  it("refuses verified evidence after the manager TPO grant is revoked", async () => {
    await pool.query(
      "DELETE FROM membership_roles WHERE membership_id=$1 AND role='TPO'",
      [SEED_IDS.facultyCollegeAMembership],
    );
    try {
      await expect(upsertVerifiedAcademicEvidence(tpo,
        SEED_IDS.learnerCollegeAMembership,{cgpa:8.25}))
        .rejects.toThrow("Missing permission: placements.manage");
      const evidence=await pool.query(
        "SELECT membership_id FROM placement_candidate_academic_evidence WHERE membership_id=$1",
        [SEED_IDS.learnerCollegeAMembership],
      );
      expect(evidence.rows).toHaveLength(0);
    } finally {
      await pool.query(
        "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING",
        [SEED_IDS.facultyCollegeAMembership],
      );
    }
  });

  it("refuses staff verification after account disablement without stamping evidence", async () => {
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",
      [SEED_IDS.facultyUser]);
    try {
      await expect(upsertVerifiedAcademicEvidence(tpo,
        SEED_IDS.learnerCollegeAMembership,{cgpa:8.25}))
        .rejects.toThrow("Missing permission: placements.manage");
      const evidence=await pool.query(
        "SELECT membership_id FROM placement_candidate_academic_evidence WHERE membership_id=$1",
        [SEED_IDS.learnerCollegeAMembership],
      );
      expect(evidence.rows).toHaveLength(0);
    } finally {
      await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",
        [SEED_IDS.facultyUser]);
    }
  });

  it("serializes staff academic verification with TPO role removal", async () => {
    const lockPool = new Pool({connectionString:databaseUrl,max:1});
    const holder=await lockPool.connect();
    let held=false;
    let pending:Promise<{ok:boolean;error?:unknown}>|null=null;
    try {
      await holder.query("BEGIN");
      held=true;
      const role=await holder.query(
        "SELECT membership_id FROM membership_roles WHERE membership_id=$1 AND role='TPO' FOR UPDATE",
        [SEED_IDS.facultyCollegeAMembership],
      );
      expect(role.rows).toHaveLength(1);
      pending=upsertVerifiedAcademicEvidence(tpo,SEED_IDS.learnerCollegeAMembership,
        {cgpa:8.25}).then(()=>({ok:true}),error=>({ok:false,error}));
      let blocked=false;
      for(let attempt=0;attempt<160;attempt++){
        const result=await pool.query<{blocked:string}>(
          "SELECT count(*)::text AS blocked FROM pg_stat_activity " +
          "WHERE datname=current_database() AND pid<>pg_backend_pid() " +
          "AND wait_event_type='Lock' AND query ILIKE '%membership_roles%'",
        );
        if(Number(result.rows[0]?.blocked??0)>0){blocked=true;break;}
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
        .toContain("Missing permission: placements.manage");
      const evidence=await pool.query(
        "SELECT membership_id FROM placement_candidate_academic_evidence WHERE membership_id=$1",
        [SEED_IDS.learnerCollegeAMembership],
      );
      expect(evidence.rows).toHaveLength(0);
    } finally {
      if(held)await holder.query("ROLLBACK").catch(()=>undefined);
      holder.release();
      if(pending)await pending;
      await lockPool.end();
      await pool.query(
        "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING",
        [SEED_IDS.facultyCollegeAMembership],
      );
    }
  },20_000);

  it("rejects a new override for a disabled learner without persisting it", async () => {
    const job=await createJob();
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",
      [SEED_IDS.learnerUser]);
    try {
      await expect(setEligibilityOverride(tpo,job.id,SEED_IDS.learnerCollegeAMembership,{
        decision:"INCLUDE",reason:"Must not override a disabled learner account",
      })).rejects.toMatchObject({code:"PLACEMENT_LEARNER_MEMBERSHIP_NOT_FOUND"});
      const overrides=await pool.query(
        "SELECT id FROM placement_eligibility_overrides WHERE job_id=$1",
        [job.id],
      );
      expect(overrides.rows).toHaveLength(0);
    } finally {
      await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",
        [SEED_IDS.learnerUser]);
    }
  });

  it("serializes override creation after a real learner role removal", async () => {
    // Unlike the shared seed learner, this one has no academic enrollment:
    // DB02's irreversible withdrawal trigger stays enabled and untouched.
    const userId=randomUUID(),membershipId=randomUUID();
    const lockPool=new Pool({connectionString:databaseUrl,max:1});
    let holder:Awaited<ReturnType<typeof lockPool.connect>>|null=null;
    let held=false;
    let pending:Promise<{ok:boolean;error?:unknown}>|null=null;
    await pool.query(
      "INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,'P18 eligibility race witness')",
      [userId,"p18-eligibility-"+userId],
    );
    await pool.query(
      "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1,$2,$3,'ACTIVE')",
      [membershipId,userId,SEED_IDS.collegeA],
    );
    await pool.query(
      "INSERT INTO membership_roles(membership_id,role) VALUES($1,'LEARNER')",
      [membershipId],
    );
    try {
      const job=await createJob();
      holder=await lockPool.connect();
      await holder.query("BEGIN");
      held=true;
      const grant=await holder.query(
        "SELECT membership_id FROM membership_roles WHERE membership_id=$1 AND role='LEARNER' FOR UPDATE",
        [membershipId],
      );
      expect(grant.rows).toHaveLength(1);
      pending=setEligibilityOverride(tpo,job.id,membershipId,{
        decision:"INCLUDE",reason:"Must not authorize after learner role deletion",
      }).then(()=>({ok:true}),error=>({ok:false,error}));
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
        "DELETE FROM membership_roles WHERE membership_id=$1 AND role='LEARNER'",
        [membershipId],
      );
      await holder.query("COMMIT");
      held=false;
      const outcome=await pending;
      expect(outcome.ok).toBe(false);
      expect((outcome.error as {code?:string})?.code)
        .toBe("PLACEMENT_LEARNER_MEMBERSHIP_NOT_FOUND");
      const overrides=await pool.query(
        "SELECT id FROM placement_eligibility_overrides WHERE job_id=$1 AND membership_id=$2",
        [job.id,membershipId],
      );
      expect(overrides.rows).toHaveLength(0);
    } finally {
      if(held&&holder)await holder.query("ROLLBACK").catch(()=>undefined);
      if(holder)holder.release();
      if(pending)await pending;
      await lockPool.end();
      await pool.query("DELETE FROM membership_roles WHERE membership_id=$1",[membershipId]);
      await pool.query("DELETE FROM college_memberships WHERE id=$1",[membershipId]);
      await pool.query("DELETE FROM users WHERE id=$1",[userId]);
    }
  },20_000);

  it("supports explicit reasoned overrides without deleting underlying evidence", async () => {
    const job = await createJob();
    await upsertJobEligibilityPolicy(
      tpo,
      job.id,
      {
        minCgpa: 9,
        missingEvidencePolicy:
          "REQUIRE_COMPLETE",
      },
    );
    await upsertVerifiedAcademicEvidence(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
      { cgpa: 7.5 },
    );

    await setEligibilityOverride(
      tpo,
      job.id,
      SEED_IDS.learnerCollegeAMembership,
      {
        decision: "INCLUDE",
        reason:
          "Approved documented exception by placement cell",
      },
    );

    await expect(
      evaluatePlacementEligibility(
        learner,
        job.id,
      ),
    ).resolves.toMatchObject({
      status: "ELIGIBLE",
      override: {
        decision: "INCLUDE",
      },
    });
  });

  it("rejects cross-college learner substitution", async () => {
    const job = await createJob();

    await expect(
      evaluatePlacementEligibility(
        tpo,
        job.id,
        otherMembership.id,
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_LEARNER_MEMBERSHIP_NOT_FOUND",
    });

    await expect(
      setEligibilityOverride(
        tpo,
        job.id,
        otherMembership.id,
        {
          decision: "INCLUDE",
          reason: "Must not cross tenant boundary",
        },
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_LEARNER_MEMBERSHIP_NOT_FOUND",
    });
  });

  it("rejects unknown and foreign-college academic policy scopes before persisting", async () => {
    const job = await createJob();
    const foreignProgram = await pool.query<{ id: string }>(
      `insert into programs (department_id, name, code, duration_terms)
       values ($1, $2, $3, 8) returning id`,
      [SEED_IDS.departmentB, "Foreign policy guard", "P4-FGN"],
    );
    const foreignProgramId = foreignProgram.rows[0]!.id;
    try {
      await expect(
        upsertJobEligibilityPolicy(tpo, job.id, {
          allowedProgramIds: [foreignProgramId],
          missingEvidencePolicy: "REQUIRE_COMPLETE",
        }),
      ).rejects.toMatchObject({
        code: "PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH",
      });
      await expect(
        upsertJobEligibilityPolicy(tpo, job.id, {
          allowedCohortIds: ["90000000-0000-4000-8000-000000000099"],
          missingEvidencePolicy: "REQUIRE_COMPLETE",
        }),
      ).rejects.toMatchObject({
        code: "PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH",
      });
      const stored = await pool.query(
        "select job_id from placement_job_eligibility_policies where job_id = $1",
        [job.id],
      );
      expect(stored.rows).toHaveLength(0);
    } finally {
      await pool.query("delete from programs where id = $1", [foreignProgramId]);
    }
  });

});
