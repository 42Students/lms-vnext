# CI infra packet (round 3): db10-skills-acceptance

This CI job fails on main. Fix the cause with the smallest correct change (the migrations 0000-0290 are the source of truth; staging SQL that was promoted into a registered migration must become idempotent or be retired with a note). Never weaken a guard test to make it pass.

```
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f scripts/sql/db10-skills-catalog-staging.sql
psql:scripts/sql/db10-skills-catalog-staging.sql:19: ERROR:  relation "skills" already exists
 2026-10-22 05:36:43.018 UTC [114] ERROR:  relation "skills" already exists
```
