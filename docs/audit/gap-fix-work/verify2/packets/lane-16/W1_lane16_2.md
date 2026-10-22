# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-023-056 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:123-146 — Any active org/college scope hides global lists and creation.
- Expected fix: Hide global structure entirely when scoped

## G2-19-027-018 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy validates short_title required/max255, course_name required/max255, dept_id positive; CourseDTO.java:14-21
- Expected fix: Align Short display name required in Super Admin entry and maximum to chosen legacy value, allow no internal code or document generation.

## G2-11-002-072 [P1] MISSING facet F14
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: Download resumes ZIP `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:547`
- Expected fix: Bulk ZIP action

## G2-11-009-057 [P1] MISSING facet F13
- Files: src/app/(authenticated)/tpo/drive-day/page.tsx
- Legacy: Failed refresh preserves previous cards with stale alert. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:54`
- Expected fix: Add last-good snapshot with warning.

## G2-12-003-002 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/courses/page.tsx
- Legacy: Unscoped SA has global Progress policy in progress lower bound setting, default 5%, range0..99 `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:530-535`
- Expected fix: Restore global progress policy control independent of college selection

## G2-18-016-024 [P1] GAP facet F12
- Files: src/modules/courses/learner-quiz-result-release-policy.ts
- Legacy: QuizServiceImpl.java:275-295 allows grades after due and published quiz
- Expected fix: Verify CLOSE + release workflow reachable; describe result-visibility timing deliberately

## G2-13-015-025 [P1] GAP facet F08
- Files: src/modules/placements/tpo-drive-offer-register-model.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:69-71` default SELECTED is not visible as released letter
- Expected fix: Do not show unreleased SELECTED legacy offers as response-ready ISSUED when migrating

## G2-13-015-039 [P1] GAP facet F13
- Files: src/modules/placements/tpo-drive-offer-register-model.ts, src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:370-397` expire RELEASED if respondBy passed; if application already answered correct to ACCEPTED/DECLINED
- Expected fix: Ensure durable expiry sweep transitions and reconciles previously answered offers, not just badge derivation

## G2-17-23-015 [P1] GAP facet F04 Request ID
- Files: (none, new feature)
- Legacy: LC:32–33 PathVariable Long offerId; TS:172–173 finds offer by Long
- Expected fix: Add explicit legacy numeric↔UUID offer ID reconciliation in migration/integration ledger; reject malformed identifiers before DB

## G2-17-23-080 [P1] GAP facet F20 Two-tab race
- Files: (none, new feature)
- Legacy: JS:1169–1174 locks learner for accept; JS:1332–1359 stable sibling lock ordering; JO:116–118 optimistic version
- Expected fix: Verify no deadlocks for simultaneous accept/decline/withdraw/interview updates and no dual accepted outcomes; preserve deterministic lock order

## G2-18-019-008 [P1] GAP facet F04 OTP secret
- Files: (none, new feature)
- Legacy: LV:19-20 column `otp` plaintext; LS:115 stores code
- Expected fix: Treat keyed MAC as required security improvement; explicitly mark raw OTP intentionally dropped, never restore plaintext storage

## G2-18-026-029 [P1] GAP facet F12 Unique name
- Files: (none, new feature)
- Legacy: NPS:63-71, NPR:47-50 trim/case-insensitive within dept (including potentially soft-deleted rows)
- Expected fix: Decide archived-name reuse and restoration collisions explicitly; document stronger code constraint

## G2-19-029-029 [P1] GAP facet F07 Invalid payload
- Files: (none, new feature)
- Legacy: LG:174-184 requires boolean readyForDomainLogin and arrays blockers/warnings; throws `Unexpected readiness response`
- Expected fix: Add runtime schema validation at external/adapter boundary for array/codes; fail closed rather than render READY from malformed data

## G2-13-002-031 [P1] GAP facet F07
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: 403 message access-ended uses placement-cell guidance (`docs/legacy-source/frontend/src/components/recruiter/recruiterRoutes.js:18-20`)
- Expected fix: Display explicit access-ended copy where safe and actionable.

## G2-18-021-017 [P1] GAP facet F08
- Files: (none, new feature)
- Legacy: Old zero event list is empty success, frontend falls back to importantDates from jobs (DTO:20-29 comment)
- Expected fix: Distinguish no dates from unsupported source; add explicit metadata projection rather than empty-success

## G2-19-026-047 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: Legacy `courses` module exposed in feature catalog (ModuleAccessUpdateRequest:19)
- Expected fix: Write explicit products/permission mapping and intentional divergence before signoff

## G2-14-017-015 [P1] GAP facet F05
- Files: src/modules/projects/mentor-sprint-delete-service.ts
- Legacy: Legacy findAllByProjectId includes soft-deleted for template merge `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectSprintRepository.java:22-25`
- Expected fix: Retain explicit deletedByWorkspace tombstone semantics

## G2-14-017-056 [P1] GAP facet F20
- Files: src/modules/projects/mentor-sprint-delete-service.ts
- Legacy: Legacy deletedByWorkspace allows template merge distinguish absence `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:41-42` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectSprintRepository.java:22-25`
- Expected fix: Persist deletion tombstones or explicit suppressed keys

