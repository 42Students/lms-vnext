# DB-017 staged schema integration manifest

**Observed:** 2026-10-12 IST  
**Owner:** Chat 1 / migration integrator  
**Phase:** DATABASE  
**Machine ledger:** `docs/planning/db017-staged-integration-manifest.json`

## Baseline now registered

DB-002 independently verified the registered journal through
`0043_db09_share_column_defaults` on PostgreSQL 17.11 at
`c0468cc7c5dd42d603e643d8629191fd52f9e43e`.

DB-017 has now registered the remaining canonical structural drift that was
visible to Drizzle generation:

- `0044_db09_policy_crm_structural`
- snapshot 0044 contains **95 tables**
- the delta from 0043 is exactly five canonical DB09 tables:
  - `placement_college_rules`
  - `placement_company_visibility_settings`
  - `placement_tpo_leads`
  - `placement_tpo_lead_activities`
  - `placement_tpo_followups`

The relationship share-default column/check belongs to 0043 and is **not**
duplicated in 0044.

0044 is a structural registration only. Stronger DB09 principal, recruiter-grant,
append-only activity, follow-up terminal-state and collaboration/scheduling
guards remain explicit follow-up inputs. They are not silently treated as
executed just because their tables now exist.

## Integration disposition

The machine ledger classifies every DB00–DB10 domain as one of:

- registered baseline;
- no migration required;
- domain still in progress;
- source-complete but migration deferred;
- partially registered with producer/API-coupled follow-up.

This intentionally prevents the common failure mode of concatenating every
`docs/planning/sql/*.sql` file into a migration.

### Already registered

- DB03: 0037–0040
- DB06: 0041–0042
- DB09 share defaults: 0043
- DB09 policy/CRM structural baseline: 0044

### Deliberately deferred

- DB01 while identity/provider/product decisions remain open;
- DB02 while academic/schedule reconciliation is active;
- DB04 until private profile/storage producer and retirement decisions close;
- DB05 while course ancestry/version/tombstone work is still active;
- DB06 history/retention/private-file batches whose DB correctness depends on
  coordinated producer/API cutover;
- DB07 staged project relationship/history batches until parents and overlap are
  reconciled;
- DB08 lifecycle/outcome candidates pending exact semantic/runtime acceptance;
- the rest of DB09 principal/collaboration/settings/scheduling/notification
  integrity;
- DB10 operational/provider/privacy persistence.

## Explicit exclusions

The integration ledger forbids promotion of superseded or reference-only SQL,
including the DB04 duplicate receipt/media candidates and the superseded DB09
CRM/scheduling/notification drafts. The DB09 company-export preference SQL is
reference-only because 0043 owns the canonical Drizzle field/check.

## Required order

The current safe dependency shape is:

1. registered 0000–0044 baseline;
2. close DB01/DB02 parent decisions;
3. DB04 private profile/storage;
4. DB05 course/content ancestry, lifecycle and optimistic-state constraints;
5. producer-compatible DB06 history/retention/file migrations;
6. deduplicated DB07 project integrity;
7. DB08 lifecycle structures;
8. DB09 parent keys and remaining principal/lifecycle/collaboration/scheduling
   guards;
9. DB10 operational/privacy/outbound persistence.

This is an integration dependency order, not a promise that every source draft
needs a physical table or migration.

## Gate boundary

DB-017 source/integration control is complete once:

- all domain staging is dispositioned;
- known superseded drafts are excluded;
- canonical structural drift is registered once;
- remaining promotions have explicit prerequisites rather than accidental
  ordering.

It is **not** global database certification. Every future migration batch still
requires fresh Drizzle no-drift, zero-to-head PostgreSQL replay, idempotence and
targeted negative/race tests on the exact committed SHA.
