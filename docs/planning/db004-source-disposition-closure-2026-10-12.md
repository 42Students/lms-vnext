# DB-004 source target-disposition closure — DATABASE (Chat 5)

**Date:** 2026-10-12 · **Legacy backend pinned:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Phase:** DATABASE · **Acceptance:** SOURCE COMPLETED / NOT DATABASE-VERIFIED

## Delivered on `main`

- Canonical, exact-keyed **312 / 312** field-level source-disposition proposals in `docs/planning/db004-312-source-target-disposition-proposals.json`.
- The previous 137 fields without a field-level target proposal were reviewed: **123 have a proposed normalized, typed, staged or provider-owned destination**; **14 have an explicit candidate non-persistence decision**. The remaining fourteen consist of eleven legacy `auth_token` / `login_user` fields for which the pinned source found no current workflow or a removed username/password endpoint, plus the two legacy raw `auth_handoff_token` access/refresh tokens and `user.password`. These are **NOT approved retirements**.
- Added independent source-only audit `scripts/db004-identity-disposition-audit.mjs` and 12 Node regression tests in `tests/db004-identity-disposition-audit.test.mjs`. The tool fails closed on missing/duplicate fields, source evidence mutation, false runtime/retirement certification, malformed ownership, raw credential mirroring or dropped revocation semantics.
- An exact-source, connector-hosted V8 execution of the audit and mutation guards returned **13/13 PASS** against current GitHub blobs; this is **not** a `node --test` run. The authored 12 Node tests and all PostgreSQL acceptance cases are **NOT RUN**.

## The 14 explicit non-persistence decisions need real acceptance

| Group | Fields | Proposed behavior | Required independent acceptance |
| --- | ---: | --- | --- |
| `auth_token` historical model | 5 | Retire unused token-row implementation | Negative SQL/native/external consumer proof and authorized product retirement |
| `login_user` removed password-login model | 6 | Do not resurrect password tables or endpoint | Confirm all current/historical consumers, and formally accept provider-owned sign-in replacement |
| `auth_handoff_token.access_token/refresh_token` | 2 | Never persist raw provider credentials in handoff rows; use opaque one-time HMAC code | Prove provider handoff, expiry, replay exclusion and verified scoped domain/membership on every consume |
| `user.password` | 1 | Provider-managed credentials only; no Postgres password mirror | Prove user recovery, sign-in, revocation and replacement of any active password-reading consumer |

**Zero** of these 14 are silently declared retired, and **zero** of 312 legacy fields are runtime-semantic verified.

## Required owner handoffs, not duplicate domain claims

- **Chat 1 / DB-002 and DB-017:** integrate the already-staged DB01 auth attempts, handoffs, tenant branding/DNS, role/session history and parent composite-FK constraints in dependency order; reconcile Drizzle barrel and numbered journal and replay on a safe disposable PostgreSQL instance. Chat 5 has not touched protected numbered files.
- **DB-004 authentication decision:** provider OTP/email fallback and cross-host session jobs are not proven by an existing Firebase-cookie exchange route alone. Require a real producer and negative replay/lockout/tenant tests.
- **DB-005 (academic):** confirm college leadership/dept chairman and learner department/import provenance against permissions and active workflows, rather than treating user-facing UI retirement as source-field retirement.
- **DB-007 (profiles):** accept/reject proposed learner JSON subfields, faculty typed private attributes, receipt-based photos/identity and contact privacy. A proposed JSON path is not a validated persistence contract.
- **DB-012 (recruiter/TPO):** review recruiter status, optimistic version, grant expiry, capability rows, immutable granting/revoking actor roles and pending lead linkage; negative-test ACTIVE expired grants.
- **DB-019 / DB-020:** crosscheck entire 312-field source ledger, re-screen against the latest registered snapshot and actual PostgreSQL catalog; independently prove migration replay/tenant/concurrency/API writers and product decisions before moving any field or the database phase to `DONE_VERIFIED`.

## Quality and closure boundary

**Code/source batch is complete** when this handoff, ledger, audit and regression tests are committed. This authorizes only the queue state `COMPLETED` for DB-004 (implementation delivered; awaiting external verification). It **does not** authorize `DONE_VERIFIED`, reduce the database phase gate, claim registered schema changes, invent tested provider capabilities or mark any approved retirement. GitHub Actions billing is intentionally out of scope; tests may execute in any independently approved runner.

Current acceptance: `PG_VERIFICATION_PENDING`, `PROVIDER_JOB_PROOF_PENDING`, `PRODUCT_RETIREMENT_APPROVAL_PENDING`, `DRIZZLE_REGISTRATION_PENDING`.