## G2-15-001-069 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: Legacy role/student fields, semester/year, dynamic image and corruption diagnostics are visible on card (CoursesContent.jsx:483-485,512-542).
- Expected fix: Make owner-approved decision matrix: legacy visible fields restore vs intentional vNext additions; do not silently discard diagnostics.

## G2-15-002-018 [P1] MISSING facet F04
- Files: src/modules/placements/college-placement-student-lookup-service.ts
- Legacy: Shows rejection reason inline when nonempty (`StudentPlacementLookup.js:197-201`; `LearnerApplicationWithInterviewsDTO.java:40-54`).
- Expected fix: Expose authorized rejection reason from application history and place after date/interview.

## G2-15-002-025 [P1] GAP facet F05
- Files: src/modules/placements/college-placement-student-lookup-service.ts, src/app/(authenticated)/admin/placements/student-lookup/page.tsx
- Legacy: List all application records returned for selected student; no per-student truncation hint (`StudentPlacementLookup.js:97-104,180-207`; `AdminJobServiceImpl.java:1889-1899`).
- Expected fix: Offer paginated load-more/full-history access for students beyond 100 records, deduplicate multi-offer rows.

## G2-15-002-046 [P1] GAP facet F10
- Files: src/modules/placements/college-placement-student-lookup-service.ts, src/app/(authenticated)/admin/placements/student-lookup/page.tsx
- Legacy: Selection `GET /api/v1/admin/jobs/students/{id}/placement-summary?collegeId`, success-envelope checked (`AdminService.js:701-702`; `StudentPlacementLookup.js:88-109`).
- Expected fix: Add authorized selected-learner detail service/action keyed by membership, with own pending/error path.

## G2-15-002-047 [P1] MISSING facet F10
- Files: src/modules/placements/college-placement-student-lookup-service.ts
- Legacy: Profile GETs: job-preferences, resume, skills (`ProfileService.js:104-115,144-154`; `LearnerProfileController.java:844-903,1177-1235`).
- Expected fix: Read scoped profileDocument resume/skills/preferences and expose only necessary permitted fields.

## G2-15-002-055 [P1] GAP facet F12
- Files: src/modules/placements/college-placement-student-lookup-service.ts
- Legacy: Every application stage from legacy job application status; next upcoming interview attached (`LearnerApplicationWithInterviewsDTO.java:21-28,40-54`; `StudentPlacementLookup.js:184-201`).
- Expected fix: Create canonical status transition/next-interview projection with per-application stage.

## G2-15-002-057 [P1] GAP facet F12
- Files: src/modules/placements/college-placement-student-lookup-service.ts
- Legacy: All applications under a student; list source `jobService.getLearnerApplicationsWithInterviews` (`AdminJobServiceImpl.java:1889-1899`).
- Expected fix: Group offer rows by application ID before display; show latest relevant offer and joining separately.
