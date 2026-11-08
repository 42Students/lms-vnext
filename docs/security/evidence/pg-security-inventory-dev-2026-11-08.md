# Database security inventory on dev, 2026-11-08 (SEC-06-001, 002, 004, 008; SEC-07-002, 011, 012, 019)

Produced by `scripts/security/pg-security-inventory.mjs` run as a Kubernetes Job with the migrator login against the dev database after migration 0342. Read-only. Baseline: `docs/security/pg-security-baseline.json`.

| Fact | Value |
|---|---|
| Tables in schema public | 280 |
| Row-level security enabled and forced | 246 and 246 |
| Policies cover SELECT, INSERT, UPDATE and DELETE | 246 of 246 |
| Tables not owned by the migrator role | 0 |
| SECURITY DEFINER functions | 0 |
| Runtime privileges on audit table | INSERT, SELECT, plus UPDATE only on the chain head (guarded by trigger) |
| Problems reported | 0 |

Tables without row-level security (34) are the classified user-owned, platform-reference and infrastructure tables in `docs/security/table-classification.json`.

## Unique indexes without a tenant column (SEC-07-012)

246 unique indexes do not name college_id or organization_id. They fall in three groups, none of which is a tenant-owned natural key that would collide across colleges:

1. **Opaque global values** where global uniqueness is the point: hashes, tokens, object keys, digests, dedupe and idempotency keys, legacy ids, public slugs and references, hosts (tenant_domains), college code, organization name.
2. **Composite keys on parent ids** (for example assignment + membership, project + key, round + application). The parents are tenant-bound rows, so the combination cannot repeat across colleges.
3. **One-per-parent rules** (one active offering per course, one primary mentor per project), again keyed by tenant-bound parents.

Natural keys that are tenant-owned (names and codes inside a department, program or college) are keyed with the tenant-bound parent id, for example courses_active_department_name_trim_uq and programs_active_department_name_uq. Intentionally global by product design: courses_slug_uq (public URL slug), colleges_code_uq, organizations_active_name_uq, tenant_domains_host_uq.

## Integrity of membership and role relationships (SEC-07-011)

membership_roles carries membership_roles_membership_role_uq (one row per membership and role) and its foreign key to the membership; the row-level policy derives from the parent membership. Grants, enrolments and project members use the active-membership unique indexes listed in the inventory.
