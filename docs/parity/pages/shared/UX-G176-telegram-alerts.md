# UX-G176 · Log-alert Telegram outbound feedback

**Status:** DOING until exact-SHA test evidence and reviewer acceptance. This is not production incident-response authorization certification.

## Scope
- `src/modules/log-alerts/telegram-notifier.ts`: outbound alert wording, generated metadata, bounded transport and redaction; source reviewed without weakening the existing safety boundaries.
- `src/modules/log-alerts/telegram-webhook.ts`: callback response, acknowledgement copy and persistent status updates.

## UX changes
- Acknowledged alerts retain safe generated request IDs, UTC timestamps and deploy identifiers. Previously these were scrubbed on callback edits despite being retained in the initial message, making incident triage harder.
- Re-sanitize every line from the Telegram callback before echoing it, protecting credentials, email addresses and personal data.
- Keep exactly one clear `✅ Acknowledged` suffix when the callback is delivered again, and reserve suffix space with Unicode code-point-aware truncation.
- Preserve allowlisted operator ID, bound chat, signed webhook, canonical UUID, production-only and persisted-incident checks; leave all database update/idempotency behavior intact.

## Evidence (in progress)
- Implementation commit: `7e17b0a82d994718e2a878a106f1a9c09d2be8c8`.
- Tests: `tests/unit/graceful-telegram-webhook.test.ts` (commit `3ac76be97f6b073c22cf1aa36a19fd83746bdaf5`), covering no PII echo, preserved diagnostic fields, duplicate callbacks and Unicode bounds.
- Existing focused path workflow: `.github/workflows/security-telegram-acknowledgement.yml`. It runs Vitest acknowledgement and authorization cases plus TypeScript at a pinned checkout; its queued conclusion must be checked.
- Complete review still requires provider transport regression and real rendered-copy / consumer evidence where available. Do not mark DONE or infer production provider connectivity from tests alone.
