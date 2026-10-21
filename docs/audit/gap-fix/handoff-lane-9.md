# Lane chat-9 — Cross-file and operational handoffs

- OPERATIONS | G2-14-012-028, G2-14-012-053 | Revoke/rotate credential embedded in legacy ZeptoMail Java history, replace deployed ZEPTOMAIL_TOKEN in secret store, and review Git history; never copy the old value into docs/logs.
- src/modules/messaging/providers.ts | G2-13-011-002, G2-13-011-007, G2-14-012-002, G2-14-012-041 | Convert existing campaign/TPO mail sender to sendZeptoMailTemplate with template purpose and typed safe result when its provider packet is processed; retain SMS behavior.
- src/modules/placements/recruiter-message-email-provider.ts | G2-18-010-005, G2-18-010-007, G2-4-033-025 | Existing recruiter digest still POSTs directly; apply per-college verified sender name, permitted recruitment From and reply address via shared adapter when placement owner modifies this file.
- OUTBOX owner/integration | G2-14-012-035, G2-14-012-050 | Add durable delivery state and provider-confirmed idempotency before permitting retries after ambiguous ZeptoMail POST timeouts. Never blindly retry an unconfirmed send.
