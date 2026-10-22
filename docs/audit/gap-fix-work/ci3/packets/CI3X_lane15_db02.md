# CI infra packet (round 3): db02-staged-acceptance

This CI job fails on main. Fix the cause with the smallest correct change (the migrations 0000-0290 are the source of truth; staging SQL that was promoted into a registered migration must become idempotent or be retired with a note). Never weaken a guard test to make it pass.

```
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f scripts/sql/db02-academic-progression-and-rooms-staging.sql
psql:scripts/sql/db02-academic-progression-and-rooms-staging.sql:22: NOTICE:  relation "program_terms" already exists, skipping
psql:scripts/sql/db02-academic-progression-and-rooms-staging.sql:25: NOTICE:  relation "program_terms_program_active_idx" already exists, skipping
psql:scripts/sql/db02-academic-progression-and-rooms-staging.sql:77: NOTICE:  relation "program_term_courses" already exists, skipping
psql:scripts/sql/db02-academic-progression-and-rooms-staging.sql:80: NOTICE:  relation "program_term_courses_course_idx" already exists, skipping
psql:scripts/sql/db02-academic-progression-and-rooms-staging.sql:612: ERROR:  operator does not exist: cohort_status <> cohort_status_pre_db02
 2026-10-22 05:36:34.279 UTC [107] ERROR:  operator does not exist: cohort_status <> cohort_status_pre_db02 at character 122
```
