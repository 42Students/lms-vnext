# DB10 Admin Audit → Activity Events parity handoff

**Date:** 2026-10-10  
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**vNext state:** existing registered `activity_events` + W06 detail consumer; source-reviewed, **not field-verified**.

## 13-field reconciliation

| Legacy | vNext proposal / disposition |
|---|---|
| id | `activity_events.id` UUID |
| actor_user_id | `actor_user_id` canonical UUID |
| actor_user_type | **GAP:** historical role/type snapshot not persisted; proposed metadata snapshot |
| actor_contact_mobile | privacy redesign: resolve canonical actor at read time; do not duplicate/display mobile |
| action_key | `event_type` namespaced taxonomy |
| entity_type | `subject_type` |
| entity_id | `subject_id` text, no legacy 60-char truncation |
| organization_id | `organization_id` |
| college_id | `college_id` |
| ip_address | **GAP:** request network context not currently persisted |
| user_agent | **GAP:** request User-Agent not currently persisted |
| payload_json | `metadata` JSONB; sanitized before detail rendering |
| created_at | `occurred_at` timestamptz |

## Functional parity staged

- Existing `/activity` already has tenant-bound keyset paging, module/importance/action/entity/actor/date filters and meaningful-event grouping.
- W06 added full Asia/Kolkata date-only semantics.
- W06 adds `/activity/[eventId]` drill-in with event identity, actor, entity, scope, occurrence and sanitized structured context.
- Out-of-scope event IDs are returned as not-found to avoid cross-tenant enumeration.
- Metadata browser projection redacts password/token/authorization/cookie/private/API keys plus Aadhaar/PAN/passport-like keys and bounds depth/array/string sizes.

## Deliberate differences / remaining gaps

1. Legacy copied actor mobile into the audit row. vNext does not duplicate that PII and does not render mobile in activity detail.
2. Historical actor role/type is not persisted. Looking at the actor's **current** role is not equivalent and must not be called parity.
3. Request IP and User-Agent are not persisted by `recordActivityEvent`; W01/W06 need a privacy-retention decision before adding request context.
4. Legacy category chips (`important/setup/people/teaching/projects`) are not yet an exact vNext filter contract; module/importance filters are available but not labeled equivalent.
5. Producer coverage across every mutation is not proven. An activity UI cannot compensate for missing event producers.

## Evidence authored, not executed

- `tests/unit/activity-metadata-sanitizer.test.ts`
- `tests/integration/db10-activity-detail.test.ts`
- prior activity date, grouping, tenant tests

No row moves to VERIFIED until producer inventory, DB tests and browser scope checks pass.
