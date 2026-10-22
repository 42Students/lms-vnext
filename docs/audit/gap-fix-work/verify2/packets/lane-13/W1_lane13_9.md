# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-001-056 [P1] GAP facet F12
- Files: src/modules/people/college-student-registration-service.ts
- Legacy: Legacy registration and edit require Class, Program chosen from current college `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1191-1218`,1663-1690
- Expected fix: Decide mandatory class parity; enforce on UI and server if required.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-19-001-058 [P1] GAP facet F12
- Files: src/modules/people/college-student-csv-service.ts, src/components/college/college-student-csv-import.tsx
- Legacy: Legacy bulk import persists successful rows individually and has `bulkImportBatchId` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:246-254`,310-368,387-405
- Expected fix: Expose stable batch grouping/rollback policy, audit each partial row, and document manual recovery.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-006-005 [P1] MISSING facet F03
- Files: (none, new feature)
- Legacy: LF:163-167 PDF-specific upload error toast, LF:185-189 wait uploads
- Expected fix: Add typed file picker, in-progress indicator and prevent save until upload completes.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-006-059 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LM:68-70 optimistic @Version persistent
- Expected fix: Require non-optional CAS token for admin edits, including post-submission title edits.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-010-024 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LF:115 `deleteCollegeSetting` resets one override to inherited defaults
- Expected fix: Support per-setting inherited/global reset and source-of-value provenance.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-012-054 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LC:160-170 joins learner,class_schedule,attend; LC:180-190 student_assignment
- Expected fix: Map legacy data relationships, especially implicit present and grading statuses.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-014-030 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LC:123-128 sets active/enabled, controlling learner visibility
- Expected fix: Do not treat lesson-content hide as course hide; preserve course-level visibility and learner queries.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-004 [P1] GAP facet F01
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: NotificationController.java:59-71 compose route creates scheduled row; admin operator route handles retry/cancel
- Expected fix: Map legacy notification authoring and queue operator to same persisted campaign model.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-015 [P1] MISSING facet F05
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: NotificationRepository.java:163-170 due scheduled work oldest schedule first
- Expected fix: Implement oldest-due-first limited worker queue.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-018 [P1] MISSING facet F06
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: AdminNotificationDeliveryController.java:63-65 `id` path Integer, `collegeId` query Integer
- Expected fix: Validate positive legacy ID mapping or UUID campaign ID plus authorized college scope.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-019 [P1] MISSING facet F06
- Files: src/app/(authenticated)/admin/announcements/page.tsx
- Legacy: AdminNotificationDeliveryController.java:58-65,110-115 actions are POST with no request body
- Expected fix: Add POST actions, explicit action-specific confirmation and success handling.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-025 [P1] GAP facet F07
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: AccessControlService.java:482-499 per-course forbiddance; AdminNotificationDeliveryController.java:79-83 class/course checks
- Expected fix: Reauthorize original notification audience and tenant at mutation.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-031 [P1] MISSING facet F10
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: AdminNotificationDeliveryController.java:89-92 on resend sets SCHEDULED, due now-1s, clears deliveryError, saves
- Expected fix: Implement requeue transaction, due-now state and error clearing.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-032 [P1] MISSING facet F10
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: AdminNotificationDeliveryController.java:135-139 cancel sets CANCELLED and due now+100 years (not null)
- Expected fix: Record cancellation state and make scheduled content permanently ineligible for release.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-034 [P1] MISSING facet F10
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: AdminNotificationDeliveryController.java:141-144 audit event `NOTIFICATION_SCHEDULE_CANCEL`
- Expected fix: Log cancel outcome once, with actor and affected campaign ID.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-035 [P1] MISSING facet F10
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: NotificationSchedulerService.java:102-150 release job status SENT/FAILED, deliveredAt/error; SSE best effort
- Expected fix: Build durable due-time scheduler with failure state and bounded batch.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-036 [P1] MISSING facet F10
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: NotificationWorkflowMySqlIT.java:159-186 cancel then resend queued without early learner visibility
- Expected fix: Test cancel/reschedule/requeue and recipient visibility only after worker commit.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-037 [P1] GAP facet F11
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: AdminNotificationDeliveryController.java:69-70,119-120 `requirePerformAdminActionForCollege`
- Expected fix: Allow appropriately scoped college admin and super admin, not arbitrary senders.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-038 [P1] GAP facet F11
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: AdminNotificationDeliveryController.java:76-83,126-130 rechecks class then course audience
- Expected fix: Revalidate audience under mutable class/course ownership before queue action.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-039 [P1] MISSING facet F11
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: NotificationWorkflowMySqlIT.java:227-242 rejects cross-college cancel despite own collegeId query
- Expected fix: Add cross-tenant cancel/retry cases, preserve no-write invariant.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-045 [P1] MISSING facet F13
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: NotificationSchedulerService.java:142-150 if failure persistence fails, leaves SCHEDULED for next tick
- Expected fix: Persist failure with safe retry semantics and avoid lost notifications.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-049 [P1] GAP facet F15
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: NotificationSchedulerService.java:128-138 release SSE push best-effort after persisted SENT
- Expected fix: Scheduled worker must emit in-app and optional SSE after success, without duplicate delivery.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-050 [P1] GAP facet F15
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: AdminNotificationDeliveryController.java:51-56 resend reuses release job, never inline sends
- Expected fix: Keep resend as queued worker operation rather than invoke immediate fan-out on operator POST.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-057 [P1] MISSING facet F19
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: NotificationSchedulerService.java:102-111 every 60s job with single-batch due pagination
- Expected fix: Schedule worker at bounded interval with due index and max batch.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-2-019-061 [P1] MISSING facet F20
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: NotificationWorkflowMySqlIT.java:188-210 failed retry clears error and makes due<=now
- Expected fix: Test failed requeue clears only error, retains content and prevents duplicate receipts.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.
