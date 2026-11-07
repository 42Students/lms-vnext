# SEC-15 integrations, webhooks and third-party services: assessment (2026-11-08)

Method: code read, secret scan of the registry against `process.env` reads, dev probes. Nothing VERIFIED.

| Area | Finding | Proposed state |
|---|---|---|
| Inbound machine endpoints | `/api/internal/inbound-mail`, `/placements/recruiter-message-inbound`, `/storage/scan-verdict` verify an HMAC or shared secret over the raw body in the handler (constant time, secret length checked), refuse browser `Origin`, bounded body. The central `webhookRoute()` (signature, timestamp tolerance, replay claim) exists but **no route uses it yet** | PARTIAL |
| Replay | The signatures cover the body but not a timestamp, so a captured request can be re-sent. Inbound mail is idempotent (`providerMessageId` conflict returns `replayed: true`); scan verdicts are bound to file id, college and generation | PARTIAL: move the three routes onto `webhookRoute()` when the provider contract allows a signed timestamp |
| Secrets known to the registry | 21 (18 plus the three inbound/reply secrets added 2026-11-08, optional in production, validated when present) | IMPLEMENTED_UNVERIFIED |
| Secrets read in code but not validated | Provider credentials (`EXOTEL_*`, `ZEPTOMAIL_*` and template keys, `R2_*`, `TELEGRAM_ALERT_BOT_TOKEN`, `GCS_VIDEO_PRIVATE_KEY`, `MENTOR_GOOGLE_CLIENT_SECRET`, `AUDIT_FINDINGS_GITHUB_*`), plus `RECRUITER_MESSAGE_INBOUND_HMAC_PREVIOUS_*` (rotation overlap exists for that one secret) and the E2E secrets (dev only) | GAP: add format checks for provider keys |
| Secret reuse | `companyShareAccessProof` signs with `AUTH_SECRET` (falls back to `NEXTAUTH_SECRET`): the session-signing secret is also used for company share access proofs, so one leak breaks both | GAP: give it its own registry secret |
| Provider status | ZeptoMail token revoked by the owner (no email until replaced); Exotel and R2 keys are the legacy ones; Telegram alerts configured | owner items 2 and 3 in OWNER-ACTIONS.md |
| Outbound calls | Providers are called server-side only; the browser CSP `connect-src 'self'` stops the client talking to them | IMPLEMENTED_UNVERIFIED |
| Webhook exposure | The inbound routes are reachable from the internet (ingress is host-based, not path-based) and protected by their signatures | PARTIAL (ingress path block, owner item 11) |
