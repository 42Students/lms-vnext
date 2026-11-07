# UX-G176 · Log-alert Telegram outbound feedback

**Status:** DONE — scoped Telegram alert copy and acknowledgement UX acceptance (2026-11-08). This is not production incident-response authorization certification.

## Scope
- `src/modules/log-alerts/telegram-notifier.ts`: outbound alert wording, generated metadata, bounded transport and redaction; source reviewed without weakening the existing safety boundaries.
- `src/modules/log-alerts/telegram-webhook.ts`: callback response, acknowledgement copy and persistent status updates.

## UX changes
- Acknowledged alerts retain safe generated request IDs, UTC timestamps and deploy identifiers. Previously these were scrubbed on callback edits despite being retained in the initial message, making incident triage harder.
- Re-sanitize every line from the Telegram callback before echoing it, protecting credentials, email addresses and personal data.
- Keep exactly one clear `✅ Acknowledged` suffix when the callback is delivered again, and reserve suffix space with Unicode code-point-aware truncation.
- Preserve allowlisted operator ID, bound chat, signed webhook, canonical UUID, production-only and persisted-incident checks; leave all database update/idempotency behavior intact.

## Evidence and scope
- Implementation commit: `7e17b0a82d994718e2a878a106f1a9c09d2be8c8`.
- Tests: `tests/unit/graceful-telegram-webhook.test.ts` (commit `3ac76be97f6b073c22cf1aa36a19fd83746bdaf5`), covering no PII echo, preserved diagnostic fields, duplicate callbacks and Unicode bounds.
- Existing focused path workflow: `.github/workflows/security-telegram-acknowledgement.yml`. It runs Vitest acknowledgement and authorization cases plus TypeScript at a pinned checkout; its queued conclusion must be checked.
- The injected-transport test verifies consumer-facing Bot API payload rendering and refusal handling. Live provider connectivity and production incident approval are separate operational checks; they are not implied by this UX closure.

## Accepted evidence (2026-11-08)

- [Exact-SHA green workflow](https://github.com/42Students/lms-vnext/actions/runs/42416611424), commit `f06a99eaa8694eb4a80d0c87eb665b6c8028e7cd`: scoped ESLint, 3 Vitest suites / 16 tests, full TypeScript.
- Outbound transport regression added in `tests/unit/graceful-telegram-webhook.test.ts`: verifies the actual injected Bot API payload keeps generated diagnostics, redacts unsafe email, exposes the signed-incident acknowledgement button and fails safely on provider refusal.
- Repeated callbacks, unauthorized operator/chat, invalid signature, Unicode 3500-character limit, acknowledgement idempotence remain regression-covered.
- No live Telegram delivery, production credential connection, or end-to-end incident response certification is claimed. Those remain separate operational gates.
