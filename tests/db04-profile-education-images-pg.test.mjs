// DB-007 / Chat 3 — executable PostgreSQL witness for the UNREGISTERED
// DB04 receipt + education + profile-image staging block.
//
// Run ONLY against an independently disposable PostgreSQL database:
// DB04_PROFILE_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA \
// TEST_DATABASE_URL=postgres://... \
//   node --test tests/db04-profile-education-images-pg.test.mjs
//
// This is staging evidence, not registered-migration replay or runtime/API proof.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(
  resolve(root, "docs/planning/db04-proposed-migration.sql"),
  "utf8",
);
const start = source.indexOf("CREATE TABLE profile_private_document_receipts");
const end = source.indexOf("CREATE TABLE profile_verification_settings");
assert.ok(start >= 0 && end > start, "DB04 receipt/education/image SQL block not found");
const ddl = source.slice(start, end);

const optIn =
  process.env.DB04_PROFILE_DISPOSABLE === "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  (!process.env.DATABASE_URL ||
    process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL);

if (!optIn) {
  test.skip(
    "DB04 profile witnesses require explicitly disposable TEST_DATABASE_URL distinct from DATABASE_URL",
    () => {},
  );
} else {
  // Separate URLs and a magic opt-in alone cannot make an arbitrary DB safe.
  // Validate the target *before opening a connection or creating a schema*.
  assertSafeDb01TestTarget({
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DB01_REMOTE_TEST_DATABASE_CONFIRM: process.env.DB01_REMOTE_TEST_DATABASE_CONFIRM,
  });
  test(
    "DB04 private receipts, education and profile images fail closed at the DB boundary",
    { timeout: 60000 },
    async () => {
      const { default: pg } = await import("pg");
      const config = {
        connectionString: process.env.TEST_DATABASE_URL,
        application_name: "db04-profile-disposable",
      };
      const db = new pg.Client(config);
      const schema =
        "db04_profile_" + randomUUID().replaceAll("-", "").slice(0, 20);
      const quoted = '"' + schema + '"';
      let created = false;

      const membershipA = randomUUID();
      const membershipB = randomUUID();
      const uploader = randomUUID();

      const expectConstraint = async (promise, code, constraint) => {
        await assert.rejects(promise, (error) => {
          assert.equal(error.code, code, String(error));
          if (constraint) assert.equal(error.constraint, constraint, String(error));
          return true;
        });
      };

      const insertReceipt = async ({
        owner = membershipA,
        purpose = "MARKSHEET",
        key = "private/profile/evidence.bin",
        generation = "1",
        sha = "a".repeat(64),
      } = {}) => {
        const id = randomUUID();
        await db.query(
          `INSERT INTO profile_private_document_receipts
            (id, owning_membership_id, purpose, private_object_key,
             object_generation, sha256_hex, mime_type, size_bytes,
             scan_status, uploaded_by_user_id)
           VALUES ($1,$2,$3,$4,$5,$6,'application/octet-stream',128,'CLEAN',$7)`,
          [id, owner, purpose, key, generation, sha, uploader],
        );
        return id;
      };

      const insertEducation = async ({
        owner = membershipA,
        recent = false,
        pursuing = false,
        startYear = 2022,
        endYear = 2026,
        grading = "GPA",
        archivedAt = null,
      } = {}) => {
        const id = randomUUID();
        await db.query(
          `INSERT INTO learner_profile_education_entries
            (id, learner_membership_id, education_type, program,
             institution_name, start_year, end_year, is_currently_pursuing,
             grading_type, grade_obtained, max_grade, is_recent_education,
             exam_details, archived_at)
           VALUES ($1,$2,'UNDERGRADUATE','B.Tech','Example University',
             $3,$4,$5,$6,'8.5','10',$7,'{}'::jsonb,$8)`,
          [id, owner, startYear, pursuing ? null : endYear, pursuing, grading, recent, archivedAt],
        );
        return id;
      };

      try {
        await db.connect();
        await db.query("CREATE SCHEMA " + quoted);
        created = true;
        await db.query("SET search_path TO " + quoted + ", pg_catalog");

        await db.query("CREATE TABLE users (id uuid PRIMARY KEY)");
        await db.query("CREATE TABLE college_memberships (id uuid PRIMARY KEY)");
        await db.query("INSERT INTO users VALUES ($1)", [uploader]);
        await db.query("INSERT INTO college_memberships VALUES ($1),($2)", [
          membershipA,
          membershipB,
        ]);
        await db.query(ddl);

        // Private-object metadata is fail-closed.
        await expectConstraint(
          insertReceipt({ key: "https://public.example/evidence" }),
          "23514",
          "profile_private_doc_key_ck",
        );
        await expectConstraint(
          insertReceipt({ generation: "generation-one" }),
          "23514",
          "profile_private_doc_generation_ck",
        );
        await expectConstraint(
          insertReceipt({ sha: "not-a-digest" }),
          "23514",
          "profile_private_doc_sha256_ck",
        );

        // Source parity: GPA must be accepted, not silently rejected in favor
        // of CGPA-only normalization.
        const education = await insertEducation({ grading: "GPA" });
        assert.ok(education);

        await expectConstraint(
          db.query(
            `INSERT INTO learner_profile_education_entries
              (learner_membership_id, education_type, institution_name,
               start_year, end_year, is_currently_pursuing, grading_type,
               grade_obtained, max_grade, exam_details)
             VALUES ($1,'UNDERGRADUATE','Example University',
               2022,2026,true,'CGPA','8','10','{}'::jsonb)`,
            [membershipA],
          ),
          "23514",
          "learner_profile_education_pursuing_ck",
        );

        await expectConstraint(
          db.query(
            `INSERT INTO learner_profile_education_entries
              (learner_membership_id, education_type, institution_name,
               start_year, end_year, grading_type, grade_obtained, max_grade,
               exam_details)
             VALUES ($1,'UNDERGRADUATE','Example University',
               2026,2022,'CGPA','8','10','{}'::jsonb)`,
            [membershipA],
          ),
          "23514",
          "learner_profile_education_year_order_ck",
        );

        const recent = await insertEducation({ recent: true });
        assert.ok(recent);
        await expectConstraint(
          insertEducation({ recent: true, grading: "CGPA" }),
          "23505",
          "learner_profile_education_recent_uq",
        );
        // Historical/archived rows do not occupy the active recent slot.
        await insertEducation({
          recent: true,
          grading: "CGPA",
          archivedAt: new Date().toISOString(),
        });

        const marksheetA = await insertReceipt({ purpose: "MARKSHEET" });
        const marksheetB = await insertReceipt({
          owner: membershipB,
          purpose: "MARKSHEET",
          key: "private/profile/foreign-marksheet.bin",
          generation: "2",
        });
        await db.query(
          `INSERT INTO learner_profile_education_documents
            (education_entry_id, learner_membership_id, receipt_id, purpose)
           VALUES ($1,$2,$3,'MARKSHEET')`,
          [education, membershipA, marksheetA],
        );
        await expectConstraint(
          db.query(
            `INSERT INTO learner_profile_education_documents
              (education_entry_id, learner_membership_id, receipt_id, purpose)
             VALUES ($1,$2,$3,'MARKSHEET')`,
            [education, membershipA, marksheetB],
          ),
          "23503",
          "learner_profile_education_documents_receipt_fk",
        );

        const imageReceipt = await insertReceipt({
          purpose: "PROFILE_IMAGE",
          key: "private/profile/avatar.bin",
          generation: "3",
        });
        await db.query(
          `INSERT INTO learner_profile_images
            (learner_membership_id, receipt_id)
           VALUES ($1,$2)`,
          [membershipA, imageReceipt],
        );
        await expectConstraint(
          db.query(
            `INSERT INTO learner_profile_images
              (learner_membership_id, receipt_id)
             VALUES ($1,$2)`,
            [membershipB, imageReceipt],
          ),
          "23503",
          "learner_profile_images_receipt_fk",
        );
        await expectConstraint(
          db.query(
            `INSERT INTO learner_profile_images
              (learner_membership_id, receipt_id, receipt_purpose)
             VALUES ($1,$2,'MARKSHEET')`,
            [membershipA, marksheetA],
          ),
          "23514",
          "learner_profile_images_receipt_purpose_ck",
        );
        await expectConstraint(
          db.query(
            `INSERT INTO learner_profile_images
              (learner_membership_id, receipt_id, is_active)
             VALUES ($1,$2,false)`,
            [membershipA, imageReceipt],
          ),
          "23514",
          "learner_profile_images_active_ck",
        );
      } finally {
        if (created) {
          try {
            await db.query("SET search_path TO pg_catalog");
            await db.query("DROP SCHEMA " + quoted + " CASCADE");
          } catch (error) {
            throw new Error("DB04 disposable profile fixture cleanup failed", {
              cause: error,
            });
          }
        }
        await db.end().catch(() => {});
      }
    },
  );
}
