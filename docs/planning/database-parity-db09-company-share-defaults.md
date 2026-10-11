# DB-047 — DB09 company share-default structural parity

**Date:** 2026-10-11  
**Worker:** Chat 3  
**Phase:** DATABASE  
**Status:** SOURCE/STAGING IMPLEMENTED — not registered or PostgreSQL verified  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

## Proven source fact

Legacy migration `V162__tpo_v1_settings.sql` added nullable
`industry_company.export_columns_json` as the saved per-company export-column
picker.

The frozen current `IndustryCompany` JPA model does not map that column, and
the inspected current `TpoShareService` does not read or write the global
`industry_company.export_columns_json` field. The active share workflow
instead validates a fixed disclosure vocabulary and snapshots the selected
columns into each `tpo_share_link.columns_json`.

Therefore DB-047 does **not** claim a currently live producer/consumer for the
legacy global default. The field is preserved as an explicit source-backed
redesign rather than silently dropped or falsely marked active.

## Why the vNext target is relationship-scoped

`industry_company` is global across colleges. A mutable default stored on that
global company lets one college's preference become another college's default
for the same company.

vNext already normalizes the relationship between a college and a global
company as `placement_company_relationships`. The DB09 ledger therefore
redesigns the legacy value to:

`placement_company_relationships.share_column_defaults`

This makes the preference tenant-safe:

- College A and College B can reference the same global company while keeping
  independent disclosure defaults.
- The actual secure share remains an immutable snapshot in
  `placement_tpo_share_links.columns`; changing the relationship default does
  not retroactively widen an existing share.

## Exact disclosure vocabulary

Frozen `TpoShareService.ALL_COLUMNS` contains exactly:

- `name`
- `roll`
- `branch`
- `cgpa`
- `tenth`
- `twelfth`
- `email`
- `phone`
- `resume`
- `projects`
- `skillMatch`
- `stage`

The service filters requested share columns against that list before
persisting the per-share snapshot. DB-047 uses the same vocabulary for the
optional relationship default.

## Structural parity fix

Before DB-047, the DB09 ledger and candidate SQL targeted
`share_column_defaults`, but canonical
`src/db/schema/placements.ts :: placementCompanyRelationships` did not contain
the field. Registering the candidate as a manual ALTER would therefore create
immediate Drizzle/schema-snapshot drift.

DB-047 makes the canonical Drizzle table the structural source of truth:

- nullable `jsonb share_column_defaults`;
- typed as `string[]` in Drizzle;
- JSON type must be an array;
- values must be a subset of the exact 12-column source vocabulary.

The old candidate file
`docs/planning/sql/db09-company-export-preference-candidate.sql` is now
**SOURCE REFERENCE ONLY** and contains no DDL. W01 must generate the field/check
once from `placements.ts`; do not register a second post-create ALTER.

## What is intentionally not invented

DB-047 does not invent:

- a current legacy UI for editing the global default;
- a current runtime producer/consumer where source evidence did not prove one;
- automatic use of the relationship default when creating a new share;
- duplicate-value or ordering semantics beyond the source's allowed-value set;
- retroactive mutation of existing share snapshots.

Those are API/UI decisions only if later source/product evidence requires them.

## Required PostgreSQL/runtime witnesses

Before DB-047/DB09 can be verified:

1. Same global company, two college relationships, different valid defaults —
   both succeed independently.
2. A caller/direct SQL path cannot mutate another college relationship.
3. `NULL` succeeds.
4. Valid arrays using only the 12 source values succeed.
5. Scalar/object JSON and arrays containing an unknown value fail the CHECK.
6. Changing `share_column_defaults` does not mutate any existing
   `placement_tpo_share_links.columns` snapshot.
7. Generated registered migration and snapshot contain the column/check exactly
   once and no obsolete post-create ALTER.
8. Clean PostgreSQL replay succeeds in the registered dependency order.
9. Runtime/API behavior, if added later, enforces placement-staff tenant scope.

## Evidence boundary

This task closes the **canonical schema drift** and source-design ambiguity.
It does not prove a live consumer for the historical global default and does
not constitute PostgreSQL/runtime verification.
