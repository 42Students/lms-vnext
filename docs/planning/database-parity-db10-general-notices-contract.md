# DB-024 — general TPO notices, APP visibility, undo, digest and delivery intents

**Worker:** Chat 5 · **Phase:** DATABASE · **Status:** SOURCE_REVIEWED / STAGED_UNREGISTERED / DB_NOT_RUN  
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, `V161__tpo_v1_drives.sql`, `V193__recruiter_naming.sql`, `NotificationOutboxEntry.java`, `NotificationOutboxService.java`, `NotificationOutboxRepository.java`. V193 explicitly rewrites stored `recipient_type='HR'` to `RECRUITER`.  
**vNext target:** `src/db/schema/db10-general-notices.draft.ts` and `scripts/sql/db10-general-notices-staging.sql`. No numbered migration or active schema barrel registration. Chat 1 owns both.

## Why this is necessary

DB-012 (Chat 3) is blocked in part because all **13** legacy `notification_outbox` columns lack an accepted new equivalent. The existing `db10-outbound-messages.draft.ts` is an encrypted external recruiter invitation/reminder outbox, with only two template keys and no APP channel, 30-second undo-group semantics or recipient daily digests. It cannot silently substitute for the general outbox.

Legacy APP notices were `SENT` outbox rows polled directly by the frontend. Current vNext has `in_app_notifications` for user-visible APP notices. The proposal separates an **unpublished pending intent** from the final `in_app_notifications` row: only after undo hold expires may a dispatcher transactionally insert an in-app notice. No early visibility, false delivery status or public contact/bearer token fields.

## Exact 13 legacy fields

| Legacy column | Normalized persistence target | Decision |
|---|---|---|
| id | `general_notification_outbox.id` UUID | Greenfield ID, no MySQL identifier migration |
| event | `event` varchar(50) | Keep vocabulary; service maps supported events before dispatch |
| recipient_type | `recipient_type` LEARNER/FACULTY/RECRUITER | V193 renames historical HR to RECRUITER. Not a system role or membership UUID |
| recipient_id | `recipient_user_id` + nullable `recipient_membership_id` | Resolve authenticated role-owned identity to stable vNext user and same-college membership; recruiter requires its own active DB09 grant |
| channel | `channel` APP/EMAIL/SMS | WhatsApp not legacy V161 outbox channel; separate external transport is broader |
| payload_json | `safe_payload_json` JSONB | **Only sanitized, non-secret structured references**. No raw recipient PII, invitation tokens or bearer URLs. External template payload must use the encrypted transport |
| send_after | `send_after` timestamptz | Persist exact release instant; explicit digest timezone `Asia/Kolkata` |
| status | `status` PENDING/CLAIMED/HANDED_OFF/SENT/CANCELLED/FAILED | CLAIMED/HANDED_OFF are explicit redesign to separate claim/provider handoff from actual send. For APP, SENT means published and visible; external HANDOFF is never SENT |
| undo_group_id | `undo_group_id` UUID | Group cancellation only while PENDING, same-college scoped |
| claimed_at | `claimed_at` + `claim_expires_at`, `claimed_by`, `claim_fence` | Fenced lease/claim redesign instead of implicit transaction lock holding external I/O |
| sent_at | `sent_at` | Nonnull only for genuinely SENT, never for queued/provider-accepted |
| failure_reason | `failure_code` + `safe_failure_reason` | Preserve a support-safe explanation up to 500 chars while separating stable machine code; never persist raw provider response, tokens, email or phone |
| created_at | `created_at` timestamptz | Original enqueue timestamp, used for 30-second hold minimum |

Additional fields: organization/college scope, `sourceEventId` FK to the canonical placement `activity_events` row, durable HMAC idempotencyKey, holdForUndo, digestLocalDate/digestTimezone, updatedAt. The HMAC input MUST include `sourceEventId`; event-name + recipient alone is not unique across two real occurrences. A second unique `(source_event_id, recipient_user_id, recipient_type, channel)` constraint prevents duplicate fanout within the same role even if a caller miscomputes the HMAC; distinct LEARNER and FACULTY notices remain possible for a dual-role user. All existing `outbound_messages`, `in_app_notifications`, and scheduling lease tables remain separate.

## Source behavior and intentional deviations

