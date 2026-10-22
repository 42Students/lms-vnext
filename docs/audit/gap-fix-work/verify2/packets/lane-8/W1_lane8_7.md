# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-024-024 [P1] GAP facet F06
- Files: src/components/electives/college-slot-manager.tsx
- Legacy: Legacy edit can change semester,year only before membership history (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:167-207`)
- Expected fix: Allow eligible pre-allocation academic identity edit with version checks, lock only after history.

## G2-4-024-026 [P1] GAP facet F06
- Files: src/modules/electives/service.ts
- Legacy: Legacy capacity nullable unlimited; rejects explicit capacity below 1 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:306-317`)
- Expected fix: Support unlimited null with appropriate group capacity semantics.

## G2-4-024-069 [P1] GAP facet F20
- Files: src/modules/electives/college-slot-mutation-service.ts
- Legacy: Legacy removed members preserve history and lock state for selection rules (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:177-212,575-589`)
- Expected fix: Use immutable lms_group_member_events to detect historical picks before changing limits.

## G2-4-024-076 [P1] GAP facet F23
- Files: src/components/electives/college-slot-manager.tsx, src/modules/electives/service.ts
- Legacy: Legacy semester/year editable until historical membership, and unlimited-capacity offerings (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:177-212,306-317`)
- Expected fix: Restore valid legacy controls or mark intentional loss explicitly.

## G2-12-010-001 [P1] GAP facet F01
- Files: src/modules/placements/learner-placement-event-delivery.ts
- Legacy: Legacy background helper called by job status mutation paths; @Async accepts numeric application ID + new status `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:47-62`
- Expected fix: Replace every legacy status transition caller with recorded in-transaction event producer; verify no missed transitions.

## G2-12-010-010 [P1] GAP facet F05
- Files: src/modules/placements/learner-placement-event-delivery.ts
- Legacy: Legacy helper uses latest non-CANCELLED interview by scheduledDate (fallback LocalDateTime.MIN) `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:190-194`
- Expected fix: Bind notice to correct persisted round/slot; use deterministic latest selection if only application available.

## G2-12-010-015 [P1] GAP facet F07
- Files: src/modules/placements/learner-placement-event-delivery.ts
- Legacy: Exceptions logged and swallowed, never block status transition `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:136-143`
- Expected fix: Decide atomic outbox vs best-effort policy explicitly; avoid losing valid mutation due to notification error.

## G2-12-010-020 [P1] MISSING facet F10
- Files: src/modules/placements/learner-placement-event-delivery.ts
- Legacy: Legacy dispatches via central event channels email/SMS/in-app `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:121-138`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:53-169`
- Expected fix: Bind approved email/SMS channels to durable outbox with consent and DLT; don't claim sent before dispatch.

## G2-12-010-021 [P1] GAP facet F10
- Files: src/modules/placements/learner-placement-event-delivery.ts
- Legacy: Legacy @Async method refetches after committed batch mutation `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:47-61`
- Expected fix: Specify commit-time/send order and retry/idempotency for bulk applications.

## G2-12-010-030 [P1] MISSING facet F15
- Files: src/modules/placements/learner-placement-event-delivery.ts
- Legacy: Legacy SMS event registry APPLIED, SHORTLISTED, INTERVIEW, REJECTED etc `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:61-70`
- Expected fix: Enumerate each event and ensure DLT-approved SMS trigger or documented intentional removal.

## G2-12-010-031 [P1] GAP facet F15
- Files: src/modules/placements/learner-placement-event-delivery.ts
- Legacy: Legacy email only for interview-scheduled/reminder/confirmed plus system events `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:42-59`
- Expected fix: Apply narrowed urgent-email policy in durable sender and preserve operator-readable skipped reason.

## G2-12-010-041 [P1] GAP facet F21
- Files: src/modules/placements/learner-placement-event-delivery.ts, src/modules/operations/outbound-delivery-queue.ts
- Legacy: Legacy helper calls dispatcher, context resolver and optional interview and preferences repositories `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:32-45`
- Expected fix: Document per-status integration producer, worker, dispatcher and idempotency closure.

## G2-4-027-002 [P1] GAP facet F01
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: GET `/fetch` returns all tenant-scoped halls, Super Admin org/global support (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:83-108`)
- Expected fix: Preserve scoped org/all discovery for authorized SA or document deliberate restriction.

