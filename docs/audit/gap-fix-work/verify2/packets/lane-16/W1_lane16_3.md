# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-15-002-071 [P1] GAP facet F19
- Files: src/modules/placements/college-placement-student-lookup-service.ts
- Legacy: Legacy search uses in-memory learner cache with search limit10; selected summary single jobService fetch (`LearnerSearchController.java:95-103,129-137`; `AdminJobServiceImpl.java:1889-1899`).
- Expected fix: Avoid N+1 work: first fetch 10 suggestions then one selected learner summary; add bounded indexed pagination.

## G2-15-002-079 [P1] GAP facet F22
- Files: src/modules/placements/college-placement-student-lookup-service.ts, src/db/schema/placements.ts
- Legacy: Legacy learner search IDs integer learnerId and job application IDs; application-view stage, rejectionReason, nextInterview DTO (`StudentPlacementLookup.js:88-103,184-200`; `LearnerApplicationWithInterviewsDTO.java:21-28,40-54,145-193`).
- Expected fix: Define one-to-one legacy learner/application stage mapping, reason/interview joins and stable identity policy.

## G2-15-002-081 [P1] GAP facet F22
- Files: src/modules/placements/college-placement-student-lookup-service.ts, src/db/schema/placements.ts
- Legacy: Legacy summary rows conceptually one per placement application, with next interview DTO (`AdminJobServiceImpl.java:1889-1899`; `LearnerApplicationWithInterviewsDTO.java:21-28`).
- Expected fix: Aggregate offers per application deterministically and avoid misleading duplicate history entries.

## G2-15-005-025 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy app confirmation has Role Company Resume summary and What exactly gets shared? (JobDetailContent.jsx:1378-1437)
- Expected fix: Accurately disclose whether resume/contact shared, align value with backend POST payload

## G2-15-005-049 [P1] GAP facet F12
- Files: src/modules/placements/learner-drive-apply-model.ts
- Legacy: Legacy withdrawn may be eligible for early reapply and displayed notice (JobDetailContent.jsx:1060-1063)
- Expected fix: Document early-stage reapply policy and show applicable action or official team appeal

## G2-15-007-017 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/groups/page.tsx
- Legacy: Legacy student groups deliberately disabled due no consumer (`student-groups.js:6-12`)
- Expected fix: Enforce explicit feature readiness/visibility gate, document owner permission to release

## G2-16-002-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/tracker/page.tsx
- Legacy: `index.js:191-195,344`; `TrackerShell.jsx:52-69`: public `/tracker` reporting landing, standalone branded shell and Report Issue link; no login needed.
- Expected fix: Restore anonymous intake with approved restricted reporter-session model, or explicitly record signed-in-only policy and adjust external entry links.

## G2-16-006-012 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: `index.js:13-20`: redirects to /home even if cls query provided; no query parsing or sorting.
- Expected fix: Preserve cls; leave home tab to validate class scope.

## G2-16-006-024 [P1] GAP facet F12
- Files: src/modules/courses/learner-course-tab-context-model.ts
- Legacy: `index.js:13-16`: preserves raw query suffix verbatim, including cls and unknown params.
- Expected fix: Share the safe persistent query function with base redirect; preserve allowed unknown query keys with bounds.

## G2-16-027-046 [P1] GAP facet F12
- Files: src/modules/attendance/faculty-schedule-mutation-model.ts, src/modules/attendance/faculty-schedule-editor-model.ts
- Legacy: ClassScheduleServiceImpl.java:149-157,305-318 enforces a 12-hour maximum in transactional create service.
- Expected fix: Revalidate <=12h in server command/schema so direct POST cannot bypass browser guard.

## G2-16-028-015 [P1] GAP facet F06
- Files: src/components/projects/project-resource-controls.tsx
- Legacy: projectSectionFieldConfigs.js:144-165 Type picker values Link, PDF, DOC, PPT, Video, File.
- Expected fix: Map legacy PDF/DOC/PPT/Video values to explicit supported types and preserve value during edits.

## G2-16-028-046 [P1] GAP facet F20
- Files: src/components/projects/project-resource-controls.tsx, src/modules/projects/resource-service.ts
- Legacy: resources.js:40-58 guards untouched saves, echoes resourcesToken and reseeds after reload, preventing blind array clobber.
- Expected fix: Use optimistic section version and idempotent Save for multi-tab replay.

