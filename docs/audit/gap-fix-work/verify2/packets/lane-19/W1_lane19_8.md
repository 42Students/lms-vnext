# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-023-018 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: TpoDataTable select rows and per-type bulk action (RequestsPanel.js:260-312,430-434).
- Expected fix: Restore discoverable selection controls and safe cross-page selection behavior.

## G2-11-029-022 [P1] MISSING facet F09
- Files: (none, new feature)
- Legacy: UnsavedFormGuard prevents window unload and in-app navigation via confirmation (sprints.js:37-39; useUnsavedFormGuard.js:17-55).
- Expected fix: Protect unsaved form across Back, tabs, sidebar, refresh and browser close.

## G2-14-029-011 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: useUrlFilters applies class and journey to all loaded roster (batches/[batchId].js:69-71,262-286,430-435).
- Expected fix: Make all filters operate over full cohort before paging.

## G2-6-025-027 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Legacy ResourceUploadReceiptAdvice binds receipts to first saved Resource, checks R2 HEAD and consumes receipt (ResourceUploadReceiptAdvice.java:46-63,125-164).
- Expected fix: Add atomic FILE grant/complete/attach, consumed token, object head, scan and tenant binding.

## G2-6-002-061 [P1] GAP facet F12
- Files: src/components/admin/scoped-membership-lifecycle-actions.tsx
- Legacy: Old status uses suspendedAt on faculty with session-wide lockout, different from college membership `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:491-513` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:793-801`
- Expected fix: Document deliberate account-vs-membership access change and enforce correct session scope

## G2-6-030-048 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy delete blocked if any class schedule, regardless future/past (LectureHallServiceImpl.java:143-152).
- Expected fix: Document archive-only future guard and historical usage rule; verify retention and reporting.

## G2-6-023-006 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: Legacy eligible student counts, invited status, registered, verified, placed in overview (PlacementEligibilityService.java:366-425).
- Expected fix: Expose exact counts and quick-action badges per batch from authorized queries.

## G2-13-023-007 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LBE/service/tpo/TpoScheduleService.java:343-357 returns roundId/name/kind, jobId, company, title, room, startsAt/endsAt, mode, meetingUrl, whatToBring, confirmedAt.
- Expected fix: Create field-level schedule DTO parity: jobId, slot starts/ends/room, whatToBring, confirmedAt, nullable placeholders.

## G2-14-030-025 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:173-183 unchanged time allowed even if past, changed past rejected with exact error; invalid online URL error.
- Expected fix: Permit untouched historical interview edit where safe; preserve exact meeting error.

## G2-17-021-047 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/Job.java:22-121 has text/status/date fields, including raw important_dates JSON.
- Expected fix: Design row-level migration preserving public responsibilities, dates, salary, original slug and published timestamp.

## G2-18-021-061 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LBE/dto/response/JobImportantDateEventDTO.java:20-26 subtype backed by producer type/dateType fallback.
- Expected fix: Make calendar multi-source: job important dates, existing booked rounds, blocked college dates with consistent legend, ICS and event links.

## G2-7-001-048 [P1] GAP facet F14
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:368-392: CSV file `at-risk-projects.csv`; headers Workspace/Mentor/Status/Severity/Risk reasons.
- Expected fix: Restore five headers, true Status values, and legacy filename.

## G2-7-004-002 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:244-262: `?projectId=` deep link hydrates selected workspace and mirrors it.
- Expected fix: Resolve scoped UUID directly independent of first-1000 choice list, preserving deep links.

## G2-7-004-020 [P1] GAP facet F05
- Files: src/components/projects/admin-readiness-workspace-picker.tsx
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:490-512: workspace choices server-paged at 25; shows `a–b of N`.
- Expected fix: Implement full backend-paginated search with accurate totals over >1000 workspaces.

## G2-7-005-031 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:69-74: college is browsing global platform catalog read-only, superadmin authors.
- Expected fix: Determine whether old catalog exposed all published templates; if so add read-only browsing or assignment explanation.

## G2-7-008-014 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:118-135: Reviewed by, Reviewed at, Mentor feedback; missing feedback sentence.
- Expected fix: Join reviewer profile/time and use exact feedback fallback copy.

## G2-7-010-017 [P1] GAP facet F06
- Files: src/components/projects/project-workspace.tsx
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:61-81: explicit Form validation+submit, Save plan once, disabled while saving.
- Expected fix: Offer bulk editing Save plan with pending/disabled state.

## G2-7-011-024 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:63-68: Deliverables validator requires at least one non-empty line.
- Expected fix: Require at least one deliverable for college-admin edit (or document intentional policy change).

## G2-7-012-005 [P1] GAP facet F02
- Files: src/components/projects/project-workspace.tsx
- Legacy: WorkspaceReadinessOverview.jsx:45-74 hero Card then progress then four metrics
- Expected fix: Restore full hero and order

## G2-7-012-006 [P1] MISSING facet F02
- Files: src/components/projects/project-workspace.tsx
- Legacy: WorkspaceReadinessOverview.jsx:76-105 override alert or no-override card below hero
- Expected fix: Render override detail card or empty state

## G2-7-012-008 [P1] MISSING facet F03
- Files: src/components/projects/project-workspace.tsx
- Legacy: WorkspaceReadinessOverview.jsx:50-56 Submission readiness eyebrow headline and Ready/Not ready tag
- Expected fix: Restore heading and status tag

## G2-7-012-022 [P1] GAP facet F07
- Files: src/components/projects/project-workspace.tsx
- Legacy: WorkspaceReadinessOverview.jsx:16-25 warning Readiness snapshot is unavailable with detailed explanation
- Expected fix: Handle missing snapshot and Retry

## G2-7-012-032 [P1] GAP facet F10
- Files: src/components/projects/project-workspace.tsx
- Legacy: readiness.js:78-82 navigate to college override manager
- Expected fix: Fix destination and enforce scoped role

## G2-7-012-036 [P1] GAP facet F12
- Files: src/components/projects/project-workspace.tsx
- Legacy: WorkspaceReadinessOverview.jsx:28,52-55 uses server readyForSubmission boolean
- Expected fix: Expose effective readiness including override

## G2-7-012-040 [P1] GAP facet F13
- Files: src/components/projects/project-workspace.tsx
- Legacy: WorkspaceReadinessOverview.jsx:16-25 unavailable-snapshot warning
- Expected fix: Guard and render warning instead of runtime error

## Fast verification triage (2026-10-22)

- G2-11-023-018: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-11-029-022: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-14-029-011: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-6-025-027: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-6-002-061: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-6-030-048: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-6-023-006: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-13-023-007: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-14-030-025: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-17-021-047: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-18-021-061: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-001-048: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-004-002: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-004-020: OK — matching implementation observed in targeted source inspection.
- G2-7-005-031: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-008-014: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-010-017: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-011-024: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-012-005: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-012-006: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-012-008: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-012-022: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-012-032: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-012-036: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
- G2-7-012-040: DEFERRED — requires additional source, permission or runtime parity verification; no fix asserted.
