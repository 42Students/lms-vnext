// DB-012 / Chat 3: recruiter company isolation regression.
// Source assertions run with: node --test tests/db09-grant-company-isolation.test.mjs
// PostgreSQL witness is opt-in and destructive only within a disposable schema:
// DB09_GRANT_COMPANY_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA \
// TEST_DATABASE_URL=postgres://... \
//   node --test tests/db09-grant-company-isolation.test.mjs
// This file's presence is NOT proof that PostgreSQL has run.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const service = readFileSync(
  resolve("src/modules/placements/tpo-messaging-service.ts"), "utf8");
const grantService = readFileSync(
  resolve("src/modules/placements/recruiter-service.ts"), "utf8");
const candidate = readFileSync(
  resolve("docs/planning/sql/db09-recruiter-grant-company-integrity-candidate.sql"),
  "utf8");

test("recruiter messaging requires matching company identity, not just active grant", () => {
  const start = service.indexOf("async function loadActiveRecruiterGrant(");
  const end = service.indexOf("async function readActor(", start);
  assert.ok(start >= 0 && end > start, "cannot inspect recruiter grant lookup");
  const lookup = service.slice(start, end);
  assert.match(
    lookup,
    /eq\(\s*placementCompanyRelationships\.companyId,\s*placementRecruiterProfiles\.companyId,\s*\)/,
    "fail closed: recruiter company and granted relationship company must match",
  );
  assert.match(lookup, /eq\(placementRecruiterProfiles\.status, "ACTIVE"\)/);
  assert.match(lookup, /eq\(placementRecruiterCollegeGrants\.status, "ACTIVE"\)/);
  assert.match(lookup, /eq\(placementCompanyRelationships\.status, "ACTIVE"\)/);
  assert.match(lookup, /eq\(users\.platformStatus, "ACTIVE"\)/);
  assert.match(
    grantService,
    /eq\(\s*placementCompanyRelationships\.companyId,\s*placementRecruiterProfiles\.companyId,\s*\)/,
    "recruiter grant listing must retain independent same-company check",
  );
});

test("staged database guard checks both FK parents and blocks company reassignment", () => {
  assert.match(candidate, /CREATE TRIGGER db09_recruiter_grant_company_guard/);
  assert.match(candidate, /v_profile_company <> v_relationship_company/);
  assert.match(candidate, /FROM placement_recruiter_profiles p[\s\S]*FOR SHARE/);
  assert.match(candidate, /FROM placement_company_relationships r[\s\S]*FOR SHARE/);
  assert.match(candidate, /CREATE TRIGGER db09_recruiter_profile_company_guard/);
  assert.match(candidate, /CREATE TRIGGER db09_granted_relationship_company_guard/);
  assert.match(candidate, /db09_grant_company_consistent/);
});

const approved =
  process.env.DB09_GRANT_COMPANY_DISPOSABLE === "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  (!process.env.DATABASE_URL ||
    process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL);

test("grant/relationship/profile company mismatch and reassignment fail at PostgreSQL boundary",
  { skip: !approved, timeout: 90000 }, async () => {
    const pg = await import("pg");
    const schema = "db09_company_" + randomUUID().replaceAll("-", "").slice(0, 20);
    const qSchema = '"' + schema + '"';
    const client = new pg.default.Client({
      connectionString: process.env.TEST_DATABASE_URL,
      application_name: "db09-grant-company-witness",
    });
    const companyA = randomUUID();
    const companyB = randomUUID();
    const recruiterA = randomUUID();
    const recruiterB = randomUUID();
    const relationshipA = randomUUID();
    const relationshipB = randomUUID();
    const grantA = randomUUID();
    let created = false;
    const failCheck = async (promise, expected) => assert.rejects(promise, (error) => {
      assert.equal(error.code, "23514", String(error));
      if (expected) assert.equal(error.constraint, expected);
      return true;
    });
    try {
      await client.connect();
      await client.query("CREATE SCHEMA " + qSchema);
      created = true;
      await client.query("SET search_path TO " + qSchema + ", pg_catalog");
      await client.query(`
        CREATE TABLE placement_recruiter_profiles (
          user_id uuid PRIMARY KEY, company_id uuid NOT NULL
        );
        CREATE TABLE placement_company_relationships (
          id uuid PRIMARY KEY, company_id uuid NOT NULL
        );
        CREATE TABLE placement_recruiter_college_grants (
          id uuid PRIMARY KEY,
          recruiter_user_id uuid NOT NULL
            REFERENCES placement_recruiter_profiles(user_id),
          company_relationship_id uuid NOT NULL
            REFERENCES placement_company_relationships(id),
          status varchar(24) NOT NULL DEFAULT 'ACTIVE'
        );
      `);
      await client.query(candidate);
      await client.query(
        "INSERT INTO placement_recruiter_profiles(user_id,company_id) VALUES ($1,$2),($3,$4)",
        [recruiterA,companyA,recruiterB,companyB],
      );
      await client.query(
        "INSERT INTO placement_company_relationships(id,company_id) VALUES ($1,$2),($3,$4)",
        [relationshipA,companyA,relationshipB,companyB],
      );
      await client.query(
        "INSERT INTO placement_recruiter_college_grants(id,recruiter_user_id,company_relationship_id) VALUES ($1,$2,$3)",
        [grantA,recruiterA,relationshipA],
      );
      await failCheck(
        client.query(
          "INSERT INTO placement_recruiter_college_grants(id,recruiter_user_id,company_relationship_id) VALUES ($1,$2,$3)",
          [randomUUID(),recruiterA,relationshipB],
        ),
        "db09_grant_company_consistent",
      );
      await failCheck(
        client.query(
          "UPDATE placement_recruiter_college_grants SET company_relationship_id=$1 WHERE id=$2",
          [relationshipB,grantA],
        ),
        "db09_grant_company_consistent",
      );
      await failCheck(
        client.query(
          "UPDATE placement_recruiter_profiles SET company_id=$1 WHERE user_id=$2",
          [companyB,recruiterA],
        ),
        "db09_recruiter_profile_grant_company_immutable",
      );
      await failCheck(
        client.query(
          "UPDATE placement_company_relationships SET company_id=$1 WHERE id=$2",
          [companyB,relationshipA],
        ),
        "db09_relationship_grant_company_immutable",
      );
      // Independent profiles/relationships without grants remain mutable.
      await client.query(
        "UPDATE placement_recruiter_profiles SET company_id=$1 WHERE user_id=$2",
        [companyA,recruiterB],
      );
      await client.query(
        "UPDATE placement_company_relationships SET company_id=$1 WHERE id=$2",
        [companyA,relationshipB],
      );
      await client.query(
        "INSERT INTO placement_recruiter_college_grants(id,recruiter_user_id,company_relationship_id) VALUES ($1,$2,$3)",
        [randomUUID(),recruiterB,relationshipB],
      );
      // Revoked historical grants still prohibit company reassignment.
      await client.query(
        "UPDATE placement_recruiter_college_grants SET status='REVOKED' WHERE id=$1",
        [grantA],
      );
      await failCheck(
        client.query(
          "UPDATE placement_recruiter_profiles SET company_id=$1 WHERE user_id=$2",
          [companyB,recruiterA],
        ),
        "db09_recruiter_profile_grant_company_immutable",
      );
    } finally {
      if (created) {
        try {
          await client.query("SET search_path TO pg_catalog");
          await client.query("DROP SCHEMA " + qSchema + " CASCADE");
        } catch (error) {
          throw new Error("DB09 disposable witness cleanup failed", { cause: error });
        }
      }
      await client.end().catch(() => {});
    }
  },
);
