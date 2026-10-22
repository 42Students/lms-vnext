# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-16-010-015 [P1] GAP facet F05
- Files: src/modules/skills/catalog-service.ts
- Legacy: SkillsCache.java:54-92 expands 26 fixed shortcuts js,ts,py,cpp,k8s etc.
- Expected fix: Seed all fixed synonym aliases in active table and test expected matches.

## G2-16-010-031 [P1] GAP facet F10
- Files: src/app/api/skills/route.ts
- Legacy: SkillsSearchController.java:35-121 GET search/popular/categories/category/stats/exists, POST select.
- Expected fix: Implement all seven v2 operations and preserve read/selection HTTP semantics.

## G2-16-010-032 [P1] GAP facet F10
- Files: src/modules/skills/catalog-service.ts
- Legacy: SkillsCache.java:35-39 on startup loads skills-data CSV or RTF.
- Expected fix: Publish/seed immutable CSV dataset into registered migration before enabling endpoint.

## G2-16-010-034 [P1] GAP facet F11
- Files: src/app/api/skills/route.ts
- Legacy: SkillsSearchController.java:26 open CORS specific frontend origins incl localhost.
- Expected fix: Decide public autocomplete entitlement and auth enforcement for profile candidates.

## G2-16-010-035 [P1] GAP facet F11
- Files: src/app/api/skills/route.ts
- Legacy: SkillsSearchController.java:92-100 unauthenticated POST select increments global usage.
- Expected fix: Keep selection event behind approved rate-limited auth to avoid abuse; document hardening.

## G2-16-010-037 [P1] MISSING facet F12
- Files: src/modules/skills/catalog-service.ts
- Legacy: SkillsCache.java:357-367 fuzzy only when fewer than five prefix matches, query len>=3.
- Expected fix: Add deterministic fuzzy fallback threshold and distance cap.

## G2-16-010-038 [P1] MISSING facet F12
- Files: src/app/api/skills/route.ts
- Legacy: SkillUsageTracker.java:87-105 async insert/upsert records selection usage.
- Expected fix: Add idempotent usage write per valid POST, safe retry handling.

## G2-16-010-039 [P1] GAP facet F13
- Files: src/app/api/skills/route.ts
- Legacy: SkillsCache.java:113-145 CSV read failure tries RTF generation, not fatal.
- Expected fix: Seed and gate availability before release, show explicit unavailable suggestion state.

## G2-16-010-050 [P1] MISSING facet F20
- Files: src/app/api/skills/route.ts
- Legacy: SkillUsageTracker.java:87-105 @Async usage merge concurrent, DB upsert.
- Expected fix: Use atomic DB counter with concurrency safe retry.

## G2-16-010-052 [P1] GAP facet F21
- Files: src/modules/skills/catalog-service.ts
- Legacy: SkillsSearchController.java:19-20 in-memory-only search no database.
- Expected fix: Provide seeded DB and readiness monitor, or fallback local catalog.

## G2-16-031-096 [P1] GAP facet F22
- Files: src/modules/placements/tpo-drive-selection-service.ts
- Legacy: TpoOfferController.java:54-124 uses old JobOffer SELECTED/PENDING_VERIFICATION/RELEASED/ACCEPTED/withdrawn model.
- Expected fix: Map legacy unreleased selection statuses and released offer histories; never collapse SELECTED into ISSUED.

## G2-17-005-044 [P1] GAP facet F23
- Files: src/app/(authenticated)/learn/my-placements/interviews/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/interviews.js:4-7 guaranteed redirect to Schedule on every visit, never 'Interviews' standalone.
- Expected fix: Restore URL alias behavior or sign off intentional divergence.

## G2-17-010-004 [P1] MISSING facet F02
- Files: src/modules/placements/placement-offer-expiry-sweep-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:45-46 — Offer-expiring-soon hourly fixed-delay.
- Expected fix: Add hourly pre-expiry reminders, separate from expiry transitions.

## G2-17-010-034 [P1] GAP facet F10
- Files: src/modules/placements/placement-offer-expiry-sweep-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:72-73 — Calls offers.expireOverdue.
- Expected fix: Complete scheduled entry, actor identity and catch-up logic.

