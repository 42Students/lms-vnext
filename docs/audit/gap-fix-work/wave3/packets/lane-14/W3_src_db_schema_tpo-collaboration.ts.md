# Work packet (wave 3): edit src/db/schema/tpo-collaboration.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-19-031-021  [P1] MISSING  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:92-123` — Legacy change-request event carries field, proposed/current, status and reply.
- vNext now: `src/db/schema/tpo-collaboration.ts:71-104` — New message schema lacks event and changeRequest relation.
- Fix: Persist typed EVENT with scoped request FK and render quote/card.

## G2-19-031-090  [P1] MISSING  facet F15  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:21-30` — 15min unread wait plus 2min quiet, max one email per conversation/6h, last three.
- vNext now: `src/db/schema/tpo-collaboration.ts:34-104` — New message/thread schema has no emailedAt/reply token fields.
- Fix: Implement claim/queue with last-three payload and throttle.

## G2-19-031-091  [P1] MISSING  facet F15  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:46-56` — Cloudflare inbound replies use per-environment reply tag and token.
- vNext now: `src/db/schema/tpo-collaboration.ts:34-104` — New thread lacks reply token/via field.
- Fix: Add secure inbound webhook, token mapping, via=EMAIL.

## G2-19-031-119  [P1] MISSING  facet F20  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:100-119` — Email sender atomically claims 6h window and releases failed claim.
- vNext now: `src/db/schema/tpo-collaboration.ts:34-104` — No recruiter_emailed_at modeled.
- Fix: Implement transactional email claim and retry.

## G2-19-031-124  [P1] MISSING  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:46-56` — Cloudflare inbound email routing tag r/rdev.
- vNext now: `src/db/schema/tpo-collaboration.ts:34-104` — New thread has no transport token.
- Fix: Provide safe inbound email webhook/parser and token.

## G2-19-031-125  [P1] MISSING  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:115-116` — Recruiter-message email template carries reply-to.
- vNext now: `src/db/schema/tpo-collaboration.ts:34-104` — No email template binding persisted on thread.
- Fix: Wire template with three unread and reply address.
