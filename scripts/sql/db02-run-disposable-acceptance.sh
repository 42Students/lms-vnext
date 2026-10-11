#!/usr/bin/env bash
# DB02 / DB-005 full acceptance entry point. Run from repository root only after
# Chat 1 integrates the canonical DB02 staging into numbered Drizzle migrations.
# This is NOT a migration and MUST NOT be run against production/shared DB.
#
# Invocation:
#   DB02_DISPOSABLE_ACCEPTANCE=YES \
#   DB02_EXPECTED_DATABASE=db02_verify_fresh \
#   DATABASE_URL='postgres://.../db02_verify_fresh' \
#   bash scripts/sql/db02-run-disposable-acceptance.sh
#
# Requires node >=20, bash, psql, and an isolated database on which a clean
# zero-to-current numbered migration replay has ALREADY been performed.
# This runner does not automatically drop or create a database. Concurrent
# harnesses deliberately leave uniquely tagged fixtures; discard DB afterward.
#
# Existing CI billing is NOT a reason to skip independent local verification.
# Authoring this script alone is NOT evidence of an executed test.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must point at an isolated disposable PostgreSQL DB}"
: "${DB02_EXPECTED_DATABASE:?Set the exact disposable PostgreSQL database name}"
if [[ "${DB02_DISPOSABLE_ACCEPTANCE:-}" != "YES" ]]; then
  echo "Refusing to run: explicitly set DB02_DISPOSABLE_ACCEPTANCE=YES" >&2
  exit 2
fi

for bin in node psql bash; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "Missing executable: $bin" >&2
    exit 2
  fi
done

if [[ ! -f "AGENTS.md" ]] ||
   [[ ! -f "scripts/sql/db02-academic-progression-and-rooms-staging.sql" ]]; then
  echo "Run this command from the lms-vnext repository root" >&2
  exit 2
fi

# Do not hardcode URL/password into error messages. The actual database name,
# not a guessed hostname, must match the caller's explicit disposable target.
ACTUAL_DATABASE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -c 'SELECT current_database()')"
if [[ "$ACTUAL_DATABASE" != "$DB02_EXPECTED_DATABASE" ]]; then
  echo "Refusing to run: DB name mismatch; expected $DB02_EXPECTED_DATABASE, actual $ACTUAL_DATABASE" >&2
  exit 2
fi

# Registration must have already occurred. Avoid accidentally measuring the
# UNREGISTERED source artifacts against an older schema and reporting success.
TRIGGER_WITNESSES="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 <<'SQL'
SELECT count(*)::integer
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgname IN (
    'db02_cohort_promotion_readiness_guard',
    'db02_program_term_course_type_history_guard',
    'db02_program_term_delete_history_guard',
    'db02_cohort_status_lifecycle_guard',
    'db02_academic_period_date_history_guard',
    'db02_cohort_progression_history',
    'db02_progression_state_no_truncate',
    'db02_lecture_hall_archive_guard',
    'db02_schedule_future_hall_lifecycle_guard',
    'db02_historic_offering_parent_guard',
    'db02_learner_program_enrollment_tenant',
    'db02_section_enrollment_cohort_period'
  );
SQL
)"
if [[ "$TRIGGER_WITNESSES" != "12" ]]; then
  echo "DB02 canonical migration is not fully registered (required trigger witnesses: 12, found: $TRIGGER_WITNESSES)" >&2
  exit 2
fi

TABLE_WITNESSES="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 <<'SQL'
SELECT count(*)::integer
FROM information_schema.tables
WHERE table_schema = current_schema()
  AND table_name IN (
    'program_terms',
    'program_term_courses',
    'cohort_progression_state',
    'cohort_progression_events',
    'lecture_halls',
    'faculty_course_associations'
  );
SQL
)"
if [[ "$TABLE_WITNESSES" != "6" ]]; then
  echo "DB02 canonical migration is missing staged tables (required: 6, found: $TABLE_WITNESSES)" >&2
  exit 2
fi

COLUMN_WITNESSES="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 <<'SQL'
SELECT count(*)::integer
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND (table_name, column_name) IN (
    ('course_offerings','program_term_id'),
    ('course_offerings','program_term_course_id'),
    ('cohorts','start_date'),
    ('cohorts','end_date'),
    ('sections','description'),
    ('sections','minimum_capacity'),
    ('sections','start_date'),
    ('sections','end_date'),
    ('section_schedule_events','lecture_hall_id')
  );
SQL
)"
if [[ "$COLUMN_WITNESSES" != "9" ]]; then
  echo "DB02 canonical migration is missing staged columns (required: 9, found: $COLUMN_WITNESSES)" >&2
  exit 2
fi

INACTIVE_ENUM_WITNESS="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 <<'SQL'
SELECT count(*)::integer
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typname = 'cohort_status'
  AND e.enumlabel = 'INACTIVE';
SQL
)"
if [[ "$INACTIVE_ENUM_WITNESS" != "1" ]]; then
  echo "DB02 canonical migration is missing cohort_status.INACTIVE" >&2
  exit 2
fi

source_tests=(
  tests/db02-staging-contract.test.mjs
  tests/db02-academic-parent-tenancy-contract.test.mjs
  tests/db02-schedule-progression-integrity-overlay.test.mjs
  tests/db02-historic-parent-reassignment-contract.test.mjs
  tests/db02-promotion-readiness-contract.test.mjs
  tests/db02-curriculum-type-history-contract.test.mjs
  tests/db02-disposable-runner-contract.test.mjs
)
single_session_sql=(
  scripts/sql/db02-postgres-acceptance-unregistered.sql
  scripts/sql/db02-schedule-progression-integrity-acceptance-unregistered.sql
  scripts/sql/db02-historic-parent-reassignment-acceptance-unregistered.sql
  scripts/sql/db02-promotion-readiness-acceptance-unregistered.sql
  scripts/sql/db02-curriculum-type-history-acceptance-unregistered.sql
)
two_session_bash=(
  scripts/sql/db02-postgres-concurrency-unregistered.sh
  scripts/sql/db02-promotion-readiness-concurrency-unregistered.sh
  scripts/sql/db02-curriculum-type-history-concurrency-unregistered.sh
)

for path in "${source_tests[@]}" "${single_session_sql[@]}" "${two_session_bash[@]}"; do
  if [[ ! -f "$path" ]]; then
    echo "Required DB02 verification artifact is missing: $path" >&2
    exit 2
  fi
done

echo "DB02 verified disposable DB target: $ACTUAL_DATABASE"
echo "1/3 Node static source contract tests"
node --test "${source_tests[@]}"

echo "2/3 PostgreSQL rollback-only single-session acceptance"
for path in "${single_session_sql[@]}"; do
  echo "Running $path"
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$path"
done

echo "3/3 PostgreSQL multi-session race acceptance"
for path in "${two_session_bash[@]}"; do
  echo "Running $path"
  bash "$path"
done

echo "DB02 disposable acceptance all checks completed with exit code 0"
echo "Retain command/output, migration SHA, PostgreSQL version and server settings"
echo "as Chat 1 review evidence before DB-005 can be marked COMPLETED/DONE_VERIFIED."
echo "Discard this disposable database; concurrent fixture rows were committed."
