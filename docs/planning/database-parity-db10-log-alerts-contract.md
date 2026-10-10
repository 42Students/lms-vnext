# DB-023 — DB10 log-alert triage identity and bigint safety

**Worker:** Chat 5 · **Date:** 2026-10-11 · **Phase:** DATABASE  
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`: V157, V158, V164, LogAlertSignature, LogAlertSignatureAccount, LogAlertState, LogAlertingService.  
**Status:** SOURCE_REVIEWED / DRAFT_NOT_JOURNALLED / POSTGRES_NOT_RUN. **0 of 24 source fields runtime verified.**

## Two source mismatches resolved in the proposed persistence

1. **`account_id` is not a vNext user FK.** V158 records `account=<numeric-id>/<ROLE>` markers from frontend error reporting and never declares an account table FK. The original vNext draft incorrectly referenced `users.id`; that is a UUID platform user and is not proven equivalent to every learner/faculty/recruiter/admin role-specific legacy account ID. The corrected proposal stores a **keyed HMAC-SHA256 `account_key_hash`** for a verified typed identity, with a composite `(signature_id, account_key_hash)` PK and **no `users` FK**. This is a deliberate privacy/identity normalization, not a claim that raw legacy IDs can migrate without mapping.
2. **The occurrence counter must not lose 64-bit precision.** `log_alert_signature.occurrence_count` was a MySQL BIGINT. Its PostgreSQL equivalent remains BIGINT, but the earlier Drizzle `mode:"number"` can exceed JavaScript's safe integer range. The corrected draft uses `mode:"bigint"`, default `1n`. Service JSON serialization must explicitly format bigint as decimal text or a safe bounded presentation value; never coerce all counts into JS numbers.

## Staged models

| Legacy table | Legacy source fields | Proposed vNext table | Controls |
|---|---:|---|---|
| `log_alert_signature` | 17 | `log_alert_signatures` | unique (environment,hash), occurrence count, first/last timestamps, fix/mute/regression triage, optional bounded sample |
| `log_alert_signature_account` | 3 | `log_alert_signature_accounts` | signature FK + opaque account digest PK, first seen; no raw identity |
| `log_alert_state` | 4 | `log_alert_states` | unique cursor key, poll cursor, admin last-viewed timestamp |

Source-authored artifacts: `src/db/schema/db10-log-alerts.draft.ts` and `scripts/sql/db10-log-alerts-staging.sql`. **Neither is an active numbered Drizzle migration**; Chat 1 owns journal, schema barrel and replay.

## Identity, privacy and concurrency acceptance

- A blast-radius identity must originate from **verified server context**, never merely from a client-controlled `account=<id>/<ROLE>` string. Use a stable keyed HMAC over scoped, typed identity (for example organization/college + role + stable actor ID). Missing verified identity means **unknown distinct-account count** (nullable), not zero.
- A keyed digest needs an operational key-rotation policy; rotating it without dedupe migration splits distinct-account counts. No HMAC key, raw contact, account ID, role-scoped legacy ID or PII may be stored in the signature-account table.
- Signature summaries may contain personally identifying data. Upstream sample-message/path redaction, TTL/retention, log access and administrative roles remain mandatory work; a varchar length limit is not redaction.
- Multi-worker ingestion must perform atomic UPSERT per (environment,signature hash): increment BIGINT once per accepted occurrence, `LEAST` first seen and `GREATEST` last seen for out-of-order logs. Keep triage and one-time fixed→regression transitions from being overwritten by the counter update.
- Signature-account insertion must be deduplicated with unique composite key; race two workers with the same digest and get exactly one account row. Unknown account identity may not be treated as a counted account.
- Cursor storage alone does not guarantee exactly-once alerting. Leases, poll cursor compare-and-set, batching/idempotence and restart semantics must be implemented and exercised in conjunction with DB10 scheduled-job leases.

## Required witnesses (all NOT_RUN)

- **DB23-01:** signature duplicate multi-worker ingestion increments one BIGINT counter without lost updates.
- **DB23-02:** an out-of-order event cannot move `last_seen_at` backwards or `first_seen_at` forwards.
- **DB23-03:** a count greater than `Number.MAX_SAFE_INTEGER` round-trips through Drizzle bigint mode without precision loss.
- **DB23-04:** 100 attempts to register one signature+digest produce one distinct-account row; two independent digests produce two.
- **DB23-05:** arbitrary/non-hex account digests fail SQL CHECK; no raw typed account ID or unverified client marker is persisted.
- **DB23-06:** missing verified account identity yields null/unknown distinct-count result rather than zero.
- **DB23-07:** FIXED signature reoccurrence sets `regressed_at` exactly once after permitted commit/grace conditions, without erasing fix/mute decisions.
- **DB23-08:** two cursor owners racing on log polling cannot double-count a batch after lease takeover or process beyond the durable cursor.
- **DB23-09:** sensitive example path/message is redacted by producer and never exposed to unauthorized college/admin users.
- **DB23-10:** fresh PostgreSQL replay, catalog drift and rollback-only wrong-type/cross-scope negative DB tests pass.

**No runtime/Node/Postgres suite execution is claimed.** This task repairs the source-derived staging contract only. The actual producer, scheduler, HMAC key management, retention, alias/migration registration and UI/API consumers remain future gated work. DB-019 and DB-020 must independently verify all 24 source fields and the executed database witness set before DATABASE certification.
