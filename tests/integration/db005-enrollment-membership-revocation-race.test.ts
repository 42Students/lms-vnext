import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { createLearnerProgramEnrollment } from "@/modules/academics/enrollment-service";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * DB-004 + DB-005: run the actual enrollment service against an isolated PG17
 * database. A stale preflight must not enroll a student after the membership
 * is suspended or its LEARNER grant is revoked.
 *
 * No direct database connection is allowed without the test-only CI opt-in.
 */
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || testUrl !== process.env.DATABASE_URL ||
    process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("DB005 enrollment races require the isolated, identical TEST_DATABASE_URL and DATABASE_URL with DB03_ISOLATED_TEST_DATABASE=1");
}
const target = new URL(testUrl);
const dbName = decodeURIComponent(target.pathname.replace(/^\//, ""));
if (!["postgres:", "postgresql:"].includes(target.protocol) ||
    !/^(test_[a-z0-9_]+|[a-z0-9_]+_test(?:_[a-z0-9]+)*)$/i.test(dbName)) {
  throw new Error("DB005 enrollment race target must be an explicitly named test database");
}
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
if (!localHosts.has(target.hostname.toLowerCase()) &&
    process.env.DB01_REMOTE_TEST_DATABASE_CONFIRM !==
      `RESET:${target.hostname.toLowerCase()}/${dbName}`) {
  throw new Error("DB005 remote enrollment race target requires exact confirmation");
}

const pool = new Pool({ connectionString: testUrl, max: 4, statement_timeout: 10_000 });

const collegeAdmin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

type Fixture = {
  userId: string;
  membershipId: string;
  periodId: string;
  programId: string;
  cohortId: string;
};

async function withFixture(run: (f: Fixture) => Promise<void>) {
  const f: Fixture = {
    userId: randomUUID(),
    membershipId: randomUUID(),
    periodId: randomUUID(),
    programId: randomUUID(),
    cohortId: randomUUID(),
  };
  try {
    await pool.query(
      "insert into users (id, identity_uid, display_name) values ($1,$2,'DB005 isolated learner')",
      [f.userId, `db005-enrollment-${f.userId}`],
    );
    await pool.query(
      "insert into college_memberships (id, user_id, college_id, status) values ($1,$2,$3,'ACTIVE')",
      [f.membershipId, f.userId, SEED_IDS.collegeA],
    );
    await pool.query(
      "insert into membership_roles (membership_id, role) values ($1,'LEARNER')",
      [f.membershipId],
    );
    await pool.query(
      `insert into programs (id, department_id, name, code, duration_terms)
       values ($1,$2,$3,$4,8)`,
      [f.programId, SEED_IDS.departmentA, `DB005 ${f.programId}`, `DB005-${f.programId}`],
    );
    await pool.query(
      `insert into academic_periods (id, college_id, name, code, start_date, end_date, status)
       values ($1,$2,$3,$4,'2026-07-01','2026-12-31','ACTIVE')`,
      [f.periodId, SEED_IDS.collegeA, `DB005 ${f.periodId}`, `DB005-${f.periodId}`],
    );
    await pool.query(
      `insert into cohorts (id, program_id, name, code, start_period_id, status)
       values ($1,$2,$3,$4,$5,'ACTIVE')`,
      [f.cohortId, f.programId, `DB005 ${f.cohortId}`, `DB005-${f.cohortId}`, f.periodId],
    );
    await run(f);
  } finally {
    // Never delete seeded identities or touch production/shared data.
    // Activity events refer to the created enrollment by text subject ID.
    await pool.query(
      `delete from activity_events where subject_type = 'learner_program_enrollment'
         and subject_id in (
           select id::text from learner_program_enrollments where membership_id=$1
         )`,
      [f.membershipId],
    );
    await pool.query(
      "delete from learner_program_enrollments where membership_id=$1",
      [f.membershipId],
    );
    await pool.query("delete from cohorts where id=$1", [f.cohortId]);
    await pool.query("delete from academic_periods where id=$1", [f.periodId]);
    await pool.query("delete from programs where id=$1", [f.programId]);
    await pool.query("delete from membership_roles where membership_id=$1", [f.membershipId]);
    await pool.query("delete from college_memberships where id=$1", [f.membershipId]);
    await pool.query("delete from users where id=$1", [f.userId]);
  }
}

async function enrollmentCount(membershipId: string): Promise<number> {
  const result = await pool.query<{ n: string }>(
    "select count(*)::text as n from learner_program_enrollments where membership_id=$1",
    [membershipId],
  );
  return Number(result.rows[0]?.n ?? 0);
}

afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("DB005 learner enrollment versus membership/role lifecycle (real PostgreSQL)", () => {
  it("preserves valid learner enrollment with an active membership and grant", async () => {
    await withFixture(async f => {
      const result = await createLearnerProgramEnrollment(collegeAdmin, {
        membershipId: f.membershipId, programId: f.programId, cohortId: f.cohortId,
      });
      expect(result.membershipId).toBe(f.membershipId);
      expect(await enrollmentCount(f.membershipId)).toBe(1);
    });
  });

  it("rejects a suspended learner without writing an enrollment", async () => {
    await withFixture(async f => {
      await pool.query(
        "update college_memberships set status='SUSPENDED' where id=$1",
        [f.membershipId],
      );
      await expect(createLearnerProgramEnrollment(collegeAdmin, {
        membershipId: f.membershipId, programId: f.programId, cohortId: f.cohortId,
      })).rejects.toMatchObject({ code: "MEMBERSHIP_NOT_ACTIVE" });
      expect(await enrollmentCount(f.membershipId)).toBe(0);
    });
  });

  it("rejects a revoked LEARNER role without writing an enrollment", async () => {
    await withFixture(async f => {
      await pool.query(
        "delete from membership_roles where membership_id=$1 and role='LEARNER'",
        [f.membershipId],
      );
      await expect(createLearnerProgramEnrollment(collegeAdmin, {
        membershipId: f.membershipId, programId: f.programId, cohortId: f.cohortId,
      })).rejects.toMatchObject({ code: "LEARNER_ROLE_REQUIRED" });
      expect(await enrollmentCount(f.membershipId)).toBe(0);
    });
  });

  it("rejects an ACTIVE membership with a non-null suspension marker", async () => {
    await withFixture(async f => {
      await pool.query(
        "update college_memberships set suspended_at=clock_timestamp() where id=$1",
        [f.membershipId],
      );
      await expect(createLearnerProgramEnrollment(collegeAdmin, {
        membershipId: f.membershipId, programId: f.programId, cohortId: f.cohortId,
      })).rejects.toMatchObject({code:"MEMBERSHIP_NOT_ACTIVE"});
      expect(await enrollmentCount(f.membershipId)).toBe(0);
    });
  });

  it("rejects a platform-disabled learner even when the college membership stays ACTIVE", async () => {
    await withFixture(async f => {
      await pool.query("update users set platform_status='DISABLED' where id=$1", [f.userId]);
      await expect(createLearnerProgramEnrollment(collegeAdmin, {
        membershipId: f.membershipId, programId: f.programId, cohortId: f.cohortId,
      })).rejects.toMatchObject({code:"MEMBERSHIP_NOT_ACTIVE"});
      expect(await enrollmentCount(f.membershipId)).toBe(0);
    });
  });

  it("serializes platform disablement before a new enrollment", async () => {
    await withFixture(async f => {
      const writer = await pool.connect();
      let open = false;
      let task: Promise<{accepted:boolean;error?:unknown}> | null = null;
      try {
        await writer.query("BEGIN");
        open = true;
        await writer.query("update users set platform_status='DISABLED' where id=$1", [f.userId]);
        let settled = false;
        task = createLearnerProgramEnrollment(collegeAdmin, {
          membershipId:f.membershipId,programId:f.programId,cohortId:f.cohortId,
        }).then(()=>({accepted:true}),error=>({accepted:false,error}))
          .finally(()=>{settled=true;});
        await new Promise(resolve=>setTimeout(resolve,120));
        expect(settled).toBe(false);
        await writer.query("COMMIT");
        open = false;
        const result=await task;
        expect(result.accepted).toBe(false);
        expect(result.error).toMatchObject({code:"MEMBERSHIP_NOT_ACTIVE"});
        expect(await enrollmentCount(f.membershipId)).toBe(0);
      } finally {
        if(open)await writer.query("ROLLBACK");
        writer.release();
        if(task)await task;
      }
    });
  });

  it("serializes a concurrent membership suspension before new enrollment", async () => {
    await withFixture(async f => {
      const writer: PoolClient = await pool.connect();
      let open = false;
      let task: Promise<{ accepted: boolean; error?: unknown }> | null = null;
      try {
        await writer.query("BEGIN");
        open = true;
        await writer.query("update college_memberships set status='SUSPENDED' where id=$1", [f.membershipId]);
        let settled = false;
        task = createLearnerProgramEnrollment(collegeAdmin, {
          membershipId: f.membershipId, programId: f.programId, cohortId: f.cohortId,
        }).then(
          () => ({ accepted: true }),
          (error: unknown) => ({ accepted: false, error }),
        ).finally(() => { settled = true; });
        await new Promise(resolve => setTimeout(resolve, 120));
        expect(settled).toBe(false);
        await writer.query("COMMIT");
        open = false;
        const result = await task;
        expect(result.accepted).toBe(false);
        expect(result.error).toMatchObject({ code: "MEMBERSHIP_NOT_ACTIVE" });
        expect(await enrollmentCount(f.membershipId)).toBe(0);
      } finally {
        if (open) await writer.query("ROLLBACK");
        writer.release();
        if (task) await task;
      }
    });
  });

  it("serializes concurrent LEARNER-role deletion before enrollment", async () => {
    await withFixture(async f => {
      const writer: PoolClient = await pool.connect();
      let open = false;
      let task: Promise<{ accepted: boolean; error?: unknown }> | null = null;
      try {
        await writer.query("BEGIN");
        open = true;
        // Match the production role-writer order: membership parent first.
        await writer.query("select id from college_memberships where id=$1 for update", [f.membershipId]);
        await writer.query(
          "delete from membership_roles where membership_id=$1 and role='LEARNER'",
          [f.membershipId],
        );
        let settled = false;
        task = createLearnerProgramEnrollment(collegeAdmin, {
          membershipId: f.membershipId, programId: f.programId, cohortId: f.cohortId,
        }).then(
          () => ({ accepted: true }),
          (error: unknown) => ({ accepted: false, error }),
        ).finally(() => { settled = true; });
        await new Promise(resolve => setTimeout(resolve, 120));
        expect(settled).toBe(false);
        await writer.query("COMMIT");
        open = false;
        const result = await task;
        expect(result.accepted).toBe(false);
        expect(result.error).toMatchObject({ code: "LEARNER_ROLE_REQUIRED" });
        expect(await enrollmentCount(f.membershipId)).toBe(0);
      } finally {
        if (open) await writer.query("ROLLBACK");
        writer.release();
        if (task) await task;
      }
    });
  });
});
