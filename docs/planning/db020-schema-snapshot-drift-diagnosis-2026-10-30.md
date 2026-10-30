# DB-020: Drizzle schema snapshot drift — executable diagnosis, not a migration plan

**Recorded:** 2026-10-30 · **Repository:** 42Students/lms-vnext · **Phase:** DATABASE · **Task:** DB-020 (OPEN)

## Reliable evidence

- GitHub Actions [CI 41032764607](https://github.com/42Students/lms-vnext/actions/runs/41032764607), `schema-drift` job: **FAIL**. The workflow ran `npm run db:generate` from the pinned commit `20cfad34089b5c8a32165eda4979169e1529a5f9` and generated an untracked `0313_*.sql` and changed `drizzle/meta/_journal.json`.
- The generated Drizzle diagnostic artifact was inspected offline against its own `meta/0312_snapshot.json` and generated `meta/0313_snapshot.json` (artifact ID `12965704776`). The previous recorded snapshot contains **222** tables; generated snapshot contains **266**, with **44 newly represented tables** and **116 changed shared table definitions**.
- A read-only source check matched **all 44** new-to-snapshot table names against explicit `CREATE TABLE` statements in earlier numbered SQL files in the bundled registered migration directory. This identifies snapshot/journal representation drift, **not 44 safe new tables**. It does not on its own certify the actual PostgreSQL catalog.
- Examples among the 44 include `skills`, `skill_synonyms`, `skill_usage`, `outbound_messages`, `log_alert_signatures`, `learner_profile_images`, `assignment_grade_events` and `learner_import_batches`. A literal application of the generator's CREATE TABLE output could collide with earlier registered DDL.
- The later, separately reviewed `0313_db10_skill_synonym_parity.sql` was registered and successfully replayed with idempotence by the dedicated [DB-022 PostgreSQL acceptance run](https://github.com/42Students/lms-vnext/actions/runs/41060834336). This **does not** reconcile the wider 44/116 snapshot discrepancy or make DB-020 complete.

## 31 October: executed registered PostgreSQL catalog comparison (not certification)

The GitHub Actions [DB020 disposable PG17 diagnostic run](https://github.com/42Students/lms-vnext/actions/runs/41129279756)
executed an exact registered **319/319** migration replay and idempotence
on disposable PostgreSQL 17, then generated an **unapplied** Drizzle 0319
diagnostic snapshot and compared it with the actual registered catalog.

| Dimension | Observed |
| --- | ---: |
| Registered PostgreSQL tables | 276 |
| Previous Drizzle snapshot tables | 222 |
| Newly generated typed snapshot tables | 266 |
| Newly typed tables **already in PostgreSQL** | 44/44 |
| SQL-only PostgreSQL tables outside typed snapshot | 10 |
| Typed columns missing from registered PostgreSQL | 1 |
| Registered columns missing from typed snapshot | 22 |
| Textually different type descriptions, not semantic failures by default | 795 |
| Registered PostgreSQL foreign keys | 732 |
| Unvalidated registered foreign keys | 0 |
| Registered FK names missing from typed snapshot | 120 |
| Typed FK names missing from registered catalog | 120 |

The one **confirmed missing typed column** was
`assignment_grade_events.source_action`, an optional `varchar(120)`
source-provenance field. A forward-only, nullable
`0319_db020_grade_event_source_action.sql` was added afterward, without
rewriting registered `0205` or inventing historical actions. Its registered
PostgreSQL proof is separate from the earlier diagnostic.

The pair of 120-count FK name discrepancies must be compared by actual
`child-table, parent-table, ordered source/target columns, delete/update
actions` before calling them 240 missing constraints. They may partly be
different names for identical structural relationships. Most of the 795
textual type differences include `varchar(n)` versus PostgreSQL's
`character varying(n)`, which is **not automatically schema drift**.
Conversely, missing columns, FK targets, defaults, CHECKs, retention and
tenant authorization must not be silently normalized away.

**No wholesale generated CREATE TABLE SQL was applied**: all 44
new-to-snapshot tables already exist. Existing migrations are immutable.
The remaining snapshot reconciliation is a comparison and carefully
reviewed metadata/forward-only DDL exercise, never blind promotion.

## Safe follow-up sequence

1. Treat newly generated migration SQL as **diagnostics only**. Do not apply the wholesale `0313_*` artifact, rewrite old applied SQL or bypass the `schema-drift` CI check.
2. For the 44 new-to-snapshot tables, compare the registered migration SQL, actual fresh disposable PostgreSQL 17 catalog and `src/db/schema/index.ts` exports. Resolve any missing or divergent columns, indexes, defaults and constraints without destructive data loss.
3. For the 116 changed table definitions, build a reviewed SQL-to-typed-schema disposition. Distinguish deliberate SQL-only trigger/index changes from actual structural mismatches.
4. Reconcile Drizzle snapshots **after** those checks, preserving the numbered journal and forward-only migration history. Regenerate on an exact clean SHA and require zero generated drift.
5. Only after that, run independent zero-to-head migration replay, idempotence, tenant/negative/race witnesses and the DB-020 phase-gate dependency checks, including DB-018 and DB-019.

**Acceptance:** DB-020 remains `done:false`. This report is a measured diagnosis and a no-shortcut migration safety checkpoint, not a PostgreSQL catalog certification.
