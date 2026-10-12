# W06 / DB10 — Known Errors tracker triage source stage (2026-10-12)

**Owner:** W06 issue #26. **Source oracle:** `42Students/lms@prod-2026` SHA `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, `LogAlertAdminService.java`, `LogAlertingService.java`, `LogAlertSignature.java`, `LogAlertState.java`; `lms2-fe@prod-2026` SHA `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`, Tracker `logs.js` and `KnownErrorsDrawer.jsx`. No schema migration applied in W06.

## Functionality authored

- `GET /api/tracker/logs/known-errors?environment=PRODUCTION&limit=40`: global Super Admin only with organization/college safety scope **cleared**. Retrieves newest persisted signatures, occurrence count serialized from PG bigint as decimal string, and aggregate number of distinct verified-account hashes (never emits the identities, hashes, raw message or log path). Handles UAT/DEVELOPMENT filters.
- `PATCH /api/tracker/logs/known-errors/[signatureId]`: same-origin, authenticated, global Super Admin only. `MUTE`, `STATUS` (OPEN / FIXED / EXPECTED with fix commit, note/issue), `LINK_ISSUE` actions. Applies legacy `LogAlertAdminService` state machine through `knownErrorTriagePatch`. PostgreSQL row lock serializes two triagers; column-only updates preserve occurrence counts and poller's concurrent fields. EXPECTED sets muted; OPEN clears an EXPECTED mute but leaves independently manually muted errors alone.
- `GET /api/tracker/logs/viewed` / `POST /api/tracker/logs/viewed`: last-viewed state is separate from poll cursor. Atomic upsert only of last-viewed column, using the database clock and `greatest` so two stale clients cannot move the stamp backward. Same-origin protection on POST.
- `/tracker/logs`: migration-aware Known Errors page with three environment tabs, safe summary, Mute/Unmute, Mark Expected, Mark Fixed, Reopen, link issue and review time. Navigation explicitly labels Known Errors as staged.
- **Fail-closed:** `DB10_LOG_ALERTS_READY=DB10_VERIFIED` required for every DB-backed reader/mutation; otherwise HTTP 503 `DB10_LOG_ALERTS_MIGRATIONS_PENDING`, page shows a non-green pending message. No raw Cloud Logging provider was attached or falsely described as healthy.

## Database state and correctness

Uses **only** `src/db/schema/db10-log-alerts.draft.ts` (three draft tables `log_alert_signatures`, `log_alert_signature_accounts`, `log_alert_states`). W01 alone owns registration into shared `src/db/schema/index.ts` and migration journal. **Do not enable** `DB10_LOG_ALERTS_READY` until W01 promotion and replay, seeded PostgreSQL verification, and a real cloud logger ingestion+poller contract.

- Existing signature hash, first/last seen, fix/mute/regression, distinct-account blast radius and independent poll/last-viewed cursor fields are modeled.
- **Not yet implemented:** GCP log collection, two-minute polling/retry, duplicate signature fingerprint generation, old/new detection, 5-per-poll alert cap, 4-page backlog cursor retention, muted spike escalation threshold 25, provider/Telegram delivery and regression event alerting. These are DB10 producer obligations, not claims of this consumer page.
- **Not yet full legacy UI:** Cloud search/log digest/export, filters by raw cloud log time/trace, health-strip, complete known-error pagination (>40 visible rows), issue reporting from a log, full mobile Playwright inspection.
- **Privacy redesign:** no public shared-password Super Admin login, no raw token/path/sample or HMAC account identity in the Known Errors response, and only cleared-scope platform Super Admin may view global telemetry.

## Verification ledger

| Gate | State |
| --- | --- |
| Pure state-machine unit coverage (`tests/unit/db10-log-alert-triage.test.ts`) | AUTHORED / UNEXECUTED |
| Static route/readiness/authorization checks (`tests/db10-log-alert-route-gates.test.mjs`) | AUTHORED / UNEXECUTED |
| Seeded disposable PG read/mutate/review tests (`tests/integration/db10-log-alert-admin.test.ts`) | AUTHORED / MIGRATION_BLOCKED |
| Native test, typecheck, lint, build, browser/Playwright | NOT RUN |
| Three draft tables registered, activated, DB semantic and concurrency verified | NOT VERIFIED |
| DB10 source fields fully verified | **0/221**; source review is not DB verification |

**W01 #21:** register/migrate after the DB10 SQL and tenant/privacy audit; run full replay. **W06:** implement GCP ingestion and durable signature/cursor worker only after DB tests, use fenced job leases and provider idempotency; complete triage end-to-end. Do not close the 25 legacy Tracker surface rows from this page-only stage.
