# DB-012 — Cross-company recruiter grant integrity (Chat 3, 2026-10-11)

**Evidence, not certification.** The `placement_recruiter_college_grants` table in `src/db/schema/placements.ts` references `placement_recruiter_profiles.user_id` and `placement_company_relationships.id` separately. It does not assert their company IDs match. A valid recruiter profile in company A plus a valid relationship in company B can therefore satisfy both FKs.

Before this patch, `loadActiveRecruiterGrant` in `src/modules/placements/tpo-messaging-service.ts` required ACTIVE user/profile/company/grant/relationship/college statuses but missed the **same-company equality check**. In contrast, `recruiter-service.ts` and the staged DB09 collaboration helper already check `companyRelationship.companyId = recruiterProfile.companyId`. The messaging helper backs recruiter thread discovery, open, message reads/writes and recruiter assertions. A mismatched row could incorrectly authorize an otherwise active account; this is a source-confirmed missing safeguard, **not evidence of exploitation**.

## Committed repair
- **Service:** `loadActiveRecruiterGrant` now requires `eq(placementCompanyRelationships.companyId, placementRecruiterProfiles.companyId)`, without widening roles or altering API contracts.
- **SQL candidate (not registered):** `docs/planning/sql/db09-recruiter-grant-company-integrity-candidate.sql` stages a grant INSERT/UPDATE trigger that checks both FK parents while holding share locks, plus guards that reject company reassignment of a recruiter or relationship while historical grants reference it.
- **Regression test:** `tests/db09-grant-company-isolation.test.mjs` authors 2 static source guards and one opt-in disposable PostgreSQL witness. With `DB09_GRANT_COMPANY_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA` and isolated `TEST_DATABASE_URL`, it checks valid same-company grants, wrong-company INSERT/UPDATE rejection, source/relationship company immutable with grants, no-grant parent mutability and revoked-grant history. **PostgreSQL NOT EXECUTED.**

## Integration gates
W01/Chat 1 must decide between this SQL-trigger approach and the stronger two-parent composite FK approach, and register **one**, not both, after reconciling with DB08/DB09 planned DDL. A declarative alternative requires a denormalized company ID in grants and matching UNIQUE+FOREIGN KEY parent pairs, with app writer changes.

After migration registration: replay on a disposable PostgreSQL instance, run the negative witnesses and a *two-connection parent-company update vs grant insert race*; verify status, revocation, grant ownership, tenant isolation, API compatibility and no extra privileges. The new SQL cannot replace college/role checks. Keep DB-012 **BLOCKED** until actual PostgreSQL and runtime evidence exists. All 279 DB09 fields have source disposition, but **0 fields are runtime/DB-verified**; no GitHub Actions billing dependency should block implementation.
