# DB09 legacy notification outbox compatibility contract

**Status:** STAGED REDESIGN — no registered migration or runtime proof  
**Worker:** Chat 3 / DB-012  
**Date:** 2026-10-11  
**Legacy source:** `notification_outbox` from V161 + current `NotificationOutboxService`

The legacy placement outbox is broader than the current DB10 external-delivery draft. It persists APP/EMAIL/SMS, arbitrary placement events, undo-delay groups, digest scheduling, claim/send/failure state and final `RECRUITER` recipient naming.

Do not widen `outbound_messages` into a plaintext generic notification table. Preserve its encrypted external-delivery purpose and add a normalized notification-intent layer.

## Canonical redesign

### notification_delivery_intents

One immutable-ish delivery intent per event + recipient + channel:

- tenant: organization + college;
- source event id when an `activity_events` row exists;
- event key such as `ROUND_SCHEDULED`, `OFFER_RELEASED`, `NUDGE`, `PREP_ASSIGNED`;
- recipient canonical user plus audience type `LEARNER|RECRUITER|FACULTY`;
- channel `APP|EMAIL|SMS|WHATSAPP`;
- `not_before` for undo hold/digest timing;
- optional cancellation-group UUID;
- lifecycle `PENDING|CANCELLED|MATERIALIZED|SENT|FAILED`;
- safe failure code only;
- timestamps and optimistic version/fence.

Payload rules:

- APP-safe title/body/action href are materialized into `in_app_notifications`;
- EMAIL/SMS/WHATSAPP secret merge data/contact details are encrypted in the existing `outbound_messages` child;
- do not persist raw email/phone in the intent;
- arbitrary source `payload_json` is not copied blindly. Split into safe event metadata and encrypted delivery material.

### notification_cancellation_groups

Optional explicit group keyed by UUID:

- tenant scope;
- state `OPEN|CANCELLED|EXPIRED`;
- cancellation timestamp/actor;
- all still-PENDING intents in a cancelled group become ineligible for materialization.

This preserves the legacy 30-second undo semantics without forcing cancellation concerns into the encrypted provider-delivery row.

## Field disposition

Legacy `notification_outbox` maps as:

- `id` -> intent UUID;
- `event` -> intent event_key / source activity event type;
- `recipient_type` -> normalized audience_type; V193 final recruiter value is `RECRUITER`;
- `recipient_id` -> canonical user UUID, never an unscoped integer actor;
- `channel` -> intent channel; APP materializes to `in_app_notifications`, external channels materialize to `outbound_messages`;
- `payload_json` -> safe activity/APP metadata + encrypted external delivery material;
- `send_after` -> intent not_before;
- `status` -> normalized intent lifecycle plus child delivery lifecycle;
- `undo_group_id` -> cancellation_group_id;
- `claimed_at` -> external child claim lease; APP materialization uses transactional insertion/idempotency, not a fake claim timestamp;
- `sent_at` -> APP materialized_at or external provider/delivery timestamp;
- `failure_reason` -> safe failure code only;
- `created_at` -> intent created_at.

## Required invariants / witnesses

1. same tenant required across intent, cancellation group and source event;
2. recipient user must have valid tenant/role semantics at enqueue/materialization time;
3. cancelled group cannot materialize any new APP or external child;
4. cancelling after an intent is SENT cannot erase delivery history;
5. unique idempotency prevents duplicate materialization under concurrent workers;
6. APP events create exactly one in-app notification;
7. external events create exactly one encrypted outbound row;
8. raw contact data or secret merge payload never appears in intent/event metadata;
9. final recruiter audience code is `RECRUITER`, never `HR`;
10. digest scheduling preserves the requested `not_before`;
11. claim lease/fence races on external delivery cannot double-send;
12. empty-database migration replay + direct-SQL tenant negative tests pass.

This redesign is enough to remove the DB09 *mapping ambiguity* for the 13 legacy fields, but DB-012 remains blocked until Chat 1/DB10 integrates the approved migration and PostgreSQL witnesses execute.
