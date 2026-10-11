# DB-004: college archive vs membership / hostname races

**Chat 2 | Global DATABASE phase | main**
**State: STAGED ONLY. No numbered migration and no PostgreSQL acceptance executed.**

## Source-backed defect

The college archive service, in src/modules/colleges/service.ts, calls resolveCollegeUsage and separately counts every membership except ENDED and every tenant domain before a later UPDATE setting college status ARCHIVED. This preflight is not locked against new descendants.

The People onboarding flow reads an active college and later persists a membership in src/modules/people/repository.ts. The tenant-domain service similarly validates college status then later inserts a host mapping. Two valid service calls can interleave and persist non-ENDED memberships or tenant domains under an archived college. The existing foreign keys prove only that the college row exists; they do not prove active parent state.

**Do not change the current policy silently:** SUSPENDED and ACTIVE memberships count as usage; ENDED memberships remain historical. Every existing tenant_domains row (verified or not) counts as usage. The separate proposed domain tombstone is unregistered and must not implicitly relax this rule.

## Staged cross-row serializing invariants

SQL: docs/planning/sql/db01-college-membership-domain-archive-guard-staging.sql

1. An INSERT or membership college/status mutation to a non-ENDED state must acquire the target college row FOR UPDATE in the same database transaction as the write, then require parent college ACTIVE. ENDED historical rows are retained; ENDED-to-ACTIVE is denied under an archived college.
2. An INSERT or college-id mutation of tenant_domains must acquire target college row FOR UPDATE and require ACTIVE. This is independent of is_verified / is_primary.
3. A college transition to ARCHIVED must reject any non-ENDED college_memberships row or any tenant_domains row, with SQLSTATE 23514 and stable constraint identifiers.
4. FK implicit KEY SHARE cannot substitute for FOR UPDATE because parent status updates need not change a key.
5. SQL guard registration is Chat 1 migration/snapshot responsibility. This file is a non-applied review draft, not a statement about deployed behavior.

Proposed constraint identifiers: db01_memberships_active_college_ck; db01_tenant_domain_active_college_ck; db01_college_archive_db01_children_ck. API error translation remains separately unimplemented.

## Runnable but unexecuted synthetic-schema PostgreSQL proof

File: tests/db01-college-membership-domain-archive-pg.test.mjs

With an explicitly approved disposable PostgreSQL database and Node dependencies installed, execute:

    DB01_RACE_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA TEST_DATABASE_URL='<disposable postgres URL>' node --test tests/db01-college-membership-domain-archive-pg.test.mjs

The script will otherwise SKIP. It refuses TEST_DATABASE_URL equal to DATABASE_URL, creates a random isolated schema with minimal matching enums/tables, runs the staged SQL in that schema, uses three PG client connections, and drops that schema in finally.

Its four two-session schedules require observing the losing connection blocked in pg_stat_activity.wait_event_type='Lock' before letting the winning side commit: membership insert before archive, archive before membership insert, domain insert before archive, and archive before domain insert. Tests assert expected SQLSTATE 23514 plus constraint name and persisted winner state. Additional direct SQL cases test historical ENDED membership, denied reactivation, SUSPENDED blocking archive, domain blocking archive, and moving a domain to an archived college.

**Neither this script nor PostgreSQL was executed by Chat 2 in this iteration.** Isolated fixture execution, if later successful, is *not* full Drizzle migration acceptance or production-schema compatibility. The actual generated migration replay and negative tests against full schema are still required.

Read-only anomaly queries before promotion:

    SELECT m.id, m.status, m.college_id FROM college_memberships m
    JOIN colleges c ON c.id=m.college_id
    WHERE c.status='ARCHIVED' AND m.status <> 'ENDED';

    SELECT d.id, d.college_id FROM tenant_domains d
    JOIN colleges c ON c.id=d.college_id
    WHERE c.status='ARCHIVED';

Both should return zero; never apply automatic cleanup/backfill without explicit approval.

## Important unclosed dependencies

The draft covers only membership and domain persistence. resolveCollegeUsage also checks live departments, academic periods, project template assignments, project instances, placement company relationships, placement seasons and placement jobs. Each corresponding INSERT/activation/reparent writer requires a coordinated lock or database invariant before anyone may call overall college archival safe. DB02/DB03/DB05/DB08/DB09 task owners should review their own paths. A partial DB01 guard must not be promoted as complete archive protection.

Related staged invariant: docs/planning/sql/db01-org-college-archive-race-staging.sql. Parent-first/child-first lock order and actual two-session deadlock and retry schedules need review across this guard and organization/college guard. The current domain tombstone draft retains deleted hosts; current archive checks count all persisted domain records, so tombstone product policy is a separate explicit decision.

## Promotion gate

- Chat 1 confirms exact enum names/types and integrates approved SQL only through numbered Drizzle migration with schema barrel/snapshot consistency.
- Peer workers reconcile all eight additional parent-child usage categories and avoid incompatible lock orders; do not claim parent-child archive safety globally while those producers race.
- Run the standalone disposable PG witness *and* registered full-schema migration replay/negative race witnesses on the final migration revision; retain actual command, exit, PostgreSQL version, logs and source SHA.
- Add API-layer translated error and authorization regression tests when API becomes globally ACTIVE.
- Run independent validation, not GitHub Actions. GitHub Actions billing is intentionally not a blocker, but SQL proof remains mandatory.

Source/mutation guard: tests/db01-college-membership-domain-archive-source.test.mjs (13 authored tests). This is an engineering draft, not DB-004 completion, DONE_VERIFIED or a runtime-semantic verified field.
