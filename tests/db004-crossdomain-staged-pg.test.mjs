// Executable PostgreSQL witnesses for Chat3 DB004 cross-domain staging.
// These tests are opt-in and operate only inside disposable schemas.
// They are source/staging acceptance, NOT registered-migration or runtime/API proof.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

const profileSql = readFileSync(
  "docs/planning/sql/db04-learner-profile-extras-candidate.sql",
  "utf8",
);
const grantSql = readFileSync(
  "docs/planning/sql/db09-recruiter-grant-lifecycle-candidate.sql",
  "utf8",
);

function approved(flag) {
  return (
    process.env[flag] === "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA" &&
    Boolean(process.env.TEST_DATABASE_URL) &&
    (!process.env.DATABASE_URL ||
      process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL)
  );
}

async function withSchema(prefix, fn) {
  assertSafeDb01TestTarget(process.env);
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: process.env.TEST_DATABASE_URL,
    application_name: prefix,
  });
  const schema =
    prefix + "_" + randomUUID().replaceAll("-", "").slice(0, 18);
  const quoted = '"' + schema + '"';
  let created = false;
  try {
    await client.connect();
    await client.query("CREATE SCHEMA " + quoted);
    created = true;
    await client.query("SET search_path TO " + quoted + ", pg_catalog");
    await fn(client);
  } finally {
    if (created) {
      await client.query("SET search_path TO pg_catalog").catch(() => {});
      await client.query("DROP SCHEMA " + quoted + " CASCADE").catch(() => {});
    }
    await client.end().catch(() => {});
  }
}

async function expectPg(promise, code, constraint) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, code, String(error));
    if (constraint) {
      assert.equal(error.constraint, constraint, String(error));
    }
    return true;
  });
}

test(
  "DB004 learner identity/resume/video staging fails closed at PostgreSQL boundary",
  {
    skip: !approved("DB004_PROFILE_EXTRAS_DISPOSABLE"),
    timeout: 90000,
  },
  async () =>
    withSchema("db004_profile", async (db) => {
      const college = randomUUID();
      const learnerA = randomUUID();
      const learnerB = randomUUID();
      const uploader = randomUUID();

      await db.query("CREATE TABLE users (id uuid PRIMARY KEY)");
      await db.query(
        "CREATE TABLE college_memberships (" +
          "id uuid PRIMARY KEY, college_id uuid NOT NULL, " +
          "CONSTRAINT college_memberships_id_college_uq UNIQUE(id,college_id))",
      );
      await db.query(`
        CREATE TABLE profile_private_document_receipts (
          id uuid PRIMARY KEY,
          owning_membership_id uuid NOT NULL REFERENCES college_memberships(id),
          purpose varchar(32) NOT NULL,
          scan_status varchar(24) NOT NULL DEFAULT 'PENDING',
          revoked_at timestamptz,
          retention_until timestamptz,
          uploaded_by_user_id uuid REFERENCES users(id),
          CONSTRAINT profile_private_doc_purpose_ck
            CHECK (purpose IN (
              'AADHAAR','PAN','MARKSHEET','RESUME','PROFILE_IMAGE',
              'EDUCATION_CERTIFICATE','CERTIFICATION',
              'EXPERIENCE_CERTIFICATE','OFFER_LETTER'
            )),
          CONSTRAINT profile_private_doc_id_owner_purpose_uq
            UNIQUE(id,owning_membership_id,purpose)
        )
      `);
      await db.query("INSERT INTO users(id) VALUES ($1)", [uploader]);
      await db.query(
        "INSERT INTO college_memberships(id,college_id) VALUES ($1,$3),($2,$3)",
        [learnerA, learnerB, college],
      );
      await db.query(profileSql);

      await db.query(
        "INSERT INTO learner_profile_identity_summaries " +
          "(learner_membership_id,aadhaar_last4,pan_last4) VALUES ($1,'1234','AB12')",
        [learnerA],
      );
      await expectPg(
        db.query(
          "UPDATE learner_profile_identity_summaries SET aadhaar_last4='12X4' " +
            "WHERE learner_membership_id=$1",
          [learnerA],
        ),
        "23514",
        "learner_profile_identity_aadhaar_last4_ck",
      );

      const pendingResume = randomUUID();
      await db.query(
        "INSERT INTO profile_private_document_receipts " +
          "(id,owning_membership_id,purpose,scan_status,uploaded_by_user_id) " +
          "VALUES ($1,$2,'RESUME','PENDING',$3)",
        [pendingResume, learnerA, uploader],
      );
      await expectPg(
        db.query(
          "INSERT INTO learner_profile_private_document_bindings " +
            "(learner_membership_id,purpose,receipt_id) VALUES ($1,'RESUME',$2)",
          [learnerA, pendingResume],
        ),
        "23514",
        null,
      );

      const cleanResume = randomUUID();
      await db.query(
        "INSERT INTO profile_private_document_receipts " +
          "(id,owning_membership_id,purpose,scan_status,uploaded_by_user_id) " +
          "VALUES ($1,$2,'RESUME','CLEAN',$3)",
        [cleanResume, learnerA, uploader],
      );
      await db.query(
        "INSERT INTO learner_profile_private_document_bindings " +
          "(learner_membership_id,purpose,receipt_id) VALUES ($1,'RESUME',$2)",
        [learnerA, cleanResume],
      );
      await expectPg(
        db.query(
          "INSERT INTO learner_profile_private_document_bindings " +
            "(learner_membership_id,purpose,receipt_id) VALUES ($1,'RESUME',$2)",
          [learnerB, cleanResume],
        ),
        "23503",
        "learner_profile_private_binding_receipt_fk",
      );

      const pendingVideo = randomUUID();
      await db.query(
        "INSERT INTO profile_private_document_receipts " +
          "(id,owning_membership_id,purpose,scan_status,uploaded_by_user_id) " +
          "VALUES ($1,$2,'VIDEO_INTRO','PENDING',$3)",
        [pendingVideo, learnerA, uploader],
      );
      await expectPg(
        db.query(
          "INSERT INTO learner_profile_video_intros " +
            "(learner_membership_id,receipt_id) VALUES ($1,$2)",
          [learnerA, pendingVideo],
        ),
        "23514",
        null,
      );

      const cleanVideo = randomUUID();
      await db.query(
        "INSERT INTO profile_private_document_receipts " +
          "(id,owning_membership_id,purpose,scan_status,uploaded_by_user_id) " +
          "VALUES ($1,$2,'VIDEO_INTRO','CLEAN',$3)",
        [cleanVideo, learnerA, uploader],
      );
      await db.query(
        "INSERT INTO learner_profile_video_intros " +
          "(learner_membership_id,receipt_id) VALUES ($1,$2)",
        [learnerA, cleanVideo],
      );
      await expectPg(
        db.query(
          "UPDATE learner_profile_video_intros SET uploaded_at=now() " +
            "WHERE learner_membership_id=$1",
          [learnerA],
        ),
        "55000",
        null,
      );
      await expectPg(
        db.query(
          "DELETE FROM learner_profile_video_intros WHERE learner_membership_id=$1",
          [learnerA],
        ),
        "55000",
        null,
      );
    }),
);

