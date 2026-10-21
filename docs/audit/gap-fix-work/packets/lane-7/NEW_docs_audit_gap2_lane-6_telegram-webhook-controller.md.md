# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/telegram-webhook-controller.md

6 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/telegram-webhook-controller.md

## G2-6-024-005  [P1] GAP  facet F03  effort M
- Legacy: Legacy successful acknowledgment edits original Telegram message with appended ✅ Acknowledged (TelegramWebhookController.java:53-60).
- vNext now: vNext replies via answerCallbackQuery only, original message not edited (telegram-webhook.ts:35-51,54-65).
- Fix: Add editMessageText or equivalent visible acknowledgment state and remove active button to avoid repeated clicks.

## G2-6-024-020  [P1] GAP  facet F10  effort M
- Legacy: Legacy for ack: invokes acknowledgeCallback with chat/message IDs and original text + ✅ Acknowledged (TelegramWebhookController.java:58-60).
- vNext now: vNext updates log_alert_signatures.acknowledged_at by UUID then calls answerCallbackQuery (telegram-webhook.ts:54-65).
- Fix: Persist state AND edit original message, keeping provider update consistent with durable triage.

## G2-6-024-049  [P1] GAP  facet F23  effort M
- Legacy: Legacy edits original alert body and accepts other callback types for no-edit answer (TelegramWebhookController.java:58-63).
- vNext now: vNext drops both behaviors (telegram-webhook.ts:8-18,35-65).
- Fix: Restore durable visible original-message acknowledgment and answer unknown-but-authentic callbacks.

## G2-6-024-015  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid body null returns HTTP200 (TelegramWebhookController.java:46-48).
- vNext now: vNext 400 for no body or malformed JSON (webhooks/telegram/route.ts:23-25,43-46).
- Fix: Align intended provider retry semantics and document intentionally stricter validation.

## G2-6-024-016  [P2] GAP  facet F08  effort M
- Legacy: Legacy answerCallbackQuery posts acknowledgment but does not include text, then edits message (TelegramNotifierService.java:155-169).
- vNext now: vNext answerCallbackQuery includes text Acknowledged; does not edit (telegram-webhook.ts:35-46).
- Fix: Clone both ephemeral acknowledgment and durable original-message text update.

## G2-6-024-017  [P2] GAP  facet F08  effort M
- Legacy: Legacy no success toast displayed in app; Telegram client gets edited message (TelegramWebhookController.java:58-65).
- vNext now: vNext no in-app toast and provider ack text via API (telegram-webhook.ts:35-51).
- Fix: Ensure Telegram confirmation remains visible after callback, not only transient popup.
