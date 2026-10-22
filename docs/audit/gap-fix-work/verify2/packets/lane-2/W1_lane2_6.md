# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-008-021 [P1] MISSING facet F10
- Files: (none, new feature)
- Legacy: LC:118-124 summary AdminAuditLogService event once when published>0
- Expected fix: Record one batch-level audit event with counts & actor after publish processing.

## G2-2-011-026 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LC:163-185 each occurrence calls classScheduleService.create independently
- Expected fix: Make per-date creation independently resilient to DB constraint failure; one failed row must not roll back successful dates.

## G2-2-014-006 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: LF:616-621 rowSelection across paginated courses
- Expected fix: Preserve cross-page selected IDs scoped to current college.

## G2-2-015-062 [P1] GAP facet F02
- Files: src/app/(authenticated)/admin/course-progress/page.tsx, src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Original order is title/info, selector Card, summary cards, Per student Table `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-388`
- Expected fix: Render the complete metric/report flow in the same selected class/course view

## G2-14-025-034 [P1] GAP facet F10
- Files: src/modules/placements/hr-interview-slot-service.ts
- Legacy: RecruiterDriveController.java:173-180 batch slots and selection submit
- Expected fix: Verify TPO handoff/selection recording and per-row results.

## G2-14-025-061 [P1] GAP facet F22
- Files: src/modules/placements/hr-interview-slot-service.ts
- Legacy: RecruiterDriveController.java:163-180 results,slot,selection tables
- Expected fix: Map old round results and selections to new statuses/history.

## G2-15-030-001 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: L:39,108-154 org-wide and college-scoped report modes
- Expected fix: Resolve lost org-scoped placement analytics.

## G2-2-001-025 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LS:134-147 exact errors Unknown status, It is already..., Say why..., Only a fixed finding..., Choose the finding this repeats
- Expected fix: Match permitted transitions or log intentional stricter redesign; map exact legacy error messages.

## G2-2-003-021 [P1] MISSING facet F12
- Files: (none, new feature)
- Legacy: LR:50-59 email only for 6 urgent events, other 13 suppressed
- Expected fix: Encode six-event email allowlist and refuse other legacy events unless owner explicitly expands.

## G2-3-008-051 [P1] GAP facet F11
- Files: src/app/(authenticated)/college/courses/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:200-212`
- Expected fix: Legacy when collegeId changes resets image URLs/edit modal/selection, new server workspace must invalidate persistent client editor/duplication query on scope changes.

## G2-3-015-011 [P1] GAP facet F05
- Files: src/modules/placements/college-drive-read-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:130-146`
- Expected fix: Legacy college-admin list includes collegeId current OR unassigned college job with orgId, active path excludes EXTERNAL_ONLY; vNext requires exact non-null collegeId and cannot show org-wide jobs. Migrate/link shared legacy org jobs.

## G2-3-015-027 [P1] GAP facet F11
- Files: src/modules/placements/college-drive-read-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:130-146`
- Expected fix: Legacy org-only jobs shared with college admins when collegeId null; vNext DB has nonnull collegeId and strict permission. Implement explicit read grants or migrate shared jobs per college, no blanket cross-college fallback.

## G2-11-019-042 [P1] GAP facet F10
- Files: src/modules/placements/tpo-crm-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:152-169`
- Expected fix: Legacy `No answer` outcome triggers next-day10AM followup; vNext atomic service schedules Date.now+2 days if no active followup.

## G2-11-019-051 [P1] GAP facet F12
- Files: src/modules/placements/tpo-crm-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:160-161`
- Expected fix: No answer follow-up schedule tomorrow at10AM vs +2days clock, could change workload SLA.

## G2-11-022-047 [P1] GAP facet F12
- Files: src/modules/placements/report-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-72`
- Expected fix: Legacy first funnel step looking = registered students and placed = unique, accepted = unique, vNext acceptedOffers differs and placed policy configurable SELECTED/RELEASED/ACCEPTED. Do not compare conversion rates without denominator note.

## G2-11-022-072 [P1] GAP facet F20
- Files: src/modules/placements/report-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:64-72`
- Expected fix: Legacy null/NaN stats treated as 0; vNext explicitly flags missing registration data rather than guessing. Do not silently treat missing denominator as valid 0 in cloned JourneyStrip.

## G2-3-019-024 [P1] GAP facet F10
- Files: src/modules/placements/saved-job-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:56-64`
- Expected fix: Legacy bookmark remains after job closed/deadline passed; vNext stored row survives but listOwnPlacementSavedJobs filters status PUBLISHED/feed, losing page visibility. Add authorized historical summary query without changing bookmark permanence.

## G2-3-004-044 [P1] GAP facet F20
- Files: src/app/(authenticated)/admin/quizzes/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:25-27`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:117-119`
- Expected fix: Legacy scope keying prevents stale submissions overlay after scope switch, vNext creator/editor scope binding needs active-college guard.

## G2-3-031-038 [P1] GAP facet F10
- Files: src/modules/placements/super-admin-hr-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:196-228`
- Expected fix: Legacy creates account identity and optionally cross-college access; vNext first requires active company relationship and can create company before recruiter. Rejects previously valid invites lacking company binding.

## G2-3-023-021 [P1] GAP facet F10
- Files: src/modules/placements/tpo-drive-lifecycle-service.ts, src/modules/placements/tpo-drive-publish-effects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- Expected fix: Legacy publish defaults notifyByEmail true and APP+EMAIL, VNext rejects email true and notifies in-app only.

## G2-3-023-048 [P1] MISSING facet F23
- Files: src/modules/placements/tpo-drive-lifecycle-service.ts, src/components/placements/tpo-drive-lifecycle-controls.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- Expected fix: Legacy publish email defaults enabled; VNext visibly offers email but backend always rejects. Fix or explicitly disable with approved exception.

## G2-3-022-007 [P1] GAP facet F04
- Files: src/modules/placements/tpo-team-internal-create-service.ts, src/db/schema/tpo-internal.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:38-44`, `71-80`
- Expected fix: Legacy Start body can create everyone/group/context topic and private/public group memberships; vNext creator accepts one recipientMembershipId, topic and firstMessage. Restore multi-member/topic semantics and safe scoping.

## G2-3-022-021 [P1] GAP facet F10
- Files: src/modules/placements/tpo-team-internal-create-service.ts, src/db/schema/tpo-internal.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:76-89`
- Expected fix: Legacy single thread can contain multiple people; vNext insert model stores startedByMembershipId/invitedMembershipId, not generalized participant rows. Multi-user fanout and historical author visibility require schema change.

## G2-3-022-026 [P1] GAP facet F11
- Files: src/modules/placements/tpo-team-internal-create-service.ts, src/modules/placements/tpo-team-conversation-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:71-80`, `174-178`
- Expected fix: Legacy service checks per-thread membership and distinguishes private conversation invitation needs; vNext authorizes pair membership, so legacy team-wide OPEN/topic reads cannot map one-for-one.

## G2-4-026-029 [P1] GAP facet F06
- Files: src/modules/placements/public-enquiry/recruit-service.ts
- Legacy: Server name sanitized/truncated at150, company200, note1000 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:130-143`)
- Expected fix: Unify server maxlength, optional company and text semantics with legacy.
