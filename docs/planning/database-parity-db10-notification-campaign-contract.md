# DB-043 — legacy notification broadcast, scheduled release and recipient receipts

**Worker:** Chat 5 · **Global phase:** DATABASE · **Branch:** `main` · **Status:** SOURCE_REVIEWED / STAGED_UNREGISTERED / RUNTIME_NOT_VERIFIED  
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Evidence:** `Notification.java`, `NotificationDTO.java`, `NotificationResponseDTO.java`, `NotificationServiceImpl.java`, `NotificationRepository.java`  
**Artifacts:** `docs/planning/database-parity-db10-notification-campaign-field-map.json` (21 rows); `scripts/sql/db10-notification-campaign-staging.sql` (unregistered); `tests/db10-notification-campaign-staging.test.mjs` (static guards, authored).

## Decision: a broadcast is not a delivered inbox message

The registered vNext `activity_events` + `in_app_notifications` have a durable **per-recipient** model with `in_app_notifications.user_id NOT NULL`, `read_at`, and `UNIQUE(user_id,event_id)`. This is appropriate for delivered receipts and repairs a genuine legacy defect: `notification.is_read` was a shared boolean on a single class broadcast and cannot represent individual learner read state.

But the pinned legacy `notification` table also persists **authoring/scheduling/audience state**, not merely recipient messages. It has `class_id` (including zero), `course_id`, optional `learner_id`, `creator_faculty_id`, `scheduled_at`, `delivery_status`, `delivery_error`, `delivered_at` and soft-delete/edit timestamps. Recipient-only vNext notifications cannot recreate admin draft/resend/recycle/schedule features merely by mapping all rows into `in_app_notifications`.

The staged additive model creates `notification_campaigns` for **college-scoped authoring and scheduled publication**, referencing a canonical `activity_events` source event. On successful release the domain producer transaction publishes one `in_app_notifications` row for each **currently authorized** recipient. The receipt row is already registered; no duplicate broadcast-level read-state field is added.

**Important:** This is NOT a substitute for DB-024 `general_notification_outbox` (TPO event undo, digest, external handoff). It is NOT a template registry (DB-037) or an email/SMS provider queue. No legacy data is being migrated.

## Pinned executable behavior that cannot disappear

1. `NotificationServiceImpl.ensureNotificationType` actively defaults a null non-course type to `GENERAL`; `GENERAL` must remain accepted alongside explicit `JOB`, `COURSE` and `SYSTEM` producer types.
2. The normal legacy `NotificationServiceImpl.save` accepts optional `scheduledAt`. Only a **future** time marks a row `SCHEDULED`; otherwise it sets `SENT`, records `deliveredAt`, and may publish SSE immediately.
3. `NotificationRepository.findDueScheduled` selects only due, non-deleted `SCHEDULED` rows. The learner recipient queries filter out future `scheduled_at`; admin queries may view scheduled rows.
4. A positive `class_id` targets a section/class. `class_id = 0` plus `course_id` is **course-wide**, not an unknown UUID or the absence of an audience. `learner_id` was overloaded as a learner/faculty/mentor recipient ID: it must become authenticated `users.id` with appropriate college membership/grant checks.
5. A combined positive class/course identifies the related section delivery and must not allow arbitrary cross-college or unrelated course+section IDs.
6. Broadcast `is_read` was shared for all learners; the legacy service protects against changing that boolean for broadcasts. vNext must keep `read_at` per recipient and expose an authored campaign admin view separately from the learner feed.
7. Direct `notification.assessment_url` allowed any `http://` or `https://` destination. That is **not a safe browser redirect** and could embed private bearer links. vNext must use reviewed, internal action paths and a server-side ownership-checked assessment destination; this is an explicit security redesign.
8. For HTML authoring legacy sanitized incoming HTML with Jsoup rules. vNext currently bounds plaintext receipt body and a safe action path; full rich HTML parity requires a separate approved trusted renderer or a documented sanitized, safe redesign. Do not silently render arbitrary untrusted HTML.
9. Admin update and soft delete/recycle are distinct from deleting already-delivered personalized notices. `created_at`, `updated_at`, and actor history cannot be inferred from recipient `read_at` or `created_at`.

## All 21 physical fields accounted for

The JSON field map carries the legacy type/nullability/risk and explicit new target for **each** column:

| Family | Columns | Proposed owner |
| --- | --- | --- |
| Identity and editing | `id`, `created_at`, `updated_at`, `is_deleted`, `creator_faculty_id` | Campaign UUID, creation/update/archive, server-verified creator college membership |
| Audience | `class_id`, `course_id`, `learner_id` | Typed `SECTION`, `COURSE`, `SECTION_COURSE`, `USER` campaign target (exactly one shape), never legacy integer-as-UUID |
| Recipient receipt | `is_read` | Existing `in_app_notifications.read_at` **per user** |
| Content and category | `message`, `title`, `context_label`, `notification_type` | Campaign author source; safe per-user receipt and typed event/module |
| Deep links | `application_id`, `job_id`, `assessment_url`, `interview_id` | Typed, scope-checked subject/action route; external assessment URL not copied verbatim |
| Scheduling and delivery | `scheduled_at`, `delivery_status`, `delivery_error`, `delivered_at` | Campaign schedule/status/safe failure code/actual publication time; no implied external provider delivery |

