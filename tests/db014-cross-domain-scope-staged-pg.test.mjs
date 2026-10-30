// DB-014 cross-domain tenant/scope staged witness. NEVER a migration acceptance.
// Apply candidate SQL only inside a rollback transaction on an explicitly
// disposable, already migrated PostgreSQL 17 test database. Full DB-014 closure
// still needs registered migration, global FK/cascade review and phase gating.
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";

if (process.env.DB014_STAGED_PG !== "YES") {
  throw new Error("DB014 staged PostgreSQL scope witnesses require DB014_STAGED_PG=YES");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });

const SEED = Object.freeze({
  organization: "10000000-0000-4000-8000-000000000001",
  collegeA: "20000000-0000-4000-8000-000000000001",
  collegeB: "20000000-0000-4000-8000-000000000002",
  collegeAdminUser: "30000000-0000-4000-8000-000000000002",
  facultyUser: "30000000-0000-4000-8000-000000000003",
  facultyCollegeBMembership: "40000000-0000-4000-8000-000000000003",
  learnerCollegeAMembership: "40000000-0000-4000-8000-000000000004",
});
const proposal = readFileSync(
  "docs/planning/sql/db14-cross-domain-event-scope-candidate.sql", "utf8",
);

async function denied(db, query, args, expectedCode = "23514") {
  await db.query("SAVEPOINT db014_denied");
  try {
    await assert.rejects(db.query(query, args), error => {
      assert.equal(error?.code, expectedCode, String(error));
      return true;
    });
  } finally {
    await db.query("ROLLBACK TO SAVEPOINT db014_denied");
    await db.query("RELEASE SAVEPOINT db014_denied");
  }
}

async function writeEvent(db, overrides = {}) {
  const v = {
    organization: SEED.organization,
    college: SEED.collegeA,
    actorUser: SEED.collegeAdminUser,
    actorMembership: null,
    ...overrides,
  };
  return db.query(
    "INSERT INTO activity_events " +
    "(organization_id,college_id,actor_user_id,actor_membership_id,module,event_type,subject_type,subject_id,summary) " +
    "VALUES($1,$2,$3,$4,'IDENTITY','DB014_SCOPE_TEST','MEMBERSHIP',$5,'Scoped disposable DB014 event') RETURNING id",
    [v.organization, v.college, v.actorUser, v.actorMembership, randomUUID()],
  );
}

test("DB014 registered replay plus staged event/notification/group tenant boundaries", async t => {
  const db = new pg.Client({
    connectionString: process.env.TEST_DATABASE_URL,
    connectionTimeoutMillis: 10000,
    query_timeout: 15000,
  });
  await db.connect();
  let transactionOpen = false;
  try {
    const version = Number((await db.query("SHOW server_version_num")).rows[0].server_version_num);
    assert.ok(version >= 170000 && version < 180000, "Require PostgreSQL 17");
    const catalog = await db.query(
      "SELECT to_regclass('public.activity_events') AS activity, " +
      "to_regclass('public.in_app_notifications') AS inbox, " +
      "to_regclass('public.lms_group_member_events') AS history",
    );
    assert.ok(catalog.rows[0].activity && catalog.rows[0].inbox && catalog.rows[0].history,
      "Registered journal replay must have created the three parent/child families");

    await db.query("BEGIN");
    transactionOpen = true;
    // The candidate is NOT in the canonical journal; transaction rollback
    // guarantees this witness never promotes its DDL into persistent state.
    await db.query(proposal);
    const triggerRows = await db.query(
      "SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND " +
      "tgname = ANY($1::text[]) ORDER BY tgname",
      [[
        "db14_activity_event_scope_guard",
        "db14_notification_recipient_scope_guard",
        "db14_group_member_event_scope_guard",
      ]],
    );
    assert.deepEqual(triggerRows.rows.map(row => row.tgname), [
      "db14_activity_event_scope_guard",
      "db14_group_member_event_scope_guard",
      "db14_notification_recipient_scope_guard",
    ]);

    await t.test("activity event rejects actor membership in another college", async () => {
      const good = await writeEvent(db);
      assert.equal(good.rowCount, 1);
      await denied(db,
        "INSERT INTO activity_events " +
        "(organization_id,college_id,actor_user_id,actor_membership_id,module,event_type,subject_type,subject_id,summary) " +
        "VALUES ($1,$2,$3,$4,'IDENTITY','DB014_SCOPE_TEST','MEMBERSHIP','foreign','forged actor')",
        [SEED.organization, SEED.collegeA, SEED.facultyUser, SEED.facultyCollegeBMembership],
      );
    });

    await t.test("college inbox accepts same-college user and rejects unrelated college-only user", async () => {
      const event = (await writeEvent(db)).rows[0].id;
      const ok = await db.query(
        "INSERT INTO in_app_notifications(user_id,event_id,title,body) " +
        "VALUES ($1,$2,'DB014','same-college delivery') RETURNING id",
        [SEED.collegeAdminUser, event],
      );
      assert.equal(ok.rowCount, 1);
      const userId = randomUUID(), membershipId = randomUUID();
      await db.query(
        "INSERT INTO users(id,identity_uid,display_name) VALUES ($1,$2,'DB014 other-college')",
        [userId, "db014-" + userId],
      );
      await db.query(
        "INSERT INTO college_memberships(id,user_id,college_id) VALUES ($1,$2,$3)",
        [membershipId, userId, SEED.collegeB],
      );
      await denied(db,
        "INSERT INTO in_app_notifications(user_id,event_id,title,body) " +
        "VALUES ($1,$2,'DB014','foreign college disclosure')",
        [userId,event],
      );
    });

    await t.test("group history rejects cross-college membership and invalid role", async () => {
      const group = randomUUID();
      await db.query(
        "INSERT INTO lms_groups(id,kind,owner_scope,college_id,name,created_by_user_id) " +
        "VALUES ($1,'STUDY','COLLEGE',$2,'DB014 disposable scope',$3)",
        [group, SEED.collegeA, SEED.collegeAdminUser],
      );
      const sql = "INSERT INTO lms_group_member_events " +
        "(group_id,membership_id,to_state,member_type,source,actor_type,actor_user_id) " +
        "VALUES ($1,$2,'ACTIVE',$3,'MANUAL',$4,$5)";
      const good = await db.query(sql, [
        group, SEED.learnerCollegeAMembership, "LEARNER", "COLLEGE_ADMIN", SEED.collegeAdminUser,
      ]);
      assert.equal(good.rowCount, 1);
      await denied(db, sql, [
        group, SEED.facultyCollegeBMembership, "FACULTY", "COLLEGE_ADMIN", SEED.collegeAdminUser,
      ]);
      await denied(db, sql, [
        group, SEED.learnerCollegeAMembership, "FACULTY", "COLLEGE_ADMIN", SEED.collegeAdminUser,
      ]);
      await denied(db, sql, [
        group, SEED.learnerCollegeAMembership, "LEARNER", "SYSTEM", SEED.collegeAdminUser,
      ]);
    });

    // Roll back all inserted rows AND CREATE TRIGGER/FUNCTION DDL.
    await db.query("ROLLBACK");
    transactionOpen = false;
    const after = await db.query(
      "SELECT count(*)::int AS n FROM pg_trigger WHERE NOT tgisinternal AND " +
      "tgname LIKE 'db14_%_scope_guard'",
    );
    assert.equal(after.rows[0].n, 0,
      "Staged DB14 DDL must never survive verification transaction rollback");
  } finally {
    if (transactionOpen) await db.query("ROLLBACK").catch(() => {});
    await db.end();
  }
});
