# DB01 identity/tenant security setting disposition — independent Node evidence

**Chat:** 2 · **Task:** DB-004 · **Date:** 2026-10-11 · **Global phase:** DATABASE (ACTIVE)  
**Status:** SOURCE CONTRACT EXECUTED / STAGED SCHEMA NOT REGISTERED / POSTGRES NOT EXECUTED

## Source and intended design

The legacy `AppSettingsService.java` defaults are `baseDomain=42lms.com`,
`globalHost=""`, `cookieDomain=""`, `cookieSameSite=Lax`,
`otp.maxAttempts=5`, `otp.windowSeconds=900`,
`ops.identityMaxJsonSize=10000`. `DB-033` classifies exactly seven
DB01-owned source-active settings, all global; generic legacy super-admin
overrides exist, so deployment-only reassignment requires explicit redesign
approval.

Current DB01 proposal:
- Four host/cookie keys: deployment config; never generic client settings.
- Three bounded numeric controls: optional **unregistered** typed singleton
  `identity_global_security_policy`, not unrestricted `app_setting`.
- Proposed security bounds: attempts 1–5, window 60–3600 seconds, JSON body
  1024–131072 bytes. These bounds strengthen rather than literally clone the
  legacy ability to write arbitrary strings.
- Actual provider/session/login and host/cookie consumers are **not** changed.

## Independently executed local Node checks

The following GitHub blob SHA values were compared with `git hash-object`
of the *byte-identical local copies* used in the run:

| Committed file | Git blob SHA |
| --- | --- |
| `scripts/verify-db01-identity-security-settings.mjs` | `268f01142dfb76f1ef7e60e9f3c0c5c250ae9f08` |
| `tests/db01-identity-security-settings-contract.test.mjs` | `4e5c163a1270c0f95a1972964325350bb9a0a94b` |
| `docs/planning/db01-identity-security-settings-policy.json` | `e14ef4c50976f6aed14f39b47dd9953508862e53` |
| `docs/planning/sql/db01-identity-global-security-policy-staging.sql` | `fe4d5a1e7becafb002cd10aeb8cf47024d880a2b` |

Executed with **Node v22.16.0** in an isolated local directory:

```bash
node --test /mnt/data/db01check/tests/db01-identity-security-settings-contract.test.mjs
node /mnt/data/db01check/scripts/verify-db01-identity-security-settings.mjs
```

| Executed output | Result |
| --- | --- |
| Node tests | 16 tests; 16 pass; 0 fail; exit 0 |
| Standalone audit | `SOURCE_CONTRACT_PASS_NOT_DB_VERIFIED`; 7 keys checked; no findings; exit 0 |
| Node TAP log SHA-256 | `9fe6c6772b369048214fce74075e7f0a88c67d43bbd9366ba1fc06141bb9de8d` |
| Audit output SHA-256 | `f354b5b1820847d5ee956921de735d016407fbf05da02c9ad5a86ec7850d96b7` |

**Honest input limitation:** the local independently executed fixture for
`database-parity-app-setting-disposition.json` was a synthetic seven-entry
DB01-only projection, not a byte-identical copy of its full 25-key file.
The four other files above were byte-identical. Separately, GitHub connector
JavaScript checked the committed policy **against the actual complete
25-key source registry**, yielding **10/10 source assertions PASS**, including
the seven-key exact set, all-global scope, hidden client settings, source
defaults, status guards, storage split and proposed SQL bounds. That connector
check is *not* a Node subprocess or SQL runtime.

## Explicit nonclaims and remaining gates

- **Zero PostgreSQL commands were executed**, and no DB schema/migration was
  activated. The staged singleton DDL cannot be counted as a registered table.
- No cloud/provider sign-in, OTP rate-limiting, cookie cross-host or API test
  ran. The limits are an **unapproved DB architecture candidate**.
- No typecheck, lint, build or browser test was executed for this candidate.
- GitHub Actions billing is intentionally irrelevant to progress; independent
  PostgreSQL and integration proof are still required for final certification.
- Chat 1 is the sole authorizer/writer for numbered Drizzle migrations and the
  shared schema barrel. Do not activate this policy without deciding whether
  provider-owned OTP rate limiting removes the need for a local table and
  how to preserve or redesign legacy admin editing of these settings.

**DB-004 stays IN_PROGRESS; 0 DB01 vNext runtime-semantic verified fields.**