**Count:** 21/21 **source-dispositioned**; 0/21 runtime-semantic verified. All proposed stage columns remain **UNREGISTERED** and their API writers **NOT IMPLEMENTED** in this batch. Do not update global DB10 221-field ledger while DB-040 owns that file; reconcile its 21 notification rows after DB-040 release.

## Isolated SQL stage and invariants

`scripts/sql/db10-notification-campaign-staging.sql` stages `notification_campaigns` with:

- FK to `organizations`/`colleges`, `activity_events`, optional server-verified creator `college_memberships`, courses/sections and user;
- exact audience shape CHECK: user, section, course, or combined section+course;
- source-event college/org scope check and college check for section/course/creator/recipient; paired section/course must have an active delivery;
- bounded content, internal-path-only action href, explicit lifecycle states and publication/fenced-claim metadata;
- due-work index for `SCHEDULED`/`FAILED` and tenant/admin query indexes.

**Caution:** Source parent scope guard triggers do not prove parent reparenting cannot invalidate a campaign later. A privileged SQL writer can also fabricate a lifecycle transition unless tighter producer privileges are enforced. The draft must not be integrated as production-ready merely because its CHECK constraints compile.

### Race and correctness protocol before activation

- Admin creates an `activity_events` row plus campaign in one transaction and authorizes creator/college from a persisted request context. Legacy client `creatorFacultyId` is ignored.
- A worker atomically claims due work with `FOR UPDATE SKIP LOCKED`/fencing and a bounded lease, and **revalidates recipient college membership, role, program/section/course entitlement, campaign state and deletion** before fanout. A revoked recipient is omitted.
- The same database transaction writes `in_app_notifications` per recipient with `ON CONFLICT (user_id,event_id) DO NOTHING` and changes campaign to `PUBLISHED`, stamps `published_at`, clears the claim and records truthful outcome. If fanout fails, rollback means no partial publish/no false state.
- The existing vNext per-user inbox only queries `in_app_notifications`; scheduled campaigns remain invisible until this transaction. No SSE is broadcast for an undispatched campaign.
- Retries must be idempotent, including crash-after-commit. Claims must be fenced, not merely time-checked, and must not silently duplicate the same recipient receipt. Bulk audience expansion should be bounded/processed without leaking other tenant recipients.
- The claim protocol above is specified but **not implemented or verified** by this SQL-only stage; no activation flag is set.

### Time correctness

Legacy `LocalDateTime` has no attached zone. VNext should accept IANA timezone, normalize to UTC `timestamptz`, and define deterministic DST ambiguity/nonexistent-time behavior (e.g., reject ambiguous local input without explicit offset). Do not quietly replace a scheduled Indian local time with UTC wall clock or strip an ISO `Z`.

## PostgreSQL acceptance — ALL NOT_RUN

| ID | Required executable witness |
| --- | --- |
| DB43-01 | Fresh migration registration after Chat 1 collision/ordering review, journal snapshot/typecheck parity |
| DB43-02 | Correct `USER`, `SECTION`, `COURSE`, `SECTION_COURSE` audience shape; invalid mixed targets rejected |
| DB43-03 | Direct SQL same-college vs foreign college course, section, user, creator and event FK negative cases |
| DB43-04 | `SECTION_COURSE` rejects a course without an active section delivery |
| DB43-05 | Legacy class=0, course positive is course audience; no fake UUID zero |
| DB43-06 | SCHEDULED campaign does not appear in `in_app_notifications` until publisher commit |
| DB43-07 | Two workers racing release publish each user/event at most once; no double SSE |
| DB43-08 | Publisher failure midway rolls back all recipient fanout and publication status |
| DB43-09 | Recipient enrollment/college grant revoked after schedule and before publish is skipped |
| DB43-10 | Concurrent archived/deleted course or section cannot leak a released notice |
| DB43-11 | Per-user `read_at` changes cannot affect another recipient in the same campaign |
| DB43-12 | Repeated release after crash yields idempotent existing receipts, no silent false FAILED/PUBLISHED |
| DB43-13 | `DRAFT`, `SCHEDULED`, `PUBLISHING`, `PUBLISHED`, `FAILED`, `CANCELLED` transitions and claims are version/fence-safe |
| DB43-14 | Delete/archive before due cancels release; already published receipts follow explicit retention policy |
| DB43-15 | Client-forged creator, recipient, organization or college is rejected despite valid parent IDs |
| DB43-16 | External assessment URLs, path traversal and secret-bearing hrefs cannot be published as unreviewed client action links |
| DB43-17 | No provider email/SMS send is implied by campaign `PUBLISHED`; DB24/outbound layers remain separate |
| DB43-18 | Timezone and DST schedules preserve intended local-time release |
| DB43-19 | Admin tenant history and per-user inbox match legacy capabilities while preserving data isolation |
| DB43-20 | All 21 fields receive DB19 final accepted disposition after integration, without claiming authored-but-unexecuted test results |

**Chat 1:** the only registered Drizzle migration/journal/schema barrel owner. Review actual schema column types, parent scope races, delivery coupling, batch fanout concurrency and DB10 collision before registration. **Chat 5:** isolated stage and static guards only. **Chat 4/6:** course/section scheduling and classroom visibility consumers have dependencies; treat this as DB contract, not an API/UI phase advance.

**CI policy:** GitHub Actions is stopped because of billing and is **not** a blocker. Independent Node/disposable PostgreSQL acceptance still requires real executed commands/logs. Neither drafted SQL nor source-text checks certify DATABASE or release.
