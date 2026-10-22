# Verification packet (P1 round 2): 11 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-8-022-002 [P1] MISSING facet F01
- Files: (none, new feature)
- Legacy: Old /api/v1/tpo/season/current returns most recently started isCurrent season (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:39-42; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-29).
- Expected fix: Provide current-season resolution and deep-link compatibility, or document removed endpoint.

## G2-9-001-074 [P1] MISSING facet F23
- Files: src/app/(authenticated)/college/activity/page.tsx
- Legacy: Day grouping, bulk badges, inline details, append count (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:232-259`)
- Expected fix: Restore day-grouped feed and inline details/count before signoff.

## G2-9-007-049 [P1] GAP facet F11
- Files: src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/electives.js:20-31` — College unassigned displays warning
- Expected fix: Show consistent explanatory no-scope/forbidden state

## G2-9-015-056 [P1] GAP facet F09
- Files: src/app/(authenticated)/college/placements/drives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:426-469` — Delete modal shows impacted applications, learners, interviews, preserved records.
- Expected fix: Integrate archive impact confirmation with affected applicant/interview counts.

## G2-9-012-010 [P1] MISSING facet F03
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:897-911` — Red attention Conflicts button with count toggles conflicts-only
- Expected fix: Compute overlapping candidate/room conflicts and filter when clicked

## G2-9-013-054 [P1] GAP facet F10
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:718-750` — GET /api/v1/admin/jobs/{id}?collegeId, GET hiring metrics; PUT /api/v1/admin/jobs/{id}; POST /status with {isActive}.
- Expected fix: Document payload translation per field, preserve legacy status semantics where safe.

## G2-9-014-048 [P1] MISSING facet F09
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:215-220` — Separate single/bulk Reject and bulk-failure detail modals.
- Expected fix: Build confirmation/reason and per-row failure detail.

## G2-9-020-019 [P1] GAP facet F05
- Files: src/modules/verification/staff-queue-service.ts
- Legacy: Legacy UI local queue first 1000, all-row search/filter `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:35-36,417-431`
- Expected fix: Enforce count/filter semantics over entire matching college dataset and transparent cap.

## G2-9-020-060 [P1] GAP facet F19
- Files: src/modules/verification/staff-queue-service.ts
- Legacy: Legacy frontend loads all queue up to1000 and local sorting/filtering `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:35-36,169-181,423-431`
- Expected fix: Avoid misleading counts/hidden rows when 1000 candidate cap reached.

## G2-15-027-041 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/faculty/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/ProtectedFacultyRoles.java:21-54 ADMIN/TPO may be granted/managed only superadmin; self-edit exemption
- Expected fix: Apply protected-role mutation fence across onboarding, lifecycle and profile paths.

## G2-9-029-055 [P1] MISSING facet F14
- Files: src/app/(authenticated)/admin/batches/page.tsx
- Legacy: batches.csv export filtered rows with key fields `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-548`
- Expected fix: Reinstate CSV export with legacy headers, code-injection safety

## Lane 9 verification disposition (2026-10-22)

- DEFERRED — G2-8-022-002: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-9-001-074: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-9-007-049: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-9-015-056: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-9-012-010: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-9-013-054: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-9-014-048: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-9-020-019: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-9-020-060: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-15-027-041: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-9-029-055: implementation and regression checks not independently completed; no parity claim.
