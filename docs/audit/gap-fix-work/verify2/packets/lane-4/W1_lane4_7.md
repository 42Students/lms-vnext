# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-16-015-004 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: JobEligibility.java:18 branches field list.
- Expected fix: Show department/branch multi-select and map normalized department scope; retain free-text CSE matching.

## G2-17-014-029 [P1] GAP facet F12
- Files: src/modules/placements/eligibility-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:27-32 — Per-student include/exclude always wins eligibility criteria.
- Expected fix: Document exact precedence exceptions to prevent unauthorized inclusion.

## G2-17-012-010 [P1] GAP facet F04
- Files: src/modules/placements/college-drive-applications-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:70-76 — Applications sorted screening score DESC then appliedAt DESC.
- Expected fix: Offer legacy score/date sort on admin applicant view.

## G2-17-012-014 [P1] GAP facet F05
- Files: src/modules/placements/college-drive-applications-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:78-103 — Paginated job applicant status/score/source/date/program/class/department/batch/search/skills filters.
- Expected fix: Implement missing scoped score/date/cohort/skills filters.

## G2-17-012-017 [P1] GAP facet F05
- Files: src/modules/placements/college-drive-applications-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:864-886 — Screening score null last via COALESCE(score,-1), then appliedAt DESC.
- Expected fix: Restore score/date default with null-last and stable tie-break.

## G2-17-001-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:10-14 preserves path and appends /home.
- Expected fix: Preserve search parameters on canonical default redirect (including repeated parameters and percent-encoding).

## G2-17-010-008 [P1] MISSING facet F02
- Files: src/modules/placements/recruiter-message-email-dispatch-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:57-58 — Recruiter invitation reminders daily 09:00 IST.
- Expected fix: Implement pending invite reminder worker (day-four rule).

## G2-17-010-031 [P1] MISSING facet F10
- Files: src/modules/placements/recruiter-message-email-dispatch-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:57-58 — Calls recruiterLeads.sendInviteReminders.
- Expected fix: Add invite mail reminder workflow.

## G2-18-005-004 [P1] GAP facet F01
- Files: src/components/placements/learner-placements-dashboard.tsx, src/modules/placements/learner-dashboard-model.ts
- Legacy: Legacy CTA links `/learn/my-placements/placement`, `/offers`, `/schedule`, `/jobs`, `/applications`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:73-97`
- Expected fix: Preserve compatibility aliases from legacy `schedule`, `placement` and job slug links.

## G2-18-005-012 [P1] GAP facet F03
- Files: src/components/placements/learner-placements-dashboard.tsx
- Legacy: Legacy hero CTA varies `Accept or decline`, `Register now`, `Confirm I'll attend`, `See details`, `See your rules`, `See drives`, `Update profile`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:83-97`
- Expected fix: Bind rendered CTA to computed action label for each distinct next action, preserving exact legacy strings.

## G2-18-005-016 [P1] GAP facet F03
- Files: src/components/placements/learner-placements-dashboard.tsx
- Legacy: Legacy does not display four dashboard KPI cards; explicitly avoids raw counts. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:24-27`
- Expected fix: Remove/promote below-fold stat tiles to honor explicit legacy no-count design decision.

## G2-18-005-022 [P1] GAP facet F04
- Files: src/app/(authenticated)/learn/my-placements/page.tsx, src/components/placements/learner-placements-dashboard.tsx
- Legacy: Legacy placed message `You're placed with COMPANY` and eligible to still apply. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:59-61`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:90-91`
- Expected fix: Ensure accepted-offer or hired status produces placed state after higher urgency, with exact CTA.

## G2-18-005-026 [P1] GAP facet F05
- Files: src/components/placements/learner-placements-dashboard.tsx, src/modules/placements/learner-waiting-on-you-model.ts
- Legacy: Legacy toConfirm only booked, not confirmed, not TALK, no pending move request. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:65-66`
- Expected fix: Add booked-but-unconfirmed sessions and suppress pending change requests.

## G2-18-005-076 [P1] GAP facet F18
- Files: src/components/placements/learner-placements-dashboard.tsx
- Legacy: Legacy no counters in first view by explicit design comment. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:24-27`
- Expected fix: Move KPI row below the legacy ordered panels.

## G2-19-007-002 [P1] MISSING facet F01
- Files: src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx
- Legacy: Legacy numeric ID automatically router.replace to same URL with course.slug `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:94-113`
- Expected fix: Implement exact safe old-link rewrite preserving Back history.

## G2-19-011-004 [P1] GAP facet F02
- Files: src/modules/placements/tpo-drive-lifecycle-list-service.ts
- Legacy: Legacy no page shell; change later reflected via absence from active job listings `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-63` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:41-61`
- Expected fix: Make post-deadline 'Applications closed' distinct from live accepting applications.

## G2-19-011-012 [P1] GAP facet F05
- Files: src/modules/placements/tpo-drive-lifecycle-list-service.ts
- Legacy: Legacy repository batch selects all active non-draft, non-deleted past-deadline rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:181-188`
- Expected fix: System sweep must cover every tenant and season, independently of UI filters.

## G2-19-004-082 [P1] GAP facet F22
- Files: src/app/(authenticated)/learn/my-placements/schedule/page.tsx
- Legacy: Legacy schedule model uses numeric interviewId/jobId/roundId, old interviewStatus, optional moveAsk `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:19-31` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:103-112`
- Expected fix: Document migration mapping old IDs/states to new slot, request and attendance records.

## G2-2-006-036 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LC:46-50 superadmin or faculty type ADMIN, explicit 403
- Expected fix: Verify super-admin acting-college and ADMIN-only scopes; ensure faculty cannot use admin shared authoring.

## G2-2-008-042 [P1] MISSING facet F21
- Files: (none, new feature)
- Legacy: LC:118-124 AdminAuditLogService audit integration optional
- Expected fix: Add audit batch summary integration with original count keys.

## G2-2-011-029 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LC:196-200 per-date failed return does not abort other dates
- Expected fix: Use savepoints or chunked per-occurrence transaction to retain partial success.

## G2-2-014-008 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LF:484-485 Students see it visible when active && enabled
- Expected fix: Make visible chip reflect course learner visibility, not lesson content count alone.

## G2-2-015-067 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Backend rounds each learner percentage and then mean of roster percentages `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:185-215`
- Expected fix: Compute mean over all eligible roster members and preserve null/no-work rules

## G2-2-016-150 [P1] GAP facet F19
- Files: src/modules/placements/college-drive-applications-service.ts
- Legacy: Legacy filtered application CSV delivers full service result `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:706-738`
- Expected fix: Implement streamed CSV over all matching rows and error report on cap

## G2-15-030-034 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: L:264-320 CSV sections Summary/Funnel/Job/Company Totals
- Expected fix: Restore four report sections in export.
