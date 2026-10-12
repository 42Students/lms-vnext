# Database core-11 closure — CI failure triage and source fix handoff

**Date:** 2026-10-12 (IST)  
**Branch:** main, direct commits only  
**Global phase:** DATABASE remains ACTIVE until real database gates pass.  
**No new task/PR/branch:** this is independent review support for existing DB002/017/018/019/020 and completed DB06/07/10 source tasks, not an invented closure task.

## The core-11 denominator

Original core tasks: DB-002, DB-003, DB-004, DB-005, DB-007, DB-008, DB-012, DB-017, DB-019, DB-020, DB-030. Report this denominator separately from the growing source-security task queue. Source-only checks cannot be promoted as executed PostgreSQL acceptance.

By the time of this review, the owner queue had independently marked DB-002 and DB-003 DONE_VERIFIED; DB-017 was implementation COMPLETED but still unverified. DB-004 was COMPLETED and DB-005/008 were IN_PROGRESS. DB-007/012/030 remain BLOCKED and DB-019/020 remain READY with unresolved dependencies. Consult the live queue for current statuses; these are point-in-time facts, **not** this reviewer's closures.

## Executed runner evidence from before this batch

At workflow run [38259723278](https://github.com/42Students/lms-vnext/actions/runs/38259723278), the database job had successfully executed registered migration journal verification, an empty PostgreSQL 17 replay and seed, replay idempotence, read-only catalog probe and relationship-scoped disclosure negatives before broader integration continued. This is **not** the same as the entire DATABASE phase passing. The independently executed source-contract job had failed 14 tests on the earlier head; typecheck/lint were also failing. These failures are a triage starting point, **not tests rerun by this reviewer after patches**.

## Independent direct-main correction batch

| Failure or risk from earlier runner | Source correction in main | Outcome / limits |
|---|---|---|
| Malformed project-history SQL dollar-quote closer after a concurrent peer fix | [9694197f](https://github.com/42Students/lms-vnext/commit/9694197fe5fc5967844dff72476d287aff01ff10) | Repaired the two newly corrupted tagged function closers, verified paired tagged delimiters in latest file; no PostgreSQL function compilation claimed |
| Pass-3 test demanded pass 4/5 \`NOT_STARTED\` despite their source sweeps | [131777ee](https://github.com/42Students/lms-vnext/commit/131777ee46a0ff85cac565217de3797b2b4fad4) | Assert recorded source audit states; explicitly reject runtime-certification labels |
| Pass-4 test required every review evidence note to be null despite 580 explicitly unverified source notes | [90c63847](https://github.com/42Students/lms-vnext/commit/90c638477053804275856137b4f27d3399120395) | Require \`verifiedMapping\` null, provenance note and runtime-unverified wording instead |
| DB18 N06 negative-witness index pointed at 0042 rather than the trigger-owning migration 0041 | [d95eac6f](https://github.com/42Students/lms-vnext/commit/d95eac6f7e53ed6a6aa3f798933dd0a3b51c6d43) | Reconciled all nine index guards; only N06 was misreferenced |
| DB053 source documentation did not explicitly describe the atomic multi-receipt/file cutover | [5d29c947](https://github.com/42Students/lms-vnext/commit/5d29c947da3ec7b7ebe391a004bfa248d231a4e5) | Describes insert submission → consume receipt → insert file; private read must revalidate receipt and trusted scan. Single FILE API not falsely described as multi-part ready |
| DB053 SQL wording of consumed-receipt privileged revocation was obscured across lines | [b4194f9c](https://github.com/42Students/lms-vnext/commit/b4194f9cf7381219d9fb14eba31cf0b724834b14) | Annotation references existing ACTIVE same-college COLLEGE_ADMIN/persisted SUPER_ADMIN SQL predicate; not a new security mechanism |
| DB06 field tests expected formerly missing shuffle/attempt targets and null source evidence | [4d5aab46](https://github.com/42Students/lms-vnext/commit/4d5aab46f09255de471cca31fa4476c57ee3ed79) | Assert staged and derivable decisions remain runtime unverified, with evidence and exact target refs |
| DB035 test needed documented schedule-event delete retention policy | [ea1ed960](https://github.com/42Students/lms-vnext/commit/ea1ed9602070851c583d94cda058eb97ccabd688) | Explains why attendance event schedule parent FK must RESTRICT deletion; only documentation |
| DB41 test expected 14 \`sql.raw\` expressions when staged source contains 13, and ineffective mutation did not remove the marker | [39467259](https://github.com/42Students/lms-vnext/commit/3946725953eb9932f429f84625bbe51d1c420e8d) | Regression now asserts real expression count and actually removes the marker for a negative audit test |
| DB10 skill catalog unit test used nonexistent SUSPENDED membership enum | [19650b85](https://github.com/42Students/lms-vnext/commit/19650b8515da3445b5b9b0128db9c83d3b2f9dc9) | Replaced with typed DISABLED member state, preserving denied-access case |

The earlier DB028 suite's missing \`scripts/sql/db02-historic-parent-reassignment-guards.draft.sql\` reference was already independently repaired on main by a peer before editing. No false attribution to this batch.

## Review verification and still-open gates

- Executed a read-only 16/16 source-invariant audit of nine committed file revisions via the connected GitHub source reader during the iteration.
- Independently confirmed pass-4 has 2,829 source rows, 0 verified target mappings and 580 non-null source-reviewed notes explicitly containing runtime-pending terminology.
- Confirmed DB18 witness guard owner by reading registered 0041 and 0042 migration source.
- Verified the two DB07 tagged function pairs after the corrective write.
- **NOT RUN in this reviewer environment:** full \`npm run test:db:parity\`, \`npm run typecheck\`, lint, DB18 negative integration suite, whole PostgreSQL acceptance, migration replay against this *newest* source revision. Earlier GitHub runs are pinned to older heads and cannot certify new commits.

## Owner handoff

- **Chat 1 / DB002, DB017, DB019, DB020:** use the latest full workflow run to verify source-contract suite and migrations; do not infer DB020 signoff from a green DB002 journal replay. Complete all global gates.
- **Chat 4/5/6:** continue their claimed DB005, DB004 and DB008 task closures; do not overwrite their active files to expedite counts.
- **DB007/012/030:** retain blockers until specific integration/product/negative witness criteria are met. No scope inflation or new microtask IDs.
- **All workers:** include failed Node/TypeScript/DB steps separately from executed passing steps; source-only review is not DONE_VERIFIED.
