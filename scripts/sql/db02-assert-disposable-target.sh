#!/usr/bin/env bash
# Shared DB-005 guard for direct two-session acceptance scripts.
# Source before the first psql invocation. Does NOT connect or mutate data.
# A matching caller-supplied DB02_EXPECTED_DATABASE name alone is not proof
# that DATABASE_URL points to an isolated test target.
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL to an isolated disposable PostgreSQL database}"
: "${DB02_EXPECTED_DATABASE:?Set DB02_EXPECTED_DATABASE to the exact test DB name}"
if [[ "${DB02_DISPOSABLE_ACCEPTANCE:-}" != "YES" ]]; then
  echo "Refusing DB02 acceptance without DB02_DISPOSABLE_ACCEPTANCE=YES" >&2
  exit 2
fi
if ! command -v node >/dev/null 2>&1; then
  echo "Node is required for DB02 fail-closed target verification" >&2
  exit 2
fi
if [[ ! -f scripts/db01-test-database-guard.mjs ]]; then
  echo "Run DB02 acceptance from the lms-vnext checkout root" >&2
  exit 2
fi
node --input-type=module <<'DB02_GUARD'
import { assertSafeDb01TestTarget } from "./scripts/db01-test-database-guard.mjs";

const target = assertSafeDb01TestTarget({
  TEST_DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL: process.env.DB02_APP_DATABASE_URL,
  DB01_REMOTE_TEST_DATABASE_CONFIRM: process.env.DB01_REMOTE_TEST_DATABASE_CONFIRM,
});
if (target.database !== process.env.DB02_EXPECTED_DATABASE) {
  throw new Error("DB02 expected database does not match guarded URL target");
}
console.log(`DB02 test-target safety PASS: ${target.mode} ${target.host}/${target.database}`);
DB02_GUARD
