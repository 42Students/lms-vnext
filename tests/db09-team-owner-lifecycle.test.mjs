// DB-069 / Chat 3 — mutable drive owner + team removal lifecycle.
//
// Static:
//   node --test tests/db09-team-owner-lifecycle.test.mjs
//
// Disposable PostgreSQL (destructive only inside a random temporary schema):
//   DB09_TEAM_OWNER_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA \
//   TEST_DATABASE_URL=postgres://... \
//   node --test tests/db09-team-owner-lifecycle.test.mjs
//
// File presence is not execution evidence.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

const candidate = readFileSync(
  resolve("docs/planning/sql/db09-team-owner-lifecycle-candidate.sql"),
  "utf8",
);
const verifier = readFileSync(
  resolve("scripts/verify-db09-team-owner-source.mjs"),
  "utf8",
);
const placements = readFileSync(resolve("src/db/schema/placements.ts"), "utf8");

test("DB-069 separates mutable owner from immutable creator", () => {
  const start = placements.indexOf("export const placementJobs");
  const end = placements.indexOf("export const placementJobRoleOptions", start);
  const current = placements.slice(start, end);
  assert.match(current, /createdByUserId: uuid\("created_by_user_id"\)/);
  // The typed owner column and same-college composite FK are already
  // registered. Do not weaken this to an existence-only or absence check.
  assert.match(current, /ownerMembershipId: uuid\("owner_membership_id"\)/);
  assert.match(current, /name: "placement_jobs_owner_college_fk"/);
  assert.match(current, /columns: \[table\.ownerMembershipId, table\.collegeId\]/);
  assert.match(current, /foreignColumns: \[collegeMemberships\.id, collegeMemberships\.collegeId\]/);

  assert.match(candidate, /ADD COLUMN owner_membership_id uuid/);
  assert.match(candidate, /db069_job_owner_college_fk/);
  assert.match(candidate, /db069_live_job_owner_ck/);
  assert.match(candidate, /db069_owner_preflight/);
  assert.doesNotMatch(candidate, /DROP COLUMN created_by_user_id/);
});

test("DB-069 keeps delegated owner authority operation-specific", () => {
  assert.match(candidate, /db069_has_active_drive_owner/);
  assert.match(candidate, /r\.role IN \('TPO','COLLEGE_ADMIN'\)/);
  assert.match(candidate, /tm\.role IN \('TPO_ADMIN','FACULTY_COORDINATOR'\)/);
  assert.match(candidate, /db09_has_active_tpo_actor\(p_actor_user_id,p_college_id\)/);
});

test("DB-069 team deletion and reassignment are fail closed", () => {
  for (const marker of [
    "db069_team_member_owned_leads",
    "db069_team_member_owned_drives",
    "db069_team_remove_requires_reassign",
    "db069_team_reassign_target_scope",
    "db069_team_self_remove",
    "db069_team_reassign_distinct",
  ]) {
    assert.match(candidate, new RegExp(marker));
  }
  const fn = candidate.slice(
    candidate.indexOf("CREATE FUNCTION db069_reassign_and_remove_tpo_team_member"),
  );
  assert.ok(fn.indexOf("UPDATE placement_tpo_leads") < fn.indexOf("UPDATE placement_jobs"));
  assert.ok(fn.indexOf("UPDATE placement_jobs") < fn.indexOf("DELETE FROM placement_tpo_team_members"));
});

test("DB-069 serializes owner assignment against removal", () => {
  assert.match(candidate, /pg_advisory_xact_lock/);
  assert.match(candidate, /db069_job_owner_scope_guard/);
  assert.match(candidate, /db069_lead_owner_serialization_guard/);
  assert.match(candidate, /db069_lead_owner_scope/);
  assert.match(candidate, /db069_team_member_identity_guard/);
  assert.match(candidate, /v_old_college::text \|\| ':' \|\| v_old_owner::text/);
  assert.match(candidate, /v_new_college::text \|\| ':' \|\| v_new_owner::text/);
});

