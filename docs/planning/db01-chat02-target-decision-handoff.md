# DB01 target-persistence disposition — after 312/312 source census

**Worker:** Chat 2 · **Task:** DB-004 · **Phase:** DATABASE  
**Evidence:** `docs/planning/db01-chat02-312-field-source-triage.json` + committed Drizzle `drizzle/meta/0040_snapshot.json` (90 declared tables).  
**Machine audit:** `docs/planning/db01-chat02-snapshot-column-presence.json` (312 rows).  
**Status:** PHYSICAL PRESENCE / DECISION GAP REVIEW ONLY — not a live Postgres schema inspection and not semantic parity.

## Structural presence matrix

| Source candidate status against frozen snapshot | All 312 | Active workflow / persistence subset of 288 | Interpretation |
| --- | ---: | ---: | --- |
| Single exact table.column in committed snapshot | **76** | **75** | Declared physical presence only; type, FK, consumer writes and rules not proven |
| Explicitly staged target absent from snapshot | **22** | **22** | W01 migration integrator needs to choose, register and replay |
| Normalized table/column expression rather than one column | **18** | **18** | Prove all relations and correct tenant/actor/history semantics |
| No explicit field-level target proposed in current crosswalk | **196** | **173** | Can be provider-managed, typed profile/feature-owned, explicit redesign/retirement or a real gap; **not 196 proven missing SQL columns** |
| **TOTAL** | **312** | **288** | 0 runtime-semantic verified |

The other 24 legacy candidate fields have model-only, repository-callsite-pending, backward-compatibility, retired-workflow or DDL-only statuses. No one has yet approved all 24 for removal. Current `postV150ActivenessVerified` count of 282 means active **legacy source** workflow evidence, not vNext feature completion.

## Decide explicit targets before a migration can be accepted

| Priority | Active legacy target gap (rough concept group) | Proposed canonical resolution / accountable queue |
| --- | --- | --- |
| P0 | Cross-host auth `auth_handoff_token` (9) | Choose staged `identity_auth_handoffs`: keyed MAC, 2-minute TTL, scoped member/domain; W01 migration, API phase later for atomic consume; never raw JWT/refresh credentials |
| P0 | Device session `user_session` (9) and refresh blocklist (5) | Decide provider-only revocation parity vs `identity_device_sessions` sidecar; W01 migration and persisted request-time revocation test, no legacy faculty permission bypass |
| P0 | `mobile_login_attempt` (18) plus faculty/learner account-verification data (25) | Confirm provider OTP operations or scoped `identity_auth_attempts` state: HMAC-only code, five-try atomic budget, SMS+email fallback, expiry and tenant safety. Do not duplicate provider authority without proof |
| P0 | Recruiter grant `valid_until`, capability, `revoke_reason`, actor history, optimistic version | DB-012/DB09 reviewer; before vNext request-context grants can be called parity-safe, expire ACTIVE grants and preserve rights/history |
| P0 | User/college/organization/role credential privileges | Managed provider and centralized roles, W01. Legacy user registration appears to assign ADMIN to new users and faculty session revocation bypasses ownership: intentional security exceptions, not parity to reproduce |
| P1 | Faculty/Learner profile details, address, qualifications, private identity documents, social links and education/progress context | DB-007/DB04 profile and DB-005/DB02 academic owners. Typed profile documents, secured upload receipts, verification-history and tenant-scope proof; check every producer and consumer |
| P1 | `college_branding` (already in 22 staged candidate mappings), DNS `last_found_values` | W01 integrate after URL/public-read and TXT secret/retention review; preserve public tenant login branding and verification diagnostics |
| P1 | Legacy college chair/vice-chair identifiers, department chairs | DB02 product/backend compatibility mapping; ensure no live permissions or reporting still consume them before retirement |
| P2 | Legacy `role` descriptive catalog, `user.business_title/user_name/unique_id` | Explicit typed catalog / managed identity / approved retirement; exact consumers still require source-negative proof |

**Important:** A cross-domain task being active or blocked does not close DB-004's semantic obligation. No permanent worker-domain ownership exists; DB04/DB09/DB02 are temporary queue labels and require explicit shared handoff, not silent reassignment.

## What the static snapshot comparison can and cannot prove

- 76 single table.column candidates exist in the committed `0040_snapshot.json` with types/nullable/default snapshots; none is proof the **live database** contains that field.
- The snapshot comparison deliberately does not flatten `users.id + college_memberships.id` into a synthetic single-column match, and it does not count a generic JSONB profile document as preserving individual persistent fields without a validated schema/producer.
- An AUTH/OTP concept mapped to Firebase is not automatically retired. Provider API capabilities, same-host/multi-host login behavior, device session revocation and email fallback must be verified.
- Only W01 registers numbered Drizzle migrations and edits the schema barrel. No source-only staging or static report may be described as runtime-verified.
- The phase gate requires clean replay from empty/latest disposable PostgreSQL, negative tenant/role/reference checks, privacy and concurrency, original frontend/backend source oracle freshness and cross-role workflow proof. Current DB01 runtime-semantic verified: **0 / 312**.

## Concrete handoffs and acceptance

1. **Chat 1 (migration integrator):** consume `db01-chat02-migration-integration-manifest.json`, select *one* canonical auth device/OTP/handoff shape, register required parent composite uniqueness and matching FKs in generated Drizzle migrations, run clean DB replay and source-to-snapshot compare. Account name/email and branding provider security changes need explicit decisions.
2. **DB04/DB02 review:** validate mapped individual profile, identity/consent/verification document and academic lineage fields against current JPA/profile services. Do not assume generic JSONB equals all active fields. Separate sensitive receipt metadata and history where required.
3. **DB09 review:** preserve recruiter active-grant expiry, capability and revoke history; negative test an expired-but-ACTIVE grant with current request context.
4. **Chat 2:** keep evidence ledger and source/snapshot status gates current, execute existing `node --test tests/db01-integration-manifest.test.mjs tests/db01-snapshot-column-presence.test.mjs` once a real repo runner is available, assist safe PostgreSQL negative-witness review, and DO NOT mark DB-004 verified without executed acceptance evidence.

**User decision preserved:** greenfield vNext, no production data migration.
