# chat-17 weak-area hardening — auth, system-roles, tenant-domains, identity

Source baseline: `docs/audit/coverage/WEAK-AREAS.md`, generated before this pass. That is a heuristic inventory, not behavioral proof. Source-based regressions are listed below; no application account/email is accessed.

| Module | Baseline (file/export coverage) | New behavioral tests | Source defect changed |
|---|---|---|---|
| auth | 10/13 files, 27/52 exports | `chat17-auth-crypto-hardening.test.ts` (5); `chat17-auth-http-hardening.test.ts` (7); `chat17-auth-tenant-branding.test.ts` (3) | `safeEqualHex` rejects empty/malformed hex even when same string; tenant sign-in branding excludes archived college |
| system-roles | 3/3 files, 3/7 exports | `chat17-identity-system-roles-hardening.test.ts` (3 system role + 3 identity) | no repository mutation required: unscoped/active SA only, no role assignment to disabled/missing accounts, validation denies unknown roles |
| tenant-domains | 8/9 files, 18/34 exports | `chat17-tenant-dns-verifier.test.ts` (5 parameterized groups) | real verifier imported, TXT chunks joined precisely, suffix impostors/ENOTFOUND/timeouts fail closed |
| identity | 4/4 files, 8/14 exports | `chat17-identity-system-roles-hardening.test.ts` (3 identity groups) | **Fixed** `hasMembershipRole` to check user platform ACTIVE, not just membership status and stale role list |

The three previously **unreferenced auth files** (`crypto.ts`, `http.ts`, `tenant-branding.ts`) and unreferenced **tenant DNS verifier** now have direct imports and actual behavioral expectations. All tests are included in `ux:audit:unit` and are also individually invocable by Vitest.

## Integrity and safety

- `safeEqualHex`: a raw identical non-hex string must not compare as a valid token; numeric HMAC equality remains constant-time after format check, purpose separated.
- `guardLoginRequest`: rejects cross-origin **before** parsing, applies IP throttle before body validation, validates Zod, fails closed on unknown hosts and never echoes raw internal exceptions/contacts.
- `getCollegeSignInName`: only named matching **ACTIVE** college may appear on tenant sign-in; stale archived tenants yield null.
- `hasMembershipRole`: a `DISABLED` user with a stale `ACTIVE` membership and role list cannot receive the role capability.
- `dnsTenantDomainVerifier`: only an exact entire TXT value verifies ownership; network failure must never flip it true.
- `assignSystemRole`: scoped/disabled/college-only admins cannot elevate; target must exist and be active, and input role must be canonical.

**Verification gate:** `npm run ux:audit:unit`; `npx vitest run tests/unit/chat17-*.test.ts`; `npm run typecheck`. The local chat environment cannot execute repository tests or PostgreSQL, so these are **authored** and pushed, not a CI-green claim. Re-run `node scripts/audit/weak-test-areas.mjs` to refresh counts; do not claim a specific new percentage before regeneration.

**External dependencies:** This suite mocks DNS/DB/network at explicit module seams so tests are repeatable. Real PostgreSQL, DNS and browser/system integration require their respective acceptance jobs. No production tokens or accounts are used.
