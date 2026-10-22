# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-16-007-044 [P1] GAP facet F11
- Files: src/app/(authenticated)/college/semester-courses/page.tsx, src/modules/academics/college-term-mapping-service.ts
- Legacy: `semester-courses.js:11-18`: college determined from signed-in loginUser.collegeId; no college gives warning.
- Expected fix: Distinguish authenticated unassigned admin from session invalid and show legacy warning.

## G2-16-007-075 [P1] GAP facet F21
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: `SemesterCourseMapping.js:129-138`: staffing API is distinct dependency; failure warning doesn't block mapping.
- Expected fix: Catch staffing-only errors independently; return warnings unavailable marker.

## G2-16-007-076 [P1] GAP facet F22
- Files: src/modules/academics/college-term-mapping-service.ts, src/modules/academics/college-term-mapping-model.ts
- Legacy: `SemesterCourseMapping.js:218-229`: mapping stores course ID, credits, legacy is_mandatory and course_order.
- Expected fix: Decide is_mandatory→type migration explicitly, and ensure original electives flag does not silently default to CORE.

## G2-17-014-026 [P1] GAP facet F11
- Files: src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:211-217 — TPO needs active college scope; principal source.
- Expected fix: Verify superadmin acting-college scope on direct GET.

## G2-17-005-021 [P1] GAP facet F10
- Files: src/app/(authenticated)/learn/my-placements/interviews/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:73-99 fetches legacy interviews, job deadlines and monthly blocked calendar extras after redirect.
- Expected fix: Route to schedule read closure so old interview and blocked-day integrations remain represented.

## G2-17-005-038 [P1] GAP facet F19
- Files: src/app/(authenticated)/learn/my-placements/interviews/page.tsx, src/modules/placements/learner-interview-withdrawal-service.ts
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:11-14 no network request apart from Next route transition.
- Expected fix: Avoid double getLearnerPlacementRequestWorkspace query on one route render; pass shared snapshot.

## G2-17-002-014 [P1] GAP facet F04
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:280-281 missing course name shows 'Course name unavailable (ID X)'.
- Expected fix: Surface orphaned mappings and show missing course title diagnostics, not silently skip rows.

## G2-17-002-054 [P1] GAP facet F12
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:79-107 bulk skips duplicates and invalid IDs, returns successfully added subset.
- Expected fix: Present explicit full rollback and duplicate list; decide whether to restore legacy partial success.

## G2-17-002-058 [P1] GAP facet F12
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:494-531 staffing counts all program classes against active teaching assignments.
- Expected fix: Offer all-program-classes coverage or explicitly relabel current-term-only staffing.

## G2-17-002-077 [P1] GAP facet F19
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:63-139 scopes incremental GET to selected program/semester; concurrent distinct lookups.
- Expected fix: Add indexed selected-term reads/pagination or profile and bound initial data at large college scale.

## G2-17-002-082 [P1] GAP facet F20
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:79-107 partial-safe duplicate skips under concurrent inserts, unique DB constraint.
- Expected fix: Show precisely which course conflicted and safe retry actions; decide all-or-nothing contract.

## G2-18-010-007 [P1] GAP facet F02
- Files: src/modules/notifications/zeptomail-email.ts, src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Legacy college sender From address recruitment@42lms.com and Reply-To recruitment mailbox/tag (`TpoMailService.java:42-53,77-97`).
- Expected fix: Set verified recruiter From and safe Reply-To across environments; test inbox header.

## G2-18-003-076 [P1] GAP facet F13
- Files: src/app/(authenticated)/admin/courses/page.tsx
- Legacy: Legacy unscoped state warning plus global policy form. `docs/legacy-source/frontend/src/pages/superadmin/courses.js:11-29`
- Expected fix: Show policy editor; use warning banner not empty-only.

## G2-19-005-034 [P1] GAP facet F11
- Files: src/app/(authenticated)/learn/my-placements/calendar/page.tsx
- Legacy: Old deep links survive as redirect paths (including old notices) `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:5-8`
- Expected fix: Ensure deep links never bypass appropriate Schedule state and learner role checks.

## G2-19-005-035 [P1] GAP facet F12
- Files: src/modules/placements/learner-career-calendar-model.ts
- Legacy: Old schedule filters only visible un-applied deadlines `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:81-87` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:121-123`
- Expected fix: Enforce applied/visibility exclusion when adding deadlines.

## G2-19-005-036 [P1] GAP facet F12
- Files: src/modules/placements/learner-career-calendar-model.ts
- Legacy: Old blocked exam day notice says No drives run on it `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-170`
- Expected fix: Restore exam blackout warning and prevent falsely implying scheduled events are valid on blocked dates.

## G2-19-005-065 [P1] GAP facet F22
- Files: src/modules/placements/learner-career-calendar-model.ts
- Legacy: Old Schedule drew from legacy interviews, TPO calendar extras and jobs deadline records `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:70-112`
- Expected fix: Define read-only view mapping for old numeric interview IDs, blocked calendar rows and job deadlines.

## G2-19-004-041 [P1] MISSING facet F10
- Files: src/app/(authenticated)/learn/my-placements/schedule/page.tsx, src/modules/placements/learner-career-calendar-model.ts
- Legacy: Legacy GET college calendar extras with month start/end for BLOCKED exam dates `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:91-100` `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:186-191`
- Expected fix: Read college exam/blocked calendar events for selected displayed month.

## G2-19-004-048 [P1] MISSING facet F12
- Files: src/modules/placements/learner-career-calendar-model.ts
- Legacy: Legacy omits applied drive deadlines from calendar `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:121-123` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:163-170`
- Expected fix: Show un-applied drive deadlines only; use authorized applied check.

## G2-19-002-084 [P1] GAP facet F19
- Files: src/modules/courses/super-admin-content-directory-service.ts
- Legacy: Legacy class reorder sends full ordered list of selected-class content `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:940-956`
- Expected fix: Use dedicated all-content full list and bulk update API with bounded count and conflict checks.

## G2-19-008-027 [P1] GAP facet F11
- Files: src/modules/courses/learner-external-content-link-model.ts
- Legacy: Legacy frame sandbox allows same-origin and scripts `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:23-24`
- Expected fix: Use allowlisted signed storage URL and least-privilege iframe sandbox; avoid same-origin+scripts where untrusted.

## G2-2-006-017 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LS:172-182 resource title ≤255, one INSTRUCTIONS, nonempty sanitized HTML
- Expected fix: Restore typed resource editor, single instructions rule, HTML sanitizer.

## G2-2-007-032 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LC:129-137 catch stats exception individually, return stats:null
- Expected fix: Make counts best-effort per row or distinguish total query failure from row failure.

## G2-2-010-041 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LF:92-94 independent save may have concurrent setting changes
- Expected fix: Add row version/CAS and independent update capability; prevent lost policy edits.

## G2-2-013-022 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LC:76-78 students includes learners linked via class
- Expected fix: Preserve legacy count membership fallback or document deliberate status policy change.