## G2-17-007-015 [P1] GAP facet F05
- Files: src/components/courses/college-learning-directory.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:390-405 — Five static columns plus conditional drag handle and Actions; row selection checkbox column.
- Expected fix: Restore Actions column and in-table selection with preserved keys.

## G2-17-007-028 [P1] MISSING facet F06
- Files: src/components/courses/college-learning-directory.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:294-301 — On dirty edit close, confirms `Discard edits to ...?` then `Unsaved changes will be lost.`
- Expected fix: Implement dirty edit detection and exact discard confirmation.

## G2-17-007-039 [P1] MISSING facet F09
- Files: src/components/courses/college-learning-directory.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:531-541 — Edit modal includes form, save-disabled state and unsaved guard.
- Expected fix: Build legacy-equivalent modal and guard.

## G2-17-007-040 [P1] MISSING facet F09
- Files: src/components/courses/college-learning-directory.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:542-555 — Delete modal requires typing exact lesson title; button says `Delete lesson and its files`.
- Expected fix: Restore typed-name confirmation; verify actual file policy against label.

## G2-17-005-010 [P1] GAP facet F04
- Files: src/app/(authenticated)/learn/my-placements/interviews/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:18-31 maps legacy interview table records and calendar extras into schedule list.
- Expected fix: Ensure consolidated Schedule includes older scheduled interview records, tests, deadlines, blocked days as legacy does.

## G2-17-005-042 [P1] GAP facet F22
- Files: src/modules/placements/learner-interview-deeplink-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:24-30 maps legacy numeric IDs with prefix iv- and nonstandard assessment/test IDs.
- Expected fix: Translate or discard legacy iv-/test- bookmark references intentionally; do not expose 404 for previously valid old moved links.

## G2-17-021-019 [P1] GAP facet F10
- Files: src/modules/placements/company-share/public-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:34-40 — Screening rules and identities intentionally excluded.
- Expected fix: Do not accidentally expose internal job applicant or targeting fields through public route.

## G2-17-021-035 [P1] GAP facet F20
- Files: src/modules/placements/company-share/public-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:31 — Unvalidated generic map importantDates may leak arbitrary fields.
- Expected fix: Sanitize date-map keys and prevent internal key reflection.

## G2-18-003-068 [P1] MISSING facet F11
- Files: src/app/(authenticated)/admin/courses/page.tsx
- Legacy: Legacy global progress policy editable only when no college selected, super-admin. `docs/legacy-source/frontend/src/pages/superadmin/courses.js:11-29`, `docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:20-25`
- Expected fix: Permit global policy within designated platform configuration view, link from Courses if intentionally relocated.

## G2-19-005-031 [P1] MISSING facet F10
- Files: src/app/(authenticated)/learn/my-placements/calendar/page.tsx
- Legacy: Old Schedule month blocked-day GET uses visible start/end `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:91-101`
- Expected fix: Wire selected-month college BLOCKED events API with cache/auth.

## G2-2-006-016 [P1] MISSING facet F06
- Files: (none, new feature)
- Legacy: LS:152-164 1-30 resources and at least one distinct submission method
- Expected fix: Build resource form and enforce count/unique methods/validation before save.

## G2-2-007-017 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: LL:408-413 class options sorted alphabetically, class filter exact ID
- Expected fix: Add class/sectionId exact filtering across assignments and stats.

## G2-2-010-030 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LF:106-118 reset deletes override row
- Expected fix: Restore inheritance semantics, avoid immutable default override.

## Lane-12 fast verification triage (2026-10-22)

OK (limited to cited behavior inspected in vNext): G2-17-021-019.

DEFERRED — not verified or fixed; needs deeper implementation, policy, API or migration review: G2-15-002-071, G2-15-002-079, G2-15-002-081, G2-15-005-025, G2-15-005-049, G2-15-007-017, G2-16-002-001, G2-16-006-012, G2-16-006-024, G2-16-027-046, G2-16-028-015, G2-16-028-046, G2-17-007-015, G2-17-007-028, G2-17-007-039, G2-17-007-040, G2-17-005-010, G2-17-005-042, G2-17-021-035, G2-18-003-068, G2-19-005-031, G2-2-006-016, G2-2-007-017, G2-2-010-030.
Triage is complete, parity verification is not. Do not interpret deferred rows as completed fixes.