## G2-17-010-051 [P1] GAP facet F19
- Files: src/modules/placements/placement-offer-expiry-sweep-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:45-73 — Fixed-delay jobs run once handler returns; locks limit overlap.
- Expected fix: Run multiple bounded batches until drained with time budget.

## G2-18-003-061 [P1] GAP facet F10
- Files: src/app/api/courses/[courseId]/route.ts, src/components/courses/admin-course-actions.tsx
- Legacy: Legacy PUT updateCourse with field merge and optional replaced image R2 best-effort cleanup. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:355-382`
- Expected fix: Implement update image upload + safe old image lifecycle, account for signed URLs and races.

## G2-18-003-107 [P1] MISSING facet F21
- Files: src/app/(authenticated)/admin/courses/page.tsx
- Legacy: Legacy global policy reads tenant settings through PolicySettingField and GLOBAL scope, default 5. `docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:5-12`, `docs/legacy-source/frontend/src/pages/superadmin/courses.js:21-27`
- Expected fix: Wire existing platform setting override service or implement typed course threshold storage.

## G2-19-020-055 [P1] GAP facet F21
- Files: src/modules/bug-tracker/report-service.ts, src/modules/bug-tracker/reporter-service.ts
- Legacy: Old BugReport linkage resolves reporter name against active access entity; no actor user FK. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:42-52` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:21-26`
- Expected fix: Determine historical issue ownership migration without granting a name-matching stranger access.

## G2-19-020-061 [P1] GAP facet F23
- Files: src/modules/bug-tracker/report-service.ts
- Legacy: Old named external reporters authenticate by active displayName for issue creation; no stable per-issue user ID. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:42-52`
- Expected fix: Treat reporter-auth behavior as intentional redesign requiring owner acceptance and UI onboarding.

## G2-19-011-051 [P1] GAP facet F20
- Files: src/modules/placements/tpo-drive-deadline-service.ts
- Legacy: Legacy stale ORM job.save race with deadline edit not explicitly CAS-guarded here `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-63`
- Expected fix: Scheduled update must condition on current deadline+status to avoid closing just-extended drive.

## G2-19-006-039 [P1] GAP facet F10
- Files: src/app/(authenticated)/learn/attendance/page.tsx, src/modules/attendance/learner-attendance-calendar-model.ts, src/modules/attendance/learner-service.ts
- Legacy: Legacy GET records takes numeric courseId and startDate,endDate inclusive YYYY-MM-DD `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:93-102` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:158-163`
- Expected fix: Verify month-end timezone boundary, migrating class schedule joins/IDs.

## G2-19-004-039 [P1] GAP facet F10
- Files: src/app/(authenticated)/learn/my-placements/schedule/page.tsx
- Legacy: Legacy GET placement journey + GET older learner interviews separately `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:61-80` `docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:18-32` `docs/legacy-source/frontend/src/api/Services/interviewService.js:49-73`
- Expected fix: Map legacy interview fallback, personal application states and dedupe in service.

## G2-19-001-008 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/students/page.tsx, src/components/admin/scoped-membership-lifecycle-actions.tsx, src/components/college/college-person-edit-action.tsx
- Legacy: Legacy table row has icon actions Edit, Audit trail, Profile, OTP unlock, Impersonate, Suspend/Reactivate, Delete `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:959-1085`
- Expected fix: Restore missing role-checked Audit trail, Profile, OTP unlock, impersonation and deletion workflows (or document explicit deprecation).

## G2-19-001-046 [P1] GAP facet F09
- Files: src/components/admin/scoped-membership-lifecycle-actions.tsx, src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy `Clear OTP lockout?`, `Impersonate this student?`, `Suspend Student`, `Reactivate Student`, `Delete Student` confirmations `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:990-1085`
- Expected fix: Provide role-gated per-action dialogs with exact impact copy and safe confirmation.

## G2-19-001-052 [P1] GAP facet F10
- Files: src/components/admin/scoped-membership-lifecycle-actions.tsx
- Legacy: Legacy suspend/reactivate `/api/v1/admin/users/LEARNER/{id}/...` invalidates active sessions `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminUserLifecycleController.java:83-101`,137-152,178-203
- Expected fix: Verify canonical-session invalidation and cross-membership suspension effects; expose impact explanation.
