# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-035-044 [P1] GAP facet F19
- Verification: OK — inspected learner-playback-settings.ts: 15,000 ms persisted-override default, 90% watched threshold, bounded global overrides. Load testing remains separate.
- Files: src/modules/courses/learner-playback-settings.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:52 progress saves every15s by default
- Expected fix: Load-test increased write frequency; restore 15s default absent clear evidence/owner approval.

## G2-2-035-054 [P1] GAP facet F23
- Verification: OK — inspected learner-playback-settings.ts: 15,000 ms persisted-override default, 90% watched threshold, bounded global overrides. Load testing remains separate.
- Files: src/modules/courses/learner-playback-settings.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:52 progressSave default15000
- Expected fix: Reconcile frequency drift explicitly as cost/scale decision.

## G2-2-035-055 [P1] GAP facet F23
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/modules/courses/learner-playback-settings.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:44-57 generic GET for signed-in roles
- Expected fix: Restore one safe public-in-auth contract if old consumers expect it.

## G2-2-037-032 [P1] GAP facet F12
- Verification: OK — inspected learner-playback-settings.ts: 15,000 ms persisted-override default, 90% watched threshold, bounded global overrides. Load testing remains separate.
- Files: src/modules/courses/learner-playback-settings.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:51-56 15s save/poll and90% watched defaults
- Expected fix: Align autosave default and honor current runtime overrides.

## G2-2-037-052 [P1] GAP facet F19
- Verification: OK — inspected learner-playback-settings.ts: 15,000 ms persisted-override default, 90% watched threshold, bounded global overrides. Load testing remains separate.
- Files: src/modules/courses/learner-playback-settings.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:52 default save15000ms
- Expected fix: Model 3x API write increase under 10k concurrency.

## G2-2-002-007 [P1] GAP facet F06
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: (none, new feature)
- Legacy: LC:15-18 only one condition input r2.account.id
- Expected fix: Align deployment readiness semantics; ensure missing secret/bucket fails closed with explicit setup instructions.

## G2-2-001-048 [P1] GAP facet F14
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: (none, new feature)
- Legacy: LI:138-169 audits files and rejection reason; 307-315 result,error,checkedAt and up to 200 problematic files
- Expected fix: Persist and display result (REJECTED/TAMPERED/DELETED), checkedAt, and old 200-row diagnostics.

## G2-20-009-038 [P1] GAP facet F13
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: (none, new feature)
- Legacy: Legacy public URL can render immediately post-upload; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:102-125`
- Expected fix: Treat scanner readiness as launch dependency and show pending/failed/quarantined states.

## G2-20-010-001 [P1] GAP facet F01
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/app/api/internal/placements/recruiter-message-reminders/route.ts
- Legacy: Background emailUnread() sends TPO unread recruiter messages after delay `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:61-89`
- Expected fix: Configure recurring worker invocation with origin/bearer secret; prove scheduler enabled

## G2-20-022-011 [P1] GAP facet F07
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/modules/messaging/tpo-campaign-dispatch-service.ts
- Legacy: Missing template makes emailAvailable false `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:39-41`
- Expected fix: Visible preflight before send

## G2-3-008-046 [P1] GAP facet F10
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/app/api/courses/route.ts, src/app/api/courses/[courseId]/route.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:305-335`
- Expected fix: Legacy GET fetchByCollege, POST /api/v1/courses/create, PUT update/{id}, DELETE delete/{id}; vNext reads directly with Drizzle and POST/PATCH/DELETE archive; reconcile payload/status.

## G2-3-001-020 [P1] GAP facet F05
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/modules/courses/college-assessment-aggregate-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:237-243`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminQuizController.java:89-103`
- Expected fix: Verify legacy repository order and implement equivalent; vNext explicitly sorts due DESC then title ASC/id ASC.

