# DB-021 — DB08 persisted outcomes and offers: staging contract

**Worker:** Chat 5 | **Phase:** DATABASE | **Date:** 2026-10-11  
**Legacy source:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, `V190__job_types_and_placement_outcomes.sql` and `V161__tpo_v1_drives.sql`.  
**Status:** SOURCE_REVIEWED / STAGED_NOT_REGISTERED / POSTGRES_NOT_RUN. **0 runtime-verified fields.**

This bounded follow-on from DB-011 closes a *proposal gap*, not DB08 parity. The isolated artifact is `scripts/sql/db08-outcome-fidelity-staging.sql`. It is **NOT a numbered Drizzle migration**. Chat 1 alone integrates `drizzle/**` and `src/db/schema/index.ts`. It must run only after base placement tables and DB08-B registration/event tables have been registered and replayed in disposable PostgreSQL.

## Contract and source mapping

| Legacy persisted state | Canonical proposed vNext target | Caveat |
|---|---|---|
| V190 `job.counts_as_placed`, default true | `placement_jobs.counts_as_placed boolean NOT NULL DEFAULT true` | **Per-drive** decision; must not infer exclusively from employment type. Legacy backfilled historic internships false; greenfield has no old rows, but new internship defaults must be resolved by writer |
| V190 `placement_registration.outcome_label` varchar(60) | `placement_batch_registrations.outcome_label` | Optional selected college label for a non-placement outcome; separate from consent |
| V190 `placement_registration.outcome_detail` varchar(200) | `placement_batch_registrations.outcome_detail` | Preserve complete detail without truncation |
| Mutable outcome change history | previous/next outcome label and detail in `placement_batch_registration_events` | Same transaction must append immutable before/after snapshot; staged columns do not implement writer |
| Legacy role-options JSON salary/bond fields | `placement_job_role_options`: fixed/variable/joining-bonus LPA, bond months/amount | Numeric(10,2) retains legacy precision; annual INR conversion remains an explicit decision |
| V161 `job_offer` terms | `placement_offers`: kind (LOI/OFFER), package/bond details, acceptance channel, dispute-until, cascade id, revoke reason and released-at | Current status enum remains narrow; imported-acceptance/dispute/revoke workflows are NOT implemented merely by adding columns |

Checks staged in PostgreSQL: nonblank optional labels/details, nonnegative package/bond fields, accepted LOI/OFFER kind, allowed IN_APP/EXTERNAL_IMPORT channel, and external-only dispute window. Existing `PLACEMENTS` choice/consent constraint remains authoritative; no new rule demands a label for an outcome because the legacy source did not require one. Do not assert fixed+variable+bonus equals `annual_ctc_inr`: units and package definitions need independently verified policy. Legacy `bond_amount` precision is preserved, but the currency/unit requires explicit confirmation.

**Privacy:** legacy public offer `letter_url` is *not* copied. The private letter receipt/object mapping belongs to DB-016 (Chat 1). Existing `issued_by_user_id` and offer history remain; actor-type provenance and LOI release/verification/revocation states require coupled business-rule decisions. Do not silently widen `placement_offers.status` beyond current ISSUED/ACCEPTED/DECLINED/WITHDRAWN.

## PostgreSQL acceptance scenarios — ALL NOT_RUN

- **DB21-01/02:** true and false placed-count policies are both retained; job-type defaults plus explicit drive override are persisted; held-offer/placed totals read the column.
- **DB21-03/04/05:** outcome labels/details round trip and are recorded in before/after immutable event history, with optimistic-version and rollback enforcement.
- **DB21-06:** direct SQL negative package/bond values are rejected.
- **DB21-07:** imported-acceptance dispute window is rejected without EXTERNAL_IMPORT channel.
- **DB21-08:** LOI/OFFER kind allowed, invalid offer kind rejected.
- **DB21-09:** concurrent issue/accept/dispute cannot duplicate accepted or active offers or lose a cascade/undo event.
- **DB21-10:** wrong-tenant registration or offer foreign parents are rejected by database protections.
- **DB21-11:** numbered migration replay from zero and Drizzle schema/catalog drift pass against disposable PostgreSQL.

## Handoff and blockers

**Chat 1** must register the SQL *after* DB08-B tables, mirror all new columns and checks into canonical Drizzle schema, and run replay/catalog tests. No active migration, barrel or production data was modified by Chat 5.

**DB08 writer follow-on** must implement service writes + readers for placed count, consent-safe outcome detail and immutable event snapshots, offer compensation and imported dispute/revoke lifecycle. The existing placement application vs eligibility/module revocation race (Pass-5 P5-R01) remains separately open.

**DB-019/DB-020** must independently field-map and then verify complete source/DB semantics and end-to-end tests. This stage is source-authored, **NOT DONE_VERIFIED**, and does not change the 280-field ledger's zero verified count.