test(
  "DB004 recruiter grant lifecycle staging enforces live-state vocabulary and history",
  {
    skip: !approved("DB004_RECRUITER_GRANT_DISPOSABLE"),
    timeout: 90000,
  },
  async () =>
    withSchema("db004_grant", async (db) => {
      const recruiter = randomUUID();
      const relationship = randomUUID();
      const grantor = randomUUID();
      const company = randomUUID();

      await db.query("CREATE TABLE users (id uuid PRIMARY KEY)");
      await db.query("CREATE TABLE placement_companies (id uuid PRIMARY KEY)");
      await db.query("CREATE TABLE placement_tpo_leads (id uuid PRIMARY KEY)");
      await db.query(`
        CREATE TABLE placement_recruiter_college_grants (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          recruiter_user_id uuid NOT NULL,
          company_relationship_id uuid NOT NULL,
          status varchar(24) NOT NULL DEFAULT 'ACTIVE',
          granted_by_user_id uuid NOT NULL REFERENCES users(id),
          revoked_by_user_id uuid REFERENCES users(id),
          revoked_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await db.query("INSERT INTO users(id) VALUES ($1),($2)", [
        recruiter,
        grantor,
      ]);
      await db.query("INSERT INTO placement_companies(id) VALUES ($1)", [
        company,
      ]);
      await db.query(grantSql);

      const first = randomUUID();
      await db.query(
        "INSERT INTO placement_recruiter_college_grants " +
          "(id,recruiter_user_id,company_relationship_id,status,granted_by_user_id,verification) " +
          "VALUES ($1,$2,$3,'PENDING_RECRUITER',$4,'PENDING')",
        [first, recruiter, relationship, grantor],
      );

      await expectPg(
        db.query(
          "INSERT INTO placement_recruiter_college_grants " +
            "(recruiter_user_id,company_relationship_id,status,granted_by_user_id) " +
            "VALUES ($1,$2,'ACTIVE',$3)",
          [recruiter, relationship, grantor],
        ),
        "23505",
        "placement_recruiter_college_grants_live_uq",
      );

      await expectPg(
        db.query(
          "UPDATE placement_recruiter_college_grants SET verification='MAGIC' WHERE id=$1",
          [first],
        ),
        "23514",
        "placement_recruiter_college_grants_verification_ck",
      );
      await expectPg(
        db.query(
          "UPDATE placement_recruiter_college_grants " +
            "SET valid_until = granted_at - interval '1 second' WHERE id=$1",
          [first],
        ),
        "23514",
        "placement_recruiter_college_grants_valid_until_ck",
      );

      await db.query(
        "INSERT INTO placement_recruiter_grant_capabilities(grant_id,capability) " +
          "VALUES ($1,'DRIVE_REQUEST')",
        [first],
      );
      await expectPg(
        db.query(
          "INSERT INTO placement_recruiter_grant_capabilities(grant_id,capability) " +
            "VALUES ($1,'ROOT_ADMIN')",
          [first],
        ),
        "23514",
        "placement_recruiter_grant_capability_ck",
      );

      const lead = randomUUID();
      await db.query("INSERT INTO placement_tpo_leads(id) VALUES ($1)", [lead]);
      await expectPg(
        db.query(
          "INSERT INTO placement_recruiter_grant_invitation_links " +
            "(grant_id,lead_id,accepted_at,declined_at) VALUES ($1,$2,now(),now())",
          [first, lead],
        ),
        "23514",
        "placement_recruiter_grant_invite_terminal_ck",
      );

      await db.query(
        "INSERT INTO placement_recruiter_grant_events " +
          "(grant_id,prior_status,next_status,prior_version,next_version," +
          "actor_user_id,event_type) " +
          "VALUES ($1,'PENDING_RECRUITER','ACTIVE',0,1,$2,'ACCEPTED')",
        [first, recruiter],
      );
      await expectPg(
        db.query(
          "INSERT INTO placement_recruiter_grant_events " +
            "(grant_id,prior_status,next_status,prior_version,next_version," +
            "actor_user_id,event_type) " +
            "VALUES ($1,'ACTIVE','REVOKED',1,3,$2,'REVOKED')",
          [first, grantor],
        ),
        "23514",
        "placement_recruiter_grant_event_version_ck",
      );
    }),
);