## G2-3-001-046 [P1] GAP facet F10
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/app/(authenticated)/college/quizzes/page.tsx, src/modules/courses/college-assessment-aggregate-service.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:62-64`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:237-259`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminQuizController.java:87-107`
- Expected fix: Verify college-wide read parity across authoring roles and status, using direct scoped aggregate rather than legacy admin API.

## G2-3-001-050 [P1] GAP facet F10
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/components/courses/college-quiz-actions.tsx, src/app/api/courses/quizzes/[quizId]/transition/route.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:340-347`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:78-82`
- Expected fix: Clarify delete semantics: legacy DELETE, vNext ARCHIVE transition with retained rows/history; align user expectation and retention.

## G2-3-001-052 [P1] GAP facet F11
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/modules/courses/college-assessment-aggregate-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminQuizController.java:62-100`
- Expected fix: Preserve scoped superadmin access through the equivalent read route without conflating ordinary College Admin scope.

## G2-3-001-054 [P1] GAP facet F12
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/modules/courses/college-assessment-aggregate-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:447-464`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:267-285`
- Expected fix: Compare legacy publish, due, grade-release transitions to vNext `PUBLISH/CLOSE/ARCHIVE`, including non-past-deadline release gate.

## G2-3-001-055 [P1] GAP facet F12
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/components/courses/college-quiz-actions.tsx, src/modules/courses/quiz-validation.ts
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:367-390`
- Expected fix: Legacy allows title/description edits after attempts and locks deadline/attempts/randomization; vNext UI offers deadline and stale-version logic; verify server restrictions.

## G2-3-001-079 [P1] GAP facet F20
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/components/courses/college-quiz-actions.tsx, src/components/courses/college-quiz-create.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:287-318`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:364-405`
- Expected fix: Ensure all publish/results/delete/edit actions are guarded against concurrent double-submission and stale college scope; vNext guards editor/create differently.

## G2-3-001-081 [P1] GAP facet F20
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/components/courses/college-quiz-actions.tsx, src/app/api/courses/quizzes/[quizId]/route.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:381-401`
- Expected fix: On failed attempt-count precheck, allow only metadata correction and show exact warning; vNext fetches metadata without attempt-count precheck.

## G2-3-009-054 [P1] GAP facet F22
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/components/courses/faculty-course-roster.tsx, src/modules/courses/faculty-student-detail-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:64-95`
- Expected fix: Old numeric learnerId/classId and fields first_name,last_name,roll_number,contact_mobile,contact_mail map to UUID membershipId,displayName,rollNumber,phoneE164,email. Verify current membership and class mapping.

## G2-3-012-001 [P1] MISSING facet F01
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/modules/platform-settings/service.ts, src/modules/platform-settings/model.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:33-59`
- Expected fix: Legacy provides super-admin GET /api/v1/admin/sms-log for delivery troubleshooting; vNext platform settings shows a static template catalog, no delivery log route. Add restricted support endpoint and corresponding admin entry.

## G2-3-012-007 [P1] MISSING facet F04
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/modules/notifications/types.ts, src/modules/messaging/providers.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:19-49`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-134`
- Expected fix: Legacy transport has sendNotification, sendJobUpdateSms, sendSmsWithTemplate, and context-aware sendOtp; vNext SmsProvider only supports sendOtp. Add parity send methods with DLT mappings.

## G2-3-012-025 [P1] MISSING facet F10
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/modules/notifications/types.ts, src/modules/operations/outbound-delivery-contract.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-134`
- Expected fix: Legacy notification/job updates sent via SmsService methods; vNext OTP transport cannot send them and outbound contract only recruiter intents. Integrate mapping and safe delivery calls.

## G2-3-012-027 [P1] MISSING facet F11
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/modules/platform-settings/service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:22-59`
- Expected fix: Legacy SMS log is strictly super-admin even with masked numbers; vNext must require global support privilege, not college/TPO, before exposing cross-tenant records.

## G2-3-012-035 [P1] MISSING facet F13
- Verification: DEFERRED — requires endpoint/service and legacy behavior review; no implementation parity asserted.
- Files: src/modules/platform-settings/service.ts, src/db/schema/db10-general-notices.draft.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/NotificationOutboxService.java:19-31`
- Expected fix: Legacy TPO outbox marks missing DLT templates FAILED with reason; vNext no active general outbox, thus no corresponding persisted operational failed state. Add explicit not configured status.
