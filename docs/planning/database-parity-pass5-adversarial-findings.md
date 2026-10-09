# LMS vNext — Pass 5 of 5: adversarial mutation, tenancy and release gate

**Status: SOURCE THREAT SWEEP COMPLETE / DATABASE EXECUTION BLOCKED — NOT DATABASE PARITY.**
**Date:** 2026-10-10 IST
**Target branch:** `db-parity-2026`; baseline `e823b19275f38e867988735e1e06755dec36153c`.
**Oracle heads:** legacy BE `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, legacy FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`, vNext main `5ca60b0f39a25c7b8dc1d0e26f4bbdfe8e5ec15a` (checked this pass).
**Schema source:** committed Drizzle `0036_snapshot.json`; real running PostgreSQL and legacy MySQL catalog **not inspected**.

## New executable witness coverage (source grounded)

Added **21 row-integrity witnesses** (`{"TENANT":7,"PARENT":9,"ACADEMIC":5}`): `scripts/sql/vnext-pass5-relational-witness.sql`.
Each checks that **two independently valid FKs agree about ownership, tenant, or parent context**. They return only an aggregate count and no personal/business rows. `database-parity-pass5-probe-manifest.json` is the exact source-referenced machine-readable inventory; every referenced column has been checked against the pinned vNext Drizzle 0036 snapshot.

### Critical failure scenarios newly made concrete

- **Tenant/college isolation:** project member or reviewer from college B on college A project; job under an unrelated college's season/company relationship; company relationship owned by a different-college member; placement application by a member of another college. Independent FKs do not disallow these pairs at the committed snapshot.
- **Parent consistency:** project task vs sprint/project, submission task vs project, placement role option vs job, round attendance/exception/request/offer vs application/job. Any mismatch must be rejected at the authoritative writer boundary and ideally prevented by composite FKs or a consistent transactional/constraint alternative.
- **Academic consistency:** section assignment term/cohort vs actual section/learner enrollment; course delivery cohort/period vs section; quiz attempt and assignment submission must match the selected delivery. Otherwise a valid FK can attach work to the wrong course instance.

These checks are *diagnostics against existing data*, not an assertion that an exploitable HTTP bug exists. For example, some existing domain services validate cross-parent consistency; this audit does not erase that counter-evidence. A zero result on an empty database is **meaningless** as proof of prevention.

## Pass 5 hard-stop threat matrix

| Threat | Evidence and required adversarial execution | Gate |
|---|---|---|
| Cross-tenant persisted parents | Seed two colleges; attempt forbidden cross-college references via every service writer and a direct SQL transaction. Check error, rollback, audit, and no eventual visibility. Run all 21 witnesses afterward. | **NOT RUN** |
| Mixed job/round/course parentage | For all manifest witnesses, insert individually valid but mutually inconsistent foreign parent IDs. Must fail before commit, at writer or DB guard. | **NOT RUN** |
| Concurrency, lost updates | Race group/elective max-pick across sibling groups, placement eligibility action + competing undo, attendance/quiz submission conflicts, template/sprint stale version, season updates. Verify one-winner/idempotence and durable events. | **NOT RUN** |
| Retention/deletion | Revisit nine `ON DELETE CASCADE` source FKs. Seed history and attempt parent deletion; verify legal/business preservation, audience scoping and tombstone behavior. | **NOT RUN** |
| Profile verification | Verify approved snapshot remains authoritative under UPDATE_PENDING, sent-back, resubmission; check no premature eligibility change and exact actor/history. | **NOT RUN** |
| Time and precision | Test campus-local due-date boundaries, UTC conversion and DST/time-zone interpretation, grade scale conversion, CTC integer rounding and NULL/default contracts. | **NOT RUN** |
| Migration replay | Fresh empty disposable PostgreSQL: `db:generate` diff / migration apply, catalog check, seed; rerun from empty, upgrade previous snapshot, verify counts/constraints/indexes/RLS. | **NOT RUN** |
| Permission boundaries | Attempt role-less/unapproved/suspended/expired recruiter grants, cross-college API enumeration, document/PII export and raw JSON access; check logs for leakage. | **NOT RUN** |
| Index and load behavior | At realistic synthetic scale, collect EXPLAIN ANALYZE under selective college, joins, unread and history queries. Check foreign-key lookup indexes, deadlocks and lock timeouts. | **NOT RUN** |
| True physical parity | Read-only export of legacy MySQL and disposable vNext Postgres with FK/check/index/trigger/default/enum metadata; compare to all 199 candidates and 2,829 fields; obtain field signoffs. | **BLOCKED** |

## Required validation commands — disposable data only

```bash
# First: provision a disposable Postgres DB, apply all migrations, and SEED two+ synthetic colleges
psql -X -A -t -v ON_ERROR_STOP=1 "$TEST_DATABASE_URL" \
  -f scripts/sql/vnext-pass5-relational-witness.sql > /tmp/vnext-pass5.jsonl
node scripts/db-parity-pass5-evaluate.mjs /tmp/vnext-pass5.jsonl
npm run test:db:parity
npm run test:db
```

No command above was executed in this chat. A read-only witness alone can detect historical inconsistencies but cannot test rejected writes. Run true negative tests against real disposable PostgreSQL with committed fixtures, not a mocked database. Do not point destructive tests to production.

## Release decision

**FAIL / BLOCKED**. Source review has identified reproducible data-integrity scenarios, **not** resolved them. Passes 1–5 now produce source audit artifacts but there is **no executable Postgres proof**, no migration replay, no live-source reconciliation, and **zero approved field-level semantic mappings**. Keep every Pass 4 decision OPEN. The DB00–DB12 plan and account-surface parity gate remain open.

**Next implementing batch:** DB03 typed groups/electives, then DB04 verification snapshots and DB08 season/eligibility state. For each, add migrations, cross-table constraints, tests and producer-consumer mappings before any completion claim.
