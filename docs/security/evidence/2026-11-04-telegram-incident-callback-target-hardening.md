# 2026-11-04 — Telegram incident callback target and delivery hardening

**Repository:** `42Students/lms-vnext` / `main`  
**Disposition:** implemented and tests authored; **not verified on a running CI worker or deployed provider**. This evidence file is not an additional tracker. Canonical status remains `docs/tracker.json -> security.controls`.

## Authorization improvement

The previous callback handler checked the production webhook secret, expected Telegram chat, and explicit `TELEGRAM_ALERT_OPERATOR_IDS`. It nevertheless accepted any 36-character string composed of hex/hyphens as an incident ID, allowed missing source `message_id`, and updated any matching production signature regardless of whether an alert was ever delivered.

The updated implementation:
- Enforces canonical versioned UUID syntax before touching SQL and lowercases the parsed ID.
- Requires the Telegram `callback_query.message.message_id` field. Missing/invalid source messages fail before DB and provider calls.
- Adds `alerted_at IS NOT NULL` to the database predicate used by both first acknowledgment and idempotent repeat lookup. Never-alerted rows are no longer eligible for triage acknowledgements.
- Retains the operator allowlist, exact chat verification, production-only secret comparison, no-store webhook responses, bounded streamed JSON and the existing atomic `acknowledged_at IS NULL` update.
- Adds negative tests for malformed IDs, noncanonical UUIDs and absent message provenance; documents operational expectations in `docs/operations/vnext-telegram-alerting.md`.

**Source commits:** [target+delivery guard](https://github.com/42Students/lms-vnext/commit/82977800f744690b5fbd7fb17bc0d600ad8ea20d), [canonical versioned UUID support](https://github.com/42Students/lms-vnext/commit/bccc2e6acb3c28790afa4c040744ef87316756a7), [UUID regression cases](https://github.com/42Students/lms-vnext/commit/54ff51985bf61f02ecddc571e72f9426974cc9af), [pre-SQL callback denial cases](https://github.com/42Students/lms-vnext/commit/44dbccecc79b5ef32645c7aabf047d9eec06f9dd).

## Acceptance status

At revision `44dbccecc79b5ef32645c7aabf047d9eec06f9dd`, [focused workflow 41837825151](https://github.com/42Students/lms-vnext/actions/runs/41837825151) was **completed FAILURE, with zero job steps executed**. This is not a failed test assertion; it is also not a passing test. The main CI run from that revision was still queued when inspected. Do not count this batch as independently verified.

Further required: actual `npx vitest` and TypeScript execution at a pinned source SHA; real disposable DB10 row with `alerted_at IS NULL` to prove mutation denial and unchanged audit timestamps; positive provider callback and repeat acknowledgements with a configured allowlisted user; independent security review and deploy/secret rotation evidence. Storing `alerted_at` does not authenticate the originating Telegram message; a future durable association of signed send/message ID and operator audit metadata requires reviewed DB10 schema work.

**Scope:** partial progress toward SEC-08 webhook validation, SEC-15 integration boundary, SEC-19 alert triage and SEC-23 adversarial verification. No control is marked VERIFIED here.
