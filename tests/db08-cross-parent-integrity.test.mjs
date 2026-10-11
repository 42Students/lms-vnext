// DB-066 / Chat 3: placement cross-parent relational integrity.
// Static checks:
//   node --test tests/db08-cross-parent-integrity.test.mjs
// Disposable PostgreSQL witnesses:
//   DB08_CROSS_PARENT_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA \
//   TEST_DATABASE_URL=postgres://... \
//   node --test tests/db08-cross-parent-integrity.test.mjs
//
// Presence of this file is NOT PostgreSQL execution evidence.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

const candidate = readFileSync(
  resolve("docs/planning/sql/db08-cross-parent-consistency-candidate.sql"),
  "utf8",
);
const schema = readFileSync(resolve("src/db/schema/placements.ts"), "utf8");
const sourceVerifier = readFileSync(
  resolve("scripts/verify-db08-cross-parent-source.mjs"),
  "utf8",
);

test("candidate stages every same-parent invariant", () => {
  for (const name of [
    "db066_application_role_same_job_fk",
    "db066_round_result_round_job_fk",
    "db066_round_result_application_job_fk",
    "db066_request_application_job_fk",
    "db066_request_round_job_fk",
    "db066_request_offer_application_fk",
    "db066_exception_application_job_fk",
    "db066_exception_round_job_fk",
    "db066_exception_request_scope_fk",
    "db066_exception_request_type_ck",
  ]) {
    assert.match(candidate, new RegExp(name));
  }
  assert.match(
    candidate,
    /FOREIGN KEY \(request_id, application_id, round_id, request_type\)/,
  );
  assert.match(
    candidate,
    /placement_learner_requests\(id, application_id, round_id, request_type\)/,
  );
});

test("current Drizzle shape still needs DB-066 integration", () => {
  const result = schema.slice(
    schema.indexOf("export const placementRoundResults"),
    schema.indexOf("export const placementOffers"),
  );
  const request = schema.slice(
    schema.indexOf("export const placementLearnerRequests"),
    schema.indexOf("export const placementApplicationRoundExceptions"),
  );
  const exception = schema.slice(
    schema.indexOf("export const placementApplicationRoundExceptions"),
    schema.indexOf("export const placementJoiningOutcomes"),
  );
  assert.doesNotMatch(result, /jobId: uuid\("job_id"\)/);
  assert.doesNotMatch(request, /jobId: uuid\("job_id"\)/);
  assert.doesNotMatch(exception, /jobId: uuid\("job_id"\)/);
  assert.doesNotMatch(exception, /requestType: varchar\("request_type"/);
});

test("source verifier covers service assumptions and corrupt-row preflight", () => {
  // This file contains regex source literals, not evaluated service code.
  // Compare the escaped patterns literally rather than searching for the
  // unescaped JavaScript service expression (which produces a false failure).
  for (const probe of [
    String.raw`liveRole\.jobId\s*!==\s*job\.id`,
    String.raw`row\.application\.jobId\s*!==\s*round\.jobId`,
    String.raw`round\.jobId\s*!==\s*application\.job\.id`,
    String.raw`offer\.applicationId\s*!==\s*application\.application\.id`,
  ]) {
    assert.ok(sourceVerifier.includes(probe), "Missing source guard: " + probe);
  }
  assert.match(sourceVerifier, /candidate has corrupt-row preflight/);
});

const approved =
  process.env.DB08_CROSS_PARENT_DISPOSABLE ===
    "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  (!process.env.DATABASE_URL ||
    process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL);

function baseTablesSql() {
  return `
    CREATE TABLE placement_jobs (
      id uuid PRIMARY KEY
    );
    CREATE TABLE placement_job_role_options (
      id uuid PRIMARY KEY,
      job_id uuid NOT NULL REFERENCES placement_jobs(id)
    );
    CREATE TABLE placement_applications (
      id uuid PRIMARY KEY,
      job_id uuid NOT NULL REFERENCES placement_jobs(id),
      role_option_id uuid NOT NULL REFERENCES placement_job_role_options(id),
      UNIQUE (id, job_id)
    );
    CREATE TABLE placement_job_rounds (
      id uuid PRIMARY KEY,
      job_id uuid NOT NULL REFERENCES placement_jobs(id),
      UNIQUE (id, job_id)
    );
    CREATE TABLE placement_offers (
      id uuid PRIMARY KEY,
      application_id uuid NOT NULL REFERENCES placement_applications(id)
    );
    CREATE TABLE placement_learner_requests (
      id uuid PRIMARY KEY,
      application_id uuid NOT NULL REFERENCES placement_applications(id),
      request_type varchar(40) NOT NULL,
      round_id uuid REFERENCES placement_job_rounds(id),
      offer_id uuid REFERENCES placement_offers(id)
    );
    CREATE TABLE placement_round_results (
      id uuid PRIMARY KEY,
      round_id uuid NOT NULL REFERENCES placement_job_rounds(id),
      application_id uuid NOT NULL REFERENCES placement_applications(id)
    );
    CREATE TABLE placement_application_round_exceptions (
      id uuid PRIMARY KEY,
      application_id uuid NOT NULL REFERENCES placement_applications(id),
      round_id uuid NOT NULL REFERENCES placement_job_rounds(id),
      request_id uuid NOT NULL REFERENCES placement_learner_requests(id)
    );
  `;
}

