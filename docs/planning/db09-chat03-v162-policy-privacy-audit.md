# DB-012 · Chat 3 — College placement policy and recruiter disclosure source audit

**Date:** 2026-10-11 IST · **Global phase:** DATABASE  
**Worker:** Chat 3, [journal #23](https://github.com/42Students/lms-vnext/issues/23).  
**Legacy BE oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy FE oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Source DDL:** `src/main/resources/db/migration/V162__tpo_v1_settings.sql`  
**Target:** `src/db/schema/tpo-policy.ts`, `src/modules/placements/tpo-policy-service.ts`, `src/modules/placements/tpo-policy-validation.ts`.  
**Canonical rows:** `docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json`.

## Evidence

Compared all 14 V162 source fields across `college_placement_rules` (7) and `college_what_companies_see` (7), with corresponding vNext declarations and reads/optimistic update service. 14 of DB09's 279 historical field candidates have **source DDL comparison evidence** only. Every row remains `UNVERIFIED_FIELD_SEMANTICS`. No accepted retirement, live DB introspection, migration replay, executed policy tests, or recruiter consumer verification occurred.

### College placement rules — 7 source columns
- `college_id`: source integer college PK maps conceptually to canonical college UUID FK; same-tenant permissions still need executed witnesses.
- `counts_as_placed_at`: legacy enum defaults `OFFER_RELEASED`; target enum and default match source. Does the final analytics/report consumer honor policy changes?
- `max_held_offers`: default 1, vNext nonnegative bound raised to >=1. Verify concurrent held-offer threshold.
- `uplift_pct`: default 40; confirm CTC uplift calculation, dream-drive exemption, integer rounding and future rule changes.
- `min_response_hours`: default 48; prove deadlines are computed from current policy and preserved for pending offers.
- `updated_at`: target service updates timestamp; DB-level on-write behavior differs from legacy automatic ON UPDATE if direct writes occur.
- `version`: target `bigint(mode:"number")` plus input max safe integer supports normal CAS, but native bigint precision and overflow constraints need executable review.

### Recruiter visibility settings — 7 source columns
- `college_id`: same-college UUID scope and policy ownership require tests.
- `show_cgpa_exact`: legacy and target default FALSE, so no exact CGPA should reach unapproved recruiter projections; prove bands only.
- `show_tenth_twelfth`: legacy and target default TRUE; protect via recruiter scope, authorization and consent.
- `show_project_links`: legacy and target default TRUE; verify each shared project link is authorized and revocable.
- `show_assessment_scores`: legacy and target default FALSE; negative tests must prove these scores are excluded from recruiter output by default.
- `show_attendance`: legacy and target default FALSE; negative tests must prove attendance excluded by default.
- `updated_at`: legacy auto-update vs service-driven stamping; target adds an optimistic `version` (intentional extra safety), but no runtime CAS proof.

## Adversarial acceptance before marking any field verified

1. On disposable migrated PostgreSQL, attempt two simultaneous settings updates at the same expected version; exactly one may succeed.
2. Check an untrusted recruiter cannot read/change college policy rows for a foreign tenant.
3. Create contrasting college policies, generate recruiter candidate share/export and assert exact CGPA, assessment scores and attendance are withheld when the corresponding flags are false.
4. Confirm changing the flags changes the read-side projection, not just the settings page.
5. Check per-company disclosure is never broader than per-college defaults; validate expired/revoked share links and audit trail.
6. Check NULL/absent first-use rows return V162 defaults without creating unauthorized rows.
7. Confirm generated Drizzle SQL, migrations, FK, CHECK, CAS and potential bigint threshold behavior are registered and replayed by Chat 1. Authored schema/service code is not execution evidence.

**Current state:** DB-012 IN_PROGRESS. Initial 14/279 source rows documented, 0/279 formally verified. API/UI/release phases remain LOCKED. Do not confuse DBA settings source-match with verified privacy enforcement.
