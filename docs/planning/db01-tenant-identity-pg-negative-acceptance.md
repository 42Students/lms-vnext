# DB01 tenant / identity PostgreSQL negative acceptance

**Worker:** Chat 2 · **Task:** DB-004 · **Global phase:** DATABASE
**State:** authored test fixtures only; `DONE_VERIFIED` is **not** earned.

## Scope and source of truth

The three isolated PostgreSQL test files committed to main exercise constraints already present in
`src/db/schema/{tenant-domains,users,memberships}.ts`; they neither introduce a
new Drizzle migration nor alter any production API. They cover **26 authored PostgreSQL cases**.

- `tests/integration/db01-tenant-identity-invariants.test.ts`: **5 witnesses**:
  1. unverified primary tenant domain rejected by
     `tenant_domains_primary_verified_ck` (23514);
  2. case-insensitive host conflict across two colleges rejected by
     `tenant_domains_host_uq` (23505);
  3. second verified primary rejected by
     `tenant_domains_college_primary_uq` (23505);
  4. duplicate canonical user–college membership rejected by
     `college_memberships_user_college_uq` (23505);
  5. duplicate membership role grant rejected by
     `membership_roles_membership_role_uq` (23505).
- `tests/integration/db01-identity-fk-invariants.test.ts`: **9 witnesses**:
  1. unknown user cannot own membership (23503);
  2. unknown college cannot own membership (23503);
  3. missing membership cannot receive a role (23503);
  4. missing college cannot own a tenant domain (23503);
  5. duplicate Identity Platform UID rejected (23505);
  6. case-insensitive duplicate email rejected by
     `users_email_ci_uq` (23505);
  7. duplicate canonical E.164 phone rejected (23505);
  8. duplicate user–system-role grant rejected by
     `system_roles_user_role_uq` (23505);
  9. positive witness: one canonical faculty user retains two distinct
     college memberships.

- `tests/integration/db01-core-structure-invariants.test.ts`: **12 witnesses**:
  1. ACTIVE organization names are case-insensitively unique (23505);
  2. ARCHIVED names may coexist with ACTIVE names (positive);
  3. reactivating a colliding ARCHIVED organization fails (23505);
  4. orphaned college organization references fail (23503);
  5. college codes are case-insensitively unique (23505);
  6. archiving does not release a college code (23505);
  7. college names may repeat if codes differ (positive);
  8. referenced organization cannot be deleted (23503);
  9. referenced college cannot be deleted (23503);
  10. canonical user UID cannot be NULL (23502);
  11. multiple canonical users without email are allowed (positive);
  12. UPDATE cannot promote an unverified tenant domain (23514).

- `tests/unit/db01-tenant-domain-authorization.test.ts`: **14 authored unit
  regression cases**, covering suspended/ENDED membership, disabled actors,
  FACULTY/TPO non-admin permissions, foreign-college domain ownership,
  scoped/unscoped SUPER_ADMIN permissions, and valid within-college management.
  These unit tests do not demonstrate real SQL tenancy enforcement.

Each test creates a PostgreSQL transaction and always rolls it back. This is
not an authorization test: a valid FK alone does not prove same-tenant actor
permissions, membership-status checks, or role revocation ordering.

## Acceptance commands (not recorded as executed)

Run only in a deliberately disposable **local** PostgreSQL database.
`scripts/db-test-prepare.ts` resets schemas; do not point it at any valuable DB.

```bash
export TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5432/lms_vnext_test'
npm ci
npm run db:test:prepare
npx vitest run --config vitest.db.config.ts \
  tests/integration/db01-tenant-identity-invariants.test.ts \
  tests/integration/db01-identity-fk-invariants.test.ts \
  tests/integration/db01-core-structure-invariants.test.ts
npx vitest run --config vitest.config.ts \
  tests/unit/db01-tenant-domain-authorization.test.ts
```

Do not infer success from source review, a green static check, or tests merely
existing. Preserve test logs, exact migration snapshot SHA, exact commit SHA,
and failed negative-case diagnostics in acceptance evidence.

**Safety dependency escalated to Chat 1:** `scripts/db-lib.ts` presently lets
`requireDatabaseUrl("TEST_DATABASE_URL")` fall back to `DATABASE_URL`.
Fix that shared helper before relying on test-preparation safety; Chat 2 does
not own it. All three authored DB integration files require an explicit
`TEST_DATABASE_URL` and do not fall back.

## Outside this bounded batch

These 26 PostgreSQL witnesses and 14 permission unit cases are *not* a replacement for DB01 source-to-target mapping
of the 312 candidates, managed-identity/provider proof, tenant-domain verified
recheck and soft-delete lifecycles, cross-college recruiter grant expiry,
OTP/handoff/session security, tenant branding bootstrap, or migration replay
of staged DB01 tables. Nothing in this batch can certify the DATABASE phase.

**Evidence status:** 26 PostgreSQL cases authored in three rollback-only files,
with explicit TEST_DATABASE_URL; 14 permission unit cases authored. GitHub
Actions is intentionally unused because of billing, not an engineering blocker.
None of these newly authored tests was run in this worker environment;
**0 passing cases claimed**, PostgreSQL/runner acceptance UNVERIFIED.
