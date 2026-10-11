# DB-072 — final recruiter code and round-result provenance audit

**Worker:** Chat 3  
**Phase:** DATABASE  
**Date:** 2026-10-12  
**Status:** source/staging contract; not registered or PostgreSQL-verified  
**Frozen legacy backend:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

## Executive finding

A full current-source sweep found exactly one remaining placement database
stored-code family still using the pre-rename `HR` label:

- `src/db/schema/placements.ts`:
  `placement_round_results.source in ('TPO','HR','IMPORT')`;
- `src/modules/placements/result-service.ts`:
  recruiter conflict ownership checks `current.source !== "HR"`;
- the same service writes
  `source: recruiterCanStage ? "HR" : "TPO"`.

The sweep covered **54 current `src/db/schema/*.ts` files and 54 current
`src/modules/placements/*.ts` files**. No other `HR` literal was found
outside the one round-result schema CHECK plus the two result-service
producer/consumer references.

The frozen production database contract is already past that naming state:
V193 rewrites both `round_result.source` and
`round_result.submitted_by_type` from `HR` to `RECRUITER`.

## Frozen source behavior

### Final recruiter rename

`src/main/resources/db/migration/V193__recruiter_naming.sql`

The final source migration explicitly performs:

- `round_result.source: HR -> RECRUITER`;
- `round_result.submitted_by_type: HR -> RECRUITER`.

The vNext database must therefore not use `HR` as the final persisted actor
code.

### Active provenance sources

`TpoResultsService` and `RoundResult` describe results as staged provenance,
not merely actor roles. Frozen source explicitly models:

- recruiter decisions;
- panelist scoresheets;
- drive-day results;
- Excel imports;
- TPO-entered results.

`TpoImportService` actively stages source `EXCEL`.

`RecruiterDriveWorkService` actively stages both source and submitter type as
`RECRUITER`.

The TPO results controller also accepts a source value for manually staged
results, defaulting to TPO.

## vNext normalization decision

Final canonical `placement_round_results.source` vocabulary:

- `TPO`
- `RECRUITER`
- `PANELIST`
- `DRIVE_DAY`
- `IMPORT`

Intentional redesigns:

- legacy `HR` / recruiter provenance -> `RECRUITER`;
- legacy `EXCEL` -> `IMPORT`;
- `PANELIST` and `DRIVE_DAY` remain explicit provenance so later producers
  do not have to lie and store them as TPO;
- legacy `submitted_by_type` is not recreated. vNext
  `submitted_by_user_id` is the canonical actor identity; `source` describes
  how the result entered the staging queue.

This does **not** claim that every provenance-producing API surface is already
implemented. DATABASE phase preserves the persisted vocabulary so API phase can
add/clone those producers without another schema redesign.

## Why one strict migration is unsafe now

The current result service still:

1. writes recruiter-staged rows as `HR`;
2. decides recruiter ownership/conflict using
   `current.source !== "HR"`.

If the database were immediately rewritten to `RECRUITER` and the CHECK
rejected `HR`:

- old application instances could no longer insert recruiter results;
- already rewritten recruiter-staged rows would be treated by the old service as
  “not mine” and conflict.

Therefore DB-072 uses two release gates.

## EXPAND gate

`docs/planning/sql/db08-recruiter-round-result-code-candidate.sql`

First migration only widens the CHECK to:

`TPO | HR | RECRUITER | PANELIST | DRIVE_DAY | IMPORT`.

It does **not** rewrite data. Old and new writers can coexist safely during the
application rollout.

## API cutover gate

API phase must update `result-service.ts`:

- recruiter writer emits `RECRUITER`;
- staged-result recruiter ownership/conflict logic treats transitional
  `HR` rows as recruiter-owned while they may still exist;
- after old application instances are drained, no new `HR` writes occur;
- result import writes normalized `IMPORT`, not legacy `EXCEL`;
- future panelist/drive-day producers use the explicit provenance codes.

DB-072 deliberately documents this requirement but does not edit API/runtime
code during the DATABASE phase.

## FINALIZE gate

Only after API cutover:

1. lock the result table for the rewrite transaction;
2. verify no unknown source values exist;
3. rewrite persisted `HR -> RECRUITER`;
4. replace the compatibility CHECK with strict final vocabulary:
   `TPO | RECRUITER | PANELIST | DRIVE_DAY | IMPORT`;
5. assert no `HR` row survived.

Old app instances must be drained before this migration. A database lock during
the migration cannot protect against an old writer reconnecting after commit.

## Acceptance witnesses

Before DB-072 can be runtime verified:

1. EXPAND succeeds with current TPO/HR/IMPORT rows;
2. EXPAND preserves HR rows unchanged;
3. during compatibility window, both HR and RECRUITER inserts are accepted;
4. PANELIST and DRIVE_DAY are accepted after EXPAND;
5. IMPORT remains accepted;
6. unknown source values are rejected;
7. FINALIZE converts every HR row to RECRUITER;
8. FINALIZE rejects new HR rows;
9. final RECRUITER/PANELIST/DRIVE_DAY/IMPORT/TPO values remain valid;
10. final source CHECK has no HR literal;
11. result-service transitional cutover accepts legacy HR rows but writes only
    RECRUITER;
12. no other placement DB schema or placement module retains an unexplained HR
    stored-code literal;
13. registered migration replay succeeds from empty PostgreSQL and from a
    compatibility fixture containing HR rows.

## Evidence boundary

DB-072 may be source/staging **COMPLETED** once the two-stage migration design,
source sweep verifier and disposable PostgreSQL witness suite are authored and
independently inspected.

It is not `DONE_VERIFIED` until:

- API producer/consumer cutover is complete;
- Chat 1 registers both release-gated migrations correctly;
- disposable PostgreSQL witnesses execute successfully.
