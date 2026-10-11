# DB01 tenant / identity PostgreSQL negative acceptance

**Worker:** Chat 2 · **Task:** DB-004 · **Global phase:** DATABASE
**State:** authored test fixtures only; `DONE_VERIFIED` is **not** earned.

## Scope and source of truth

The two isolated test files in this PR exercise constraints already present in
`src/db/schema/{tenant-domains,users,memberships}.ts`; they neither introduce a
new Drizzle migration nor alter any production API.

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
  tests/integration/db01-identity-fk-invariants.test.ts
```

Do not infer success from source review, a green static check, or tests merely
existing. Preserve test logs, exact migration snapshot SHA, exact commit SHA,
and failed negative-case diagnostics in acceptance evidence.

**Safety dependency escalated to Chat 1:** `scripts/db-lib.ts` presently lets
`requireDatabaseUrl("TEST_DATABASE_URL")` fall back to `DATABASE_URL`.
Fix that shared helper before relying on test-preparation safety; Chat 2 does
not own it. Both newly authored tests independently require an explicit
`TEST_DATABASE_URL` and do not fall back.

## Outside this bounded batch

These 14 witnesses are *not* a replacement for DB01 source-to-target mapping
of the 312 candidates, managed-identity/provider proof, tenant-domain verified
recheck and soft-delete lifecycles, cross-college recruiter grant expiry,
OTP/handoff/session security, tenant branding bootstrap, or migration replay
of staged DB01 tables. Nothing in this batch can certify the DATABASE phase.

**Evidence status:** source checked (14 named tests; explicit test URL; rollback
in both files). CI and actual PostgreSQL acceptance remain **UNVERIFIED**.