test(
  "candidate rejects cross-job/request combinations and parent reparenting",
  { skip: !approved, timeout: 90000 },
  async () => {
    assertSafeDb01TestTarget(process.env);
    const pg = await import("pg");
    const client = new pg.default.Client({
      connectionString: process.env.TEST_DATABASE_URL,
      application_name: "db066-cross-parent-witness",
    });
    let racer = null;
    let goodSchema = null;
    let badSchema = null;

    const failFk = async (promise) =>
      assert.rejects(promise, (error) => {
        assert.equal(error.code, "23503", String(error));
        return true;
      });

    try {
      await client.connect();

      // Preflight must fail before any ALTER when persisted rows are corrupt.
      badSchema =
        "db066_bad_" + randomUUID().replaceAll("-", "").slice(0, 20);
      await client.query(`CREATE SCHEMA "${badSchema}"`);
      await client.query(`SET search_path TO "${badSchema}", pg_catalog`);
      await client.query(baseTablesSql());
      const badJobA = randomUUID();
      const badJobB = randomUUID();
      const badRoleB = randomUUID();
      await client.query(
        "INSERT INTO placement_jobs(id) VALUES ($1),($2)",
        [badJobA, badJobB],
      );
      await client.query(
        "INSERT INTO placement_job_role_options(id,job_id) VALUES ($1,$2)",
        [badRoleB, badJobB],
      );
      await client.query(
        "INSERT INTO placement_applications(id,job_id,role_option_id) VALUES ($1,$2,$3)",
        [randomUUID(), badJobA, badRoleB],
      );
      await assert.rejects(client.query(candidate), (error) => {
        assert.match(String(error.message), /application role option belongs to another job/);
        return true;
      });
      const [{ count: badConstraintCount }] = (
        await client.query(
          "SELECT count(*)::int AS count FROM pg_constraint WHERE conname='db066_application_role_same_job_fk'",
        )
      ).rows;
      assert.equal(badConstraintCount, 0, "preflight must fail before ALTERs");

      // Clean disposable schema: apply the candidate and exercise negatives.
      goodSchema =
        "db066_good_" + randomUUID().replaceAll("-", "").slice(0, 20);
      await client.query(`CREATE SCHEMA "${goodSchema}"`);
      await client.query(`SET search_path TO "${goodSchema}", pg_catalog`);
      await client.query(baseTablesSql());
      await client.query(candidate);

      const jobA = randomUUID();
      const jobB = randomUUID();
      const roleA = randomUUID();
      const roleB = randomUUID();
      const appA = randomUUID();
      const appB = randomUUID();
      const roundA = randomUUID();
      const roundB = randomUUID();
      const offerA = randomUUID();
      const offerB = randomUUID();

      await client.query("INSERT INTO placement_jobs(id) VALUES ($1),($2)", [
        jobA,
        jobB,
      ]);
      await client.query(
        "INSERT INTO placement_job_role_options(id,job_id) VALUES ($1,$2),($3,$4)",
        [roleA, jobA, roleB, jobB],
      );

      await failFk(
        client.query(
          "INSERT INTO placement_applications(id,job_id,role_option_id) VALUES ($1,$2,$3)",
          [randomUUID(), jobA, roleB],
        ),
      );

      await client.query(
        "INSERT INTO placement_applications(id,job_id,role_option_id) VALUES ($1,$2,$3),($4,$5,$6)",
        [appA, jobA, roleA, appB, jobB, roleB],
      );
      await client.query(
        "INSERT INTO placement_job_rounds(id,job_id) VALUES ($1,$2),($3,$4)",
        [roundA, jobA, roundB, jobB],
      );
      await client.query(
        "INSERT INTO placement_offers(id,application_id) VALUES ($1,$2),($3,$4)",
        [offerA, appA, offerB, appB],
      );

      await failFk(
        client.query(
          "INSERT INTO placement_round_results(id,round_id,application_id,job_id) VALUES ($1,$2,$3,$4)",
          [randomUUID(), roundB, appA, jobA],
        ),
      );

      await client.query(
        "INSERT INTO placement_round_results(id,round_id,application_id,job_id) VALUES ($1,$2,$3,$4)",
        [randomUUID(), roundA, appA, jobA],
      );

      await failFk(
        client.query(
          "INSERT INTO placement_learner_requests(id,application_id,request_type,round_id,job_id) VALUES ($1,$2,'ROUND_RESCHEDULE',$3,$4)",
          [randomUUID(), appA, roundB, jobA],
        ),
      );
      await failFk(
        client.query(
          "INSERT INTO placement_learner_requests(id,application_id,request_type,offer_id,job_id) VALUES ($1,$2,'OFFER_EXTENSION',$3,$4)",
          [randomUUID(), appA, offerB, jobA],
        ),
      );

      const requestA = randomUUID();
      await client.query(
        "INSERT INTO placement_learner_requests(id,application_id,request_type,round_id,job_id) VALUES ($1,$2,'ROUND_RESCHEDULE',$3,$4)",
        [requestA, appA, roundA, jobA],
      );
      const exceptionA = randomUUID();
      await client.query(
        "INSERT INTO placement_application_round_exceptions(id,application_id,round_id,request_id,job_id,request_type) VALUES ($1,$2,$3,$4,$5,'ROUND_RESCHEDULE')",
        [exceptionA, appA, roundA, requestA, jobA],
      );

      const requestB = randomUUID();
      await client.query(
        "INSERT INTO placement_learner_requests(id,application_id,request_type,round_id,job_id) VALUES ($1,$2,'ROUND_RESCHEDULE',$3,$4)",
        [requestB, appB, roundB, jobB],
      );
      await failFk(
        client.query(
          "INSERT INTO placement_application_round_exceptions(id,application_id,round_id,request_id,job_id,request_type) VALUES ($1,$2,$3,$4,$5,'ROUND_RESCHEDULE')",
          [randomUUID(), appA, roundA, requestB, jobA],
        ),
      );

      await failFk(
        client.query(
          "UPDATE placement_learner_requests SET request_type='APPLICATION_WITHDRAWAL' WHERE id=$1",
          [requestA],
        ),
      );
      await failFk(
        client.query(
          "UPDATE placement_job_role_options SET job_id=$1 WHERE id=$2",
          [jobB, roleA],
        ),
      );
      await failFk(
        client.query(
          "UPDATE placement_applications SET job_id=$1 WHERE id=$2",
          [jobB, appA],
        ),
      );
      await failFk(
        client.query(
          "UPDATE placement_job_rounds SET job_id=$1 WHERE id=$2",
          [jobB, roundA],
        ),
      );

      // Two-client race: parent reparent obtains its row lock first.
      // A concurrent child insert using the old parent key must wait and then
      // fail after the parent commits, never commit an inconsistent pair.
      const raceRole = randomUUID();
      const raceApp = randomUUID();
      const raceRound = randomUUID();
      await client.query(
        "INSERT INTO placement_job_role_options(id,job_id) VALUES ($1,$2)",
        [raceRole, jobA],
      );
      await client.query(
        "INSERT INTO placement_applications(id,job_id,role_option_id) VALUES ($1,$2,$3)",
        [raceApp, jobA, raceRole],
      );
      await client.query(
        "INSERT INTO placement_job_rounds(id,job_id) VALUES ($1,$2)",
        [raceRound, jobA],
      );

      racer = new pg.default.Client({
        connectionString: process.env.TEST_DATABASE_URL,
        application_name: "db066-cross-parent-racer",
      });
      await racer.connect();
      await racer.query(`SET search_path TO "${goodSchema}", pg_catalog`);
      await racer.query("SET statement_timeout = '10000ms'");

      await client.query("BEGIN");
      try {
        await client.query(
          "UPDATE placement_job_rounds SET job_id=$1 WHERE id=$2",
          [jobB, raceRound],
        );
        const pending = racer.query(
          "INSERT INTO placement_round_results(id,round_id,application_id,job_id) VALUES ($1,$2,$3,$4)",
          [randomUUID(), raceRound, raceApp, jobA],
        );
        await client.query("COMMIT");
        await failFk(pending);
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      }
    } finally {
      if (racer) await racer.end().catch(() => {});
      try {
        await client.query("SET search_path TO pg_catalog");
        if (goodSchema) await client.query(`DROP SCHEMA "${goodSchema}" CASCADE`);
        if (badSchema) await client.query(`DROP SCHEMA "${badSchema}" CASCADE`);
      } finally {
        await client.end().catch(() => {});
      }
    }
  },
);
