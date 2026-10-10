import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sql = fs.readFileSync(
  path.join(process.cwd(), "docs/planning/db04-proposed-migration.sql"),
  "utf8",
);

const count = (pattern) => (sql.match(pattern) ?? []).length;

test("DB04 candidate has one coherent private receipt definition", () => {
  assert.equal(
    count(/CREATE TABLE profile_private_document_receipts/g),
    1,
  );
  assert.equal(
    count(/CREATE INDEX profile_private_doc_member_purpose_idx/g),
    1,
  );
  assert.equal(
    count(/CREATE TABLE profile_verification_settings/g),
    1,
  );
  assert.equal(
    count(/CREATE FUNCTION db04_reject_event_mutation/g),
    1,
  );
  assert.equal(count(/-- TODO before adoption:/g), 1);
});

test("DB04 private receipt candidate keeps strict object identity checks", () => {
  assert.match(
    sql,
    /private_object_key ~ '\^private\/\[A-Za-z0-9_\/-\]\+\$'/,
  );
  assert.match(
    sql,
    /object_generation ~ '\^\[0-9\]\+\$'/,
  );
  assert.match(
    sql,
    /sha256_hex ~ '\^\[0-9A-Fa-f\]\{64\}\$'/,
  );
  assert.match(
    sql,
    /retention_until IS NULL OR retention_until >= uploaded_at/,
  );
  assert.match(
    sql,
    /revoked_at IS NULL OR revoked_at >= uploaded_at/,
  );
});

test("DB04 candidate does not contain the prior truncated regex fragments", () => {
  assert.doesNotMatch(sql, /\^\[0-9\]\+\nCREATE INDEX/);
  assert.doesNotMatch(sql, /\^\[0-9A-Fa-f\]\{64\}\nCREATE INDEX/);
});
