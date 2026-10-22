# CI infra packet (round 3): db05-staged-acceptance

This CI job fails on main. Fix the cause with the smallest correct change (the migrations 0000-0290 are the source of truth; staging SQL that was promoted into a registered migration must become idempotent or be retired with a note). Never weaken a guard test to make it pass.

```
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f scripts/sql/db05-course-identity.draft.sql
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f scripts/sql/db05-course-parent-facets.draft.sql
psql:scripts/sql/db05-course-identity.draft.sql:29: NOTICE:  column "short_title" of relation "courses" already exists, skipping
psql:scripts/sql/db05-course-identity.draft.sql:29: NOTICE:  column "slug" of relation "courses" already exists, skipping
psql:scripts/sql/db05-course-parent-facets.draft.sql:28: NOTICE:  column "parent_course_id" of relation "courses" already exists, skipping
psql:scripts/sql/db05-course-parent-facets.draft.sql:28: NOTICE:  column "created_by_organization_id" of relation "courses" already exists, skipping
not ok 3 - DB05 archived rows release a visible name, but NEVER release a slug
  error: 'unexpected SQLSTATE/constraint: db05_course_slug_reserved_uq'
  name: 'AssertionError'
```
