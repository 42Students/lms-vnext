# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/telegram-webhook-controller.md

14 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/telegram-webhook-controller.md

## G2-6-024-006  [P2] GAP  facet F04  effort M
- Legacy: Legacy callback reads callback_query.data, id, chat.id, message_id, original text (TelegramWebhookController.java:49-56).
- vNext now: vNext Zod requires callback_query id/data/chat.id only, omits message_id and text (telegram-webhook.ts:8-18).
- Fix: Capture optional message ID/text for original-message acknowledgment display, subject to safe maximum lengths.

## G2-6-024-007  [P2] GAP  facet F04  effort M
- Legacy: Legacy callback data may be any ack:-prefixed text (TelegramWebhookController.java:58-63).
- vNext now: vNext requires ack: followed by UUID 36 chars (telegram-webhook.ts:10-12).
- Fix: Document callback ref mapping and safely reject legacy non-UUID IDs or provide compatibility.

## G2-6-024-011  [P2] GAP  facet F06  effort S
- Legacy: Legacy accepts optional @RequestBody JsonNode, missing body returns 200 (TelegramWebhookController.java:40-48).
- vNext now: vNext requires body reader and JSON parse, missing/malformed returns 400 (webhooks/telegram/route.ts:21-46).
- Fix: Decide tolerant missing body vs strict 400; document external Telegram behavior and test retries.

## G2-6-024-021  [P2] GAP  facet F10  effort M
- Legacy: Legacy non-ack callback still answers Telegram without editing (TelegramWebhookController.java:61-63).
- vNext now: vNext schema rejects non-ack callback; returns acknowledged:false, does NOT call answerCallbackQuery (telegram-webhook.ts:10-18,54-65).
- Fix: Answer unknown callback IDs without mutation to dismiss client spinner, only for authenticated chats.

## G2-6-024-026  [P2] GAP  facet F12  effort S
- Legacy: Legacy callback append does not test duplicate acknowledgments (TelegramWebhookController.java:58-60).
- vNext now: vNext update acknowledgedAt unconditionally each repeat with matching id (telegram-webhook.ts:59-64).
- Fix: Only set acknowledgedAt if null; avoid rewriting original acknowledgment timestamp.

## G2-6-024-029  [P2] GAP  facet F13  effort M
- Legacy: Legacy does not report provider API errors to HTTP request (TelegramNotifierService.java:155-186).
- vNext now: vNext callback DB exceptions yield 503 Could not acknowledge this alert (webhooks/telegram/route.ts:47-52).
- Fix: Choose retry vs ack-after-commit policy, guarantee no stale/misleading Telegram confirmation.

## G2-6-024-036  [P2] GAP  facet F18  effort M
- Legacy: Legacy original alert message ends with blank line and ✅ Acknowledged (TelegramWebhookController.java:53-60).
- vNext now: vNext only ephemeral answer text Acknowledged, no edited body (telegram-webhook.ts:35-46).
- Fix: Restore exact literal suffix and line breaks on editMessageText.

## G2-6-024-040  [P2] GAP  facet F20  effort M
- Legacy: Legacy duplicate callbacks append acknowledgment suffix every time; no server idempotency (TelegramWebhookController.java:58-60).
- vNext now: vNext repeat UPDATE overwrites acknowledgedAt (telegram-webhook.ts:59-63).
- Fix: Make repeat callbacks no-op after first acknowledgment and still answer callback query.

## G2-6-024-041  [P2] GAP  facet F20  effort M
- Legacy: Legacy webhook accepts ack:abc123 type arbitrary text (TelegramWebhookController.java:58-60; TelegramWebhookControllerTest.java:67-82).
- vNext now: vNext requires UUID signature id (telegram-webhook.ts:10-12).
- Fix: Use forward-compatible callback signature map; document planned rejection of old button payloads.

## G2-6-024-042  [P2] GAP  facet F21  effort M
- Legacy: Legacy webhook registered by TelegramNotifierService.setWebhook with token (TelegramNotifierService.java:189-205).
- vNext now: vNext requires operator setWebhook with URL and secret as runbook (vnext-telegram-alerting.md:5-10).
- Fix: Document exact registration automation/verification and credential rotation protocol.

## G2-6-024-044  [P2] GAP  facet F21  effort M
- Legacy: Legacy acknowledge edits original message via editMessageText after answer (TelegramNotifierService.java:152-186).
- vNext now: vNext only answerCallbackQuery, no editMessageText (telegram-webhook.ts:35-51).
- Fix: Call editMessageText with safely redacted original content/ack state after successful DB update.

## G2-6-024-004  [P3] GAP  facet F03  effort S
- Legacy: Legacy alert has Acknowledge button configured by notifier in production (TelegramNotifierService.java:82-119).
- vNext now: vNext notifier adds inline keyboard label Acknowledge (telegram-notifier.ts:65-73).
- Fix: Match exact button glyph ✅ Acknowledge if pixel-copy applies to Telegram clients.

## G2-6-024-033  [P3] GAP  facet F15  effort S
- Legacy: Legacy notifier uses ✅ Acknowledge inline button only production (TelegramNotifierService.java:40-49,109-119).
- vNext now: vNext label Acknowledge without check icon, production-only (telegram-notifier.ts:55-73).
- Fix: Match exact Telegram button copy and acknowledge tooltip-like status.

## G2-6-024-037  [P3] GAP  facet F18  effort S
- Legacy: Legacy inline button label ✅ Acknowledge (TelegramNotifierService.java:109-113).
- vNext now: vNext label Acknowledge (telegram-notifier.ts:65-73).
- Fix: Restore emoji for copy parity if supported by Telegram clients.