test("source verifier covers frozen owner fields and current registered owner boundary", () => {
  assert.match(verifier, /owner_faculty_id/);
  assert.match(verifier, /registered placement_jobs preserves creator and now carries scoped mutable owner identity/);
  assert.match(verifier, /direct team identity removal\/change refuses owned leads and live jobs/);
  assert.match(verifier, /lock ordering includes full college\+membership identity/);
});

const approved =
  process.env.DB09_TEAM_OWNER_DISPOSABLE ===
    "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  (!process.env.DATABASE_URL ||
    process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL);

function baseSql() {
  return `
    CREATE TABLE colleges (
      id uuid PRIMARY KEY,
      status varchar(24) NOT NULL
    );
    CREATE TABLE users (
      id uuid PRIMARY KEY,
      platform_status varchar(24) NOT NULL
    );
    CREATE TABLE college_memberships (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id),
      college_id uuid NOT NULL REFERENCES colleges(id),
      status varchar(24) NOT NULL,
      UNIQUE(id,college_id)
    );
    CREATE TABLE membership_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      membership_id uuid NOT NULL REFERENCES college_memberships(id),
      role varchar(32) NOT NULL
    );
    CREATE TABLE placement_tpo_team_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      college_id uuid NOT NULL REFERENCES colleges(id),
      membership_id uuid NOT NULL REFERENCES college_memberships(id),
      role varchar(32) NOT NULL,
      UNIQUE(college_id,membership_id)
    );
    CREATE TABLE placement_jobs (
      id uuid PRIMARY KEY,
      college_id uuid NOT NULL REFERENCES colleges(id),
      status varchar(24) NOT NULL,
      created_by_user_id uuid NOT NULL REFERENCES users(id),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE placement_tpo_leads (
      id uuid PRIMARY KEY,
      college_id uuid NOT NULL REFERENCES colleges(id),
      owner_membership_id uuid REFERENCES college_memberships(id)
    );

    -- DB09 collaboration dependency: only persisted TPO/COLLEGE_ADMIN
    -- membership roles may perform the college-wide removal operation.
    CREATE FUNCTION db09_has_active_tpo_actor(
      p_user_id uuid,
      p_college_id uuid
    ) RETURNS boolean
    LANGUAGE sql STABLE AS $$
      SELECT EXISTS (
        SELECT 1
          FROM college_memberships m
          JOIN users u ON u.id=m.user_id
          JOIN colleges c ON c.id=m.college_id
          JOIN membership_roles r ON r.membership_id=m.id
         WHERE m.user_id=p_user_id
           AND m.college_id=p_college_id
           AND m.status='ACTIVE'
           AND u.platform_status='ACTIVE'
           AND c.status='ACTIVE'
           AND r.role IN ('TPO','COLLEGE_ADMIN')
      )
    $$;
  `;
}

