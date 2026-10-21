# Work packet: edit src/app/(authenticated)/admin/module-access/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-4/superadmin-module-access.md

## G2-10-019-001  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/module-access.js:9-25 — /superadmin/module-access resolves header selected college; no college is warning-only.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:23-42 — /admin/module-access shows paginated college directory regardless scope; no automatic selected-college tree.
- Fix: Render scoped editor directly for selected college; preserve dedicated path and fallback warning.

## G2-10-019-003  [P1] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:605-639 — Search learner and Recent changes, Expand all, Collapse all, Refresh in top overview actions.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:40-82 — Feature Controls button and college search, absent direct hierarchy controls.
- Fix: Put original actions on hierarchy surface and show college selector current scope.

## G2-10-019-008  [P1] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:605-615 — Overview metrics hierarchy scopes, largest learner count, student overrides.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:43-50 — Same label set, but derived from visible college page, not selected single college.
- Fix: Calculate selected-college metrics only with hierarchy data.

## G2-10-019-018  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:611-615 — Student overrides metric counts distinct learners with rules or legacy locks.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:48-49 — `scopeMetrics.studentOverrides` counts stored membership rules, not distinct students.
- Fix: Count distinct learner memberships including lock-only cases.

## G2-10-019-051  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:217-232; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:46-67 — GET /api/v1/admin/module-access/tree?collegeId loads entire resolved hierarchy.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:36-37; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:67-71 — DB reads college directory then one selected-college module decisions and paged rules.
- Fix: Provide tree DTO of all nodes with resolved module decisions/counts.

## G2-10-019-058  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/module-access.js:7-23 — No selected college disallows hierarchy display entirely.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:23-38 — Can list colleges and overview without selected college.
- Fix: Preserve strict college-scoped editor; directory is separate.

## G2-10-019-036  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:46-66 — GET tree requires positive college ID; 400 `collegeId is required`, 403, 500 `Failed to read module access tree`.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:27-37; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:46-68 — UUID route strict validation and notFound or generic filter error.
- Fix: Document route compatibility and present exact error class/clear recovery.

## G2-10-019-037  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:249-257,694-696 — Failure 'Couldn't load module access' with backend description.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:30-35; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:52-64 — Invalid filters error only; failed scoped read renders route failure.
- Fix: Show read failure banner and retry without hiding other modules.

## G2-4-030-028  [P2] GAP  facet F07  effort M
- Legacy: Failed load displays Could not load module access. (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:249-256`)
- vNext now: Invalid feature filters is separate ErrorState; detail load can notFound (`src/app/(authenticated)/admin/module-access/page.tsx:30-35`)
- Fix: Distinguish API failure from malformed query and show retry.
