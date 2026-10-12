# DB-002 current schema-drift reconciliation — 2026-10-12

**Worker:** Chat 1 / migration integrator  
**Phase:** DATABASE  
**Registered journal head at review start:** `0043_db09_share_column_defaults`

## Executed baseline

GitHub Actions run `38250543374` at commit
`9d2c71d9e15eb41f5bb23964a7f90114edd14135` proved:

- registered journal replay from empty PostgreSQL 17 succeeded;
- migration idempotence succeeded;
- read-only catalog witness succeeded;
- 43 migrations were registered at that commit;
- registered catalog contained 90 public tables, 211 FKs, 201 CHECKs,
  92 unique/primary constraints and 314 indexes.

That run was **not** full database acceptance: domain integration remained red.

## Drift isolated from generated schema

The schema-drift generator at the same run saw **95 canonical Drizzle tables**.
Compared with registered snapshot 0042, the structural delta was exactly:

### New canonical DB09 tables

- `placement_college_rules`
- `placement_company_visibility_settings`
- `placement_tpo_leads`
- `placement_tpo_lead_activities`
- `placement_tpo_followups`

### Existing table delta

- `placement_company_relationships.share_column_defaults`

No registered table disappeared.

## 0043 narrow registration already landed

Commit `298b8ef403c94d895886db1e018c9c860abfb363` registered only the reviewed
relationship-scoped share-default column/check as:

- `drizzle/0043_db09_share_column_defaults.sql`
- `drizzle/meta/0043_snapshot.json`

This intentionally did **not** register the five DB09 policy/CRM tables in the
same blind generated migration.

Therefore the remaining schema-generation drift after 0043 should be the five
canonical DB09 policy/CRM tables only, subject to exact current Drizzle output.

## Canonical sources for the remaining drift

- Policy/disclosure tables: `src/db/schema/tpo-policy.ts`
- Recruiter CRM tables: `src/db/schema/tpo-crm.ts`
- Integrity/reference SQL:
  - `docs/planning/sql/db09-policy-visibility-premerge.sql`
  - `docs/planning/sql/db09-tpo-crm-premerge.sql`
- Integration order/ownership:
  `docs/planning/db09-integration-manifest-2026-10-11.md`

The generated DDL must be reconciled with the stronger staged DB09 tenant,
principal, lifecycle and append-only guards. Generated structural DDL alone
does not satisfy DB09 PostgreSQL acceptance.

## Registration rule

Do not hand-edit the 95-table snapshot by approximation. Use exact current
Drizzle generation as the structural artifact, review the generated migration
against the canonical source/staging contracts, then register only the approved
delta. The schema-drift workflow now prints unregistered generated SQL and
uploads `drizzle/` as a diagnostic artifact on every run.

DB-002 can close only when the **registered** journal replays from zero and
current canonical Drizzle generation produces no unregistered structural drift.
DB-017 remains the wider staged-domain integration task after this baseline is
clean.