test(
  "DB-069 PostgreSQL boundary preserves ownership and closes removal races",
  { skip: !approved, timeout: 120000 },
  async () => {
    assertSafeDb01TestTarget(process.env);
    const pg = await import("pg");
    const schema = "db069_owner_" + randomUUID().replaceAll("-", "").slice(0, 18);
    const qSchema = '"' + schema + '"';
    const client = new pg.default.Client({
      connectionString: process.env.TEST_DATABASE_URL,
      application_name: "db069-owner-witness",
    });
    let racer = null;
    let created = false;

    const fail23514 = async (promise, constraint) =>
      assert.rejects(promise, (error) => {
        assert.equal(error.code, "23514", String(error));
        if (constraint) assert.equal(error.constraint, constraint);
        return true;
      });

    try {
      await client.connect();
      await client.query("CREATE SCHEMA " + qSchema);
      created = true;
      await client.query("SET search_path TO " + qSchema + ", pg_catalog");
      await client.query(baseSql());
      await client.query(candidate);

      const collegeA = randomUUID();
      const collegeB = randomUUID();
      const actorUser = randomUUID();
      const coord1User = randomUUID();
      const coord2User = randomUUID();
      const ordinaryUser = randomUUID();
      const learnerUser = randomUUID();
      const actorMem = randomUUID();
      const coord1Mem = randomUUID();
      const coord2Mem = randomUUID();
      const ordinaryMem = randomUUID();
      const learnerMem = randomUUID();
      const crossMem = randomUUID();

      await client.query(
        "INSERT INTO colleges(id,status) VALUES ($1,'ACTIVE'),($2,'ACTIVE')",
        [collegeA,collegeB],
      );
      await client.query(
        "INSERT INTO users(id,platform_status) VALUES " +
        "($1,'ACTIVE'),($2,'ACTIVE'),($3,'ACTIVE'),($4,'ACTIVE'),($5,'ACTIVE')",
        [actorUser,coord1User,coord2User,ordinaryUser,learnerUser],
      );
      await client.query(
        "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES " +
        "($1,$2,$3,'ACTIVE'),($4,$5,$3,'ACTIVE'),($6,$7,$3,'ACTIVE')," +
        "($8,$9,$3,'ACTIVE'),($10,$11,$3,'ACTIVE'),($12,$5,$13,'ACTIVE')",
        [
          actorMem,actorUser,collegeA,
          coord1Mem,coord1User,
          coord2Mem,coord2User,
          ordinaryMem,ordinaryUser,
          learnerMem,learnerUser,
          crossMem,coord1User,collegeB,
        ],
      );
      await client.query(
        "INSERT INTO membership_roles(membership_id,role) VALUES " +
        "($1,'TPO'),($2,'FACULTY'),($3,'FACULTY'),($4,'FACULTY'),($5,'LEARNER'),($6,'FACULTY')",
        [actorMem,coord1Mem,coord2Mem,ordinaryMem,learnerMem,crossMem],
      );
      await client.query(
        "INSERT INTO placement_tpo_team_members(college_id,membership_id,role) VALUES " +
        "($1,$2,'FACULTY_COORDINATOR'),($1,$3,'FACULTY_COORDINATOR')",
        [collegeA,coord1Mem,coord2Mem],
      );

      // Delegated coordinator owner succeeds; creator remains separate.
      const liveJob = randomUUID();
      await client.query(
        "INSERT INTO placement_jobs(id,college_id,status,created_by_user_id,owner_membership_id) " +
        "VALUES ($1,$2,'DRAFT',$3,$4)",
        [liveJob,collegeA,actorUser,coord1Mem],
      );
      const firstJob = (
        await client.query(
          "SELECT created_by_user_id,owner_membership_id FROM placement_jobs WHERE id=$1",
          [liveJob],
        )
      ).rows[0];
      assert.equal(firstJob.created_by_user_id, actorUser);
      assert.equal(firstJob.owner_membership_id, coord1Mem);

      // Ordinary faculty / learner / cross-college membership cannot own drive.
      await fail23514(
        client.query(
          "INSERT INTO placement_jobs(id,college_id,status,created_by_user_id,owner_membership_id) VALUES ($1,$2,'DRAFT',$3,$4)",
          [randomUUID(),collegeA,actorUser,ordinaryMem],
        ),
        "db069_job_owner_scope",
      );
      await fail23514(
        client.query(
          "INSERT INTO placement_jobs(id,college_id,status,created_by_user_id,owner_membership_id) VALUES ($1,$2,'DRAFT',$3,$4)",
          [randomUUID(),collegeA,actorUser,learnerMem],
        ),
        "db069_job_owner_scope",
      );
      await fail23514(
        client.query(
          "INSERT INTO placement_jobs(id,college_id,status,created_by_user_id,owner_membership_id) VALUES ($1,$2,'DRAFT',$3,$4)",
          [randomUUID(),collegeA,actorUser,crossMem],
        ),
        "db069_job_owner_scope",
      );

      // vNext hardening: ordinary faculty outside the placement team cannot
      // be resurrected as a lead owner after team removal.
      await fail23514(
        client.query(
          "INSERT INTO placement_tpo_leads(id,college_id,owner_membership_id) VALUES ($1,$2,$3)",
          [randomUUID(),collegeA,ordinaryMem],
        ),
        "db069_lead_owner_scope",
      );

      // Direct removal is blocked by owned live drive.
      await fail23514(
        client.query(
          "DELETE FROM placement_tpo_team_members WHERE college_id=$1 AND membership_id=$2",
          [collegeA,coord1Mem],
        ),
        "db069_team_member_owned_drives",
      );

      // Add owned lead, then no-replacement atomic removal is blocked.
      const lead = randomUUID();
      await client.query(
        "INSERT INTO placement_tpo_leads(id,college_id,owner_membership_id) VALUES ($1,$2,$3)",
        [lead,collegeA,coord1Mem],
      );
      await fail23514(
        client.query(
          "SELECT * FROM db069_reassign_and_remove_tpo_team_member($1,$2,NULL,$3)",
          [collegeA,coord1Mem,actorUser],
        ),
        "db069_team_remove_requires_reassign",
      );

      // Atomic reassignment moves lead + job then removes team row while creator stays.
      const moved = (
        await client.query(
          "SELECT * FROM db069_reassign_and_remove_tpo_team_member($1,$2,$3,$4)",
          [collegeA,coord1Mem,coord2Mem,actorUser],
        )
      ).rows[0];
      assert.equal(moved.reassigned_leads, 1);
      assert.equal(moved.reassigned_jobs, 1);
      assert.equal(
        Number((await client.query(
          "SELECT count(*) FROM placement_tpo_team_members WHERE college_id=$1 AND membership_id=$2",
          [collegeA,coord1Mem],
        )).rows[0].count),
        0,
      );
      const movedJob = (
        await client.query(
          "SELECT created_by_user_id,owner_membership_id FROM placement_jobs WHERE id=$1",
          [liveJob],
        )
      ).rows[0];
      assert.equal(movedJob.created_by_user_id, actorUser);
      assert.equal(movedJob.owner_membership_id, coord2Mem);
      assert.equal(
        (await client.query(
          "SELECT owner_membership_id FROM placement_tpo_leads WHERE id=$1",
          [lead],
        )).rows[0].owner_membership_id,
        coord2Mem,
      );

      // Self removal is not allowed.
      await fail23514(
        client.query(
          "SELECT * FROM db069_reassign_and_remove_tpo_team_member($1,$2,NULL,$3)",
          [collegeA,coord2Mem,coord2User],
        ),
        "db069_team_self_remove",
      );

      // Closed-only historical ownership does not block no-replacement removal.
      const coord3User = randomUUID();
      const coord3Mem = randomUUID();
      await client.query(
        "INSERT INTO users(id,platform_status) VALUES ($1,'ACTIVE')",
        [coord3User],
      );
      await client.query(
        "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES ($1,$2,$3,'ACTIVE')",
        [coord3Mem,coord3User,collegeA],
      );
      await client.query(
        "INSERT INTO membership_roles(membership_id,role) VALUES ($1,'FACULTY')",
        [coord3Mem],
      );
      await client.query(
        "INSERT INTO placement_tpo_team_members(college_id,membership_id,role) VALUES ($1,$2,'FACULTY_COORDINATOR')",
        [collegeA,coord3Mem],
      );
      const closedJob = randomUUID();
      await client.query(
        "INSERT INTO placement_jobs(id,college_id,status,created_by_user_id,owner_membership_id) VALUES ($1,$2,'CLOSED',$3,$4)",
        [closedJob,collegeA,actorUser,coord3Mem],
      );
      await client.query(
        "DELETE FROM placement_tpo_team_members WHERE college_id=$1 AND membership_id=$2",
        [collegeA,coord3Mem],
      );
      await fail23514(
        client.query(
          "UPDATE placement_jobs SET status='PUBLISHED' WHERE id=$1",
          [closedJob],
        ),
        "db069_job_owner_scope",
      );

      // Race 1: delete obtains owner lock first. Concurrent new drive assignment
      // waits, then fails because coordinator scope disappeared.
      const coord4User = randomUUID();
      const coord4Mem = randomUUID();
      await client.query("INSERT INTO users(id,platform_status) VALUES ($1,'ACTIVE')",[coord4User]);
      await client.query(
        "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES ($1,$2,$3,'ACTIVE')",
        [coord4Mem,coord4User,collegeA],
      );
      await client.query("INSERT INTO membership_roles(membership_id,role) VALUES ($1,'FACULTY')",[coord4Mem]);
      await client.query(
        "INSERT INTO placement_tpo_team_members(college_id,membership_id,role) VALUES ($1,$2,'FACULTY_COORDINATOR')",
        [collegeA,coord4Mem],
      );

      racer = new pg.default.Client({
        connectionString: process.env.TEST_DATABASE_URL,
        application_name: "db069-owner-racer",
      });
      await racer.connect();
      await racer.query("SET search_path TO " + qSchema + ", pg_catalog");
      await racer.query("SET statement_timeout='10000ms'");

      await client.query("BEGIN");
      try {
        await client.query(
          "DELETE FROM placement_tpo_team_members WHERE college_id=$1 AND membership_id=$2",
          [collegeA,coord4Mem],
        );
        const pendingDrive = racer.query(
          "INSERT INTO placement_jobs(id,college_id,status,created_by_user_id,owner_membership_id) VALUES ($1,$2,'DRAFT',$3,$4)",
          [randomUUID(),collegeA,actorUser,coord4Mem],
        );
        await client.query("COMMIT");
        await fail23514(pendingDrive,"db069_job_owner_scope");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      }

      // Race 2: delete obtains owner lock first for lead ownership.
      // The pending lead insert must wake after deletion and fail owner scope.
      const coord5User = randomUUID();
      const coord5Mem = randomUUID();
      await client.query("INSERT INTO users(id,platform_status) VALUES ($1,'ACTIVE')",[coord5User]);
      await client.query(
        "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES ($1,$2,$3,'ACTIVE')",
        [coord5Mem,coord5User,collegeA],
      );
      await client.query("INSERT INTO membership_roles(membership_id,role) VALUES ($1,'FACULTY')",[coord5Mem]);
      await client.query(
        "INSERT INTO placement_tpo_team_members(college_id,membership_id,role) VALUES ($1,$2,'FACULTY_COORDINATOR')",
        [collegeA,coord5Mem],
      );

      await client.query("BEGIN");
      try {
        await client.query(
          "DELETE FROM placement_tpo_team_members WHERE college_id=$1 AND membership_id=$2",
          [collegeA,coord5Mem],
        );
        const pendingLead = racer.query(
          "INSERT INTO placement_tpo_leads(id,college_id,owner_membership_id) VALUES ($1,$2,$3)",
          [randomUUID(),collegeA,coord5Mem],
        );
        await client.query("COMMIT");
        await fail23514(pendingLead,"db069_lead_owner_scope");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      }

      // Race 3: lead ownership obtains lock first. Team deletion waits and then
      // rejects because the committed lead is visible after the lock releases.
      const coord6User = randomUUID();
      const coord6Mem = randomUUID();
      await client.query("INSERT INTO users(id,platform_status) VALUES ($1,'ACTIVE')",[coord6User]);
      await client.query(
        "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES ($1,$2,$3,'ACTIVE')",
        [coord6Mem,coord6User,collegeA],
      );
      await client.query("INSERT INTO membership_roles(membership_id,role) VALUES ($1,'FACULTY')",[coord6Mem]);
      await client.query(
        "INSERT INTO placement_tpo_team_members(college_id,membership_id,role) VALUES ($1,$2,'FACULTY_COORDINATOR')",
        [collegeA,coord6Mem],
      );

      await client.query("BEGIN");
      try {
        await client.query(
          "INSERT INTO placement_tpo_leads(id,college_id,owner_membership_id) VALUES ($1,$2,$3)",
          [randomUUID(),collegeA,coord6Mem],
        );
        const pendingDelete = racer.query(
          "DELETE FROM placement_tpo_team_members WHERE college_id=$1 AND membership_id=$2",
          [collegeA,coord6Mem],
        );
        await client.query("COMMIT");
        await fail23514(pendingDelete,"db069_team_member_owned_leads");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      }
    } finally {
      if (racer) await racer.end().catch(() => {});
      if (created) {
        try {
          await client.query("SET search_path TO pg_catalog");
          await client.query("DROP SCHEMA " + qSchema + " CASCADE");
        } catch (error) {
          throw new Error("DB-069 disposable witness cleanup failed", { cause: error });
        }
      }
      await client.end().catch(() => {});
    }
  },
);