- **30-second Undo:** Source `holdForUndo` queues at current time +30 seconds and `cancelUndoGroup` cancels only PENDING rows. DDL enforces *at least* 30 seconds for flagged rows. Both APP and external delivery must wait until hold is over. If already claimed/handed-off, do not display false Undo success; product workflow must return a truthful cannot-revoke response.
- **Immediate actions:** Cascading offer release/accept/cancel/close use preview/confirm and may enqueue immediately; no automatic 30s delay unless the producer flags `holdForUndo`. `undo_group_id` without the flag is not sufficient to assume hold.
- **Digest:** Legacy `APPLICATION_STATUS_CHANGED`, `NUDGE`, `PREP_ASSIGNED`, `NOW_INELIGIBLE` get recipient-grouped next 08:00 EMAIL digest. A `digestLocalDate` and `Asia/Kolkata` timezone are staged, but the scheduler/writer must map recipient local clock and group once per recipient+college+day, not one email per row.
- **Channels:** APP remains a delayed transactional projection into `in_app_notifications`; EMAIL/SMS must pass through existing encrypted `outbound_messages` with independent suppression, provider idempotency and DLT. The initial encrypted outbound draft only recognizes recruiter invitation keys. Integration must expand approved event/template vocabulary and hold a durable source-event mapping; do not enable until proven. HANDOFF is distinct from delivery.
- **Event switches/SMS caps:** Legacy `OPTIONAL_EVENT_SWITCH`, `EXTRA_CHANNELS`, `DIGEST_EVENTS` and four always-on SMS classes must be inventoried, mapped and applied to a persistent per-college policy. Source monthly optional-SMS cap defaults to 500; zero allowance does not suppress always-on notices. Schema alone does not implement it.
- **Scoped identity:** Learner/faculty notices stage FK to `college_memberships`; SQL trigger checks membership user, college, ACTIVE status **and matching membership role** against the referenced college/org. The `source_event_id` must also be a `PLACEMENTS` activity event in the same organization/college. Recruiters are **fail closed in the draft trigger** until DB09 active recruiter grant/profile/college scope is linked to a concrete invariant. A raw legacy role-specific `recipient_id` is not safely cast to `users.id`. Users with several account memberships may not get cross-college notices by accident.
- **Claim audit:** `claimed_at` is retained after a row leaves CLAIMED; only the live lease owner/expiry fields clear. This preserves the legacy source field as durable audit evidence while fencing stale workers.
- **Known limitation:** Parent edits could invalidate scope after insert; update restrictions/immutable parent scope, role revisions, revoked membership/grant dispatch checks, plus provider recheck are mandatory before activation. The trigger only protects inserted/updated rows, not all future parent changes.

## Acceptance witnesses — ALL NOT_RUN

- **DB24-01:** inserting a notice with mismatched organization-college, source-event scope, learner/faculty user-membership-college, or membership role fails directly in PostgreSQL.
- **DB24-02:** recruiter recipient write fails closed until the exact recruiter grant guard has been registered and tested.
- **DB24-03:** `hold_for_undo=true` with absent undoGroupId or sendAfter less than createdAt+30 seconds fails. Immediate unflagged notices remain allowed.
- **DB24-04:** canceling a pending undo group affects only matching pending rows in the same college; a claimed or already handed-off row is not falsely canceled.
- **DB24-05:** two workers racing on the due set only claim once with a renewed fencing token and never double-publish APP rows.
- **DB24-06:** a pending/claimed APP row is not visible; after release it creates one user-scoped `in_app_notifications` receipt and SENT state atomically.
- **DB24-07:** digest events grouped by college+recipient+local date at next 08:00 Asia/Kolkata produce one external digest receipt, with a safe retries/history rule.
- **DB24-08:** external EMAIL/SMS handoff is encrypted and idempotent, distinct from delivered/sent; suppression and membership/grant are rechecked immediately before external dispatch.
- **DB24-09:** invalid channel, event, idempotency digest, status/claimed/sent shape and mismatched optional digest time zone fail SQL checks.
- **DB24-10:** same **source event**/recipient/channel enqueue retry does not add a second logical notice; a later occurrence with the same event name gets a different sourceEventId and must not be collapsed. Changed payload under the same logical idempotency key is rejected, never silently reused.
- **DB24-11:** no raw token, email, phone, provider error payload or secret appears in `safe_payload_json`, audit metadata, exception/log or client notice.
- **DB24-12:** fresh numbered Drizzle replay, schema snapshot/catalog drift, tenant, race and app notification producer→consumer lifecycle pass against a disposable PostgreSQL instance.

## Handoff and evidence

This is a **DATABASE-only staging batch**, not a running provider or API implementation. No PostgreSQL, Node test, lint, typecheck, build, E2E or provider send has been executed. GitHub Actions is **intentionally unavailable due to billing and is not a blocker**; run acceptance on any approved independent environment and record real logs.

**Chat 1:** review dependent table DDL and DB09 recruiter access contract; register this isolated table/trigger in the sole numbered migration journal with schema barrel and snapshots, then run clean PostgreSQL replay. **Chat 3 / DB-012:** use this as candidate mapping evidence for 13 legacy fields, NOT semantic verification; the earlier 13 BLOCKED DB09 outbox fields remain blocked until producers, consumer, grant guard, digests, hold, external handoff and actual negative tests pass. **Chat 5:** continue with independent peer audit or a separate eligible task, keeping DB-024 `COMPLETED` only after all four source/test artifacts are committed. Do not call `DONE_VERIFIED` without executed acceptance.
