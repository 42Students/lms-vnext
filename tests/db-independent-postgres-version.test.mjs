import test from "node:test";
import assert from "node:assert/strict";
import { assertPostgres17Version } from "../scripts/db-independent-postgres-version.mjs";

test("DB-001 accepts PostgreSQL 17 from Docker and SHOW server_version", () => {
  for (const version of ["postgres (PostgreSQL) 17.11", "17.11", "17.11 (Debian 17.11-1)"]) {
    assert.equal(assertPostgres17Version(version), 17);
  }
});

test("DB-001 rejects other, malformed and secret-bearing engine versions", () => {
  for (const version of ["16.9", "18.0", "117.2", "", "17malformed", "postgres (PostgreSQL) 16.10"]) {
    assert.throws(() => assertPostgres17Version(version), /requires PostgreSQL major version 17/);
  }
  assert.throws(() => assertPostgres17Version("postgres://user:sensitive@invalid"), error => {
    assert.doesNotMatch(error.message, /sensitive/);
    return true;
  });
});