## G2-4-027-038 [P1] GAP facet F10
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: GET all reads per principal college/org/global (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:83-108`)
- Expected fix: Enable authorized org/global reads or explicit migration decision.

## G2-4-027-046 [P1] GAP facet F12
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: Delete blocked if any scheduled classes (past included) (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:144-153`)
- Expected fix: Decide full-history delete vs active-only archive; no silent loss of historical schedule.

## G2-4-027-072 [P1] GAP facet F23
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: Org-scoped/global SA can list halls and `/fetch` GET (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:89-108`)
- Expected fix: Owner decides safe SA global listing or keep deliberate tighter scope.

## G2-4-028-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/tpo/team/page.tsx
- Legacy: /tpo/team is a redirect shim, never renders a Team workspace (`docs/legacy-source/frontend/src/pages/tpo/team.js:5-9`)
- Expected fix: Restore owner-approved redirect to canonical destinations.

## G2-13-031-087 [P1] GAP facet F04
- Files: src/app/(authenticated)/tpo/reports/ctc/page.tsx
- Legacy: Legacy package bands <4, 4–6, 6–10, 10–20, 20+ LPA. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:137-160`
- Expected fix: Map exact band boundaries after INR conversion.

## G2-18-029-034 [P1] GAP facet F10
- Files: src/components/academics/college-semester-management.tsx, src/modules/academics/semester-mutation-model.ts
- Legacy: Legacy edit sends programId/number/name/totalCredits/isActive. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:231-275`
- Expected fix: Avoid silently clearing totalCredits, preserve unchanged value.

## G2-5-003-012 [P1] GAP facet F04 Data format
- Files: src/components/academics/college-structure-directory.tsx
- Legacy: Missing program/batch name labels 'Name unavailable (ID X)'. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:391-395)
- Expected fix: Expose scoped broken-reference rows with explicit fallback rather than silently drop.

## G2-5-003-014 [P1] GAP facet F04 Data format
- Files: src/components/academics/college-structure-directory.tsx
- Legacy: Student count via per-class learner lookup; Unavailable tag on failure. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:399-402)
- Expected fix: Distinguish unknown count due to failed dependency read from verified zero.

## G2-5-003-019 [P1] GAP facet F05 Tables/lists
- Files: src/components/academics/college-structure-directory.tsx
- Legacy: Page size defaults25, persists preference; choices10/25/50/100, show range summary. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:149-163; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:499-505)
- Expected fix: Fix mismatched page-size label and offer legacy size selector persisted between visits.

## G2-5-003-052 [P1] GAP facet F12 Business rules
- Files: src/components/academics/college-recurring-preview.tsx
- Legacy: No weekdays selected means daily recurrence across chosen date range. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:562-569)
- Expected fix: Support empty-as-daily legacy rule or explicitly warn and preselect all weekdays.

## G2-5-003-054 [P1] GAP facet F13 States
- Files: src/components/academics/college-structure-directory.tsx
- Legacy: First load TableSkeleton 8x8, refreshing state retains rows and Retry on failed refresh. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:496-509)
- Expected fix: Restore skeleton/refresh/stale-data retry states.

## G2-5-003-075 [P1] GAP facet F22 Data model/migrations
- Files: src/modules/academics/college-section-mutation-model.ts
- Legacy: Legacy _Class programId, batchId, name, description, lower/upper limit. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:75-106)
- Expected fix: Document numeric→UUID migration including legacy lowerLimit and academic period link.


## Lane chat-1 verification triage (2026-10-22)

- G2-4-024-024: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-4-024-026: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-4-024-069: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-4-024-076: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-12-010-001: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-12-010-010: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-12-010-015: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-12-010-020: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-12-010-021: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-12-010-030: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-12-010-031: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-12-010-041: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-4-027-002: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-4-027-038: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-4-027-046: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-4-027-072: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-4-028-001: PARTIAL — legacy Team URL redirects to scoped canonical destinations; remaining contract not fully checked.
- G2-13-031-087: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-18-029-034: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-5-003-012: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-5-003-014: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-5-003-019: PARTIAL — class directory has a page-size control; persistence requires separate review; remaining contract not fully checked.
- G2-5-003-052: PARTIAL — recurrence UI explicitly supports an empty weekday selection as daily; remaining contract not fully checked.
- G2-5-003-054: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
- G2-5-003-075: DEFERRED — needs targeted implementation and legacy parity inspection; not certified.
