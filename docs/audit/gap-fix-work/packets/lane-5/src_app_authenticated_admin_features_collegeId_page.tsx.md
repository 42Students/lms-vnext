# Work packet: edit src/app/(authenticated)/admin/features/[collegeId]/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l14-u024-superadmin-feature-controller.md, docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-4/superadmin-module-access.md

## G2-14-024-012  [P1] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:243-252 — preview four placements counters in one payload
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:160-169 — placement impact disclosure offers policy prose, not same four counts
- Fix: Add active jobs/in-progress/pending offers/upcoming interviews to disabling review.

## G2-14-024-027  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:63-86 — Placements college-level-only, lower learner/class/department ignored
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-267 — academic scopes include Placements and can alter individual access
- Fix: Resolve old college-only Placements versus vNext learner academic override product change.

## G2-14-024-037  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:243-247 — counts across active jobs, applications, offers, interviews
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:160-169 — policy impact narrative only
- Fix: Provide bounded aggregate counts from verified data source.

## G2-10-019-006  [P1] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:641-702 — info banner, warning/status banners, Ant hierarchical table without pagination.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:128-172,210-315 — College cards, ancestor DataTable, descendant selector and paginated stored rules.
- Fix: Replace split-list layout with expandable full hierarchy tree.

## G2-10-019-014  [P1] GAP  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:506-513 — 'Placement cell decides' textual state with tooltip for eligibility-controlled cells.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-250; src/components/admin/descendant-feature-rule-editor.tsx:53-66 — Placements mutable selector appears for academic scope.
- Fix: Determine where eligibility is authoritative; avoid falsely editable cells.

## G2-10-019-015  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:550-576 — Effective status text on/off, explicit ON/OFF pill, lock icon, inherited-from suffix, crossed shadowed state.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:225-241,271-285 — Flat inherited/stored badges, no integrated tree cell-level status provenance.
- Fix: Render every status provenance cue in each tree cell.

## G2-10-019-023  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:65-87,698-703 — Hierarchical tree expandable by parent, no pagination.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:271-315 — Flat stored lower-level rules, paginated (30/page), skips nodes without stored values.
- Fix: Include every academic node even with no override; support parent expand/collapse.

## G2-10-019-051  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:217-232; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:46-67 — GET /api/v1/admin/module-access/tree?collegeId loads entire resolved hierarchy.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:36-37; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:67-71 — DB reads college directory then one selected-college module decisions and paged rules.
- Fix: Provide tree DTO of all nodes with resolved module decisions/counts.

## G2-10-019-095  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:217-257 — Fetches full resolved college tree at once, potentially hundreds of nodes.
- vNext now: src/modules/module-access/admin-read-service.ts:47-48; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-315 — New limited lists may omit unconfigured nodes.
- Fix: Balance full parity with paginated hierarchy data, guarantee no silently missing nodes.

## G2-10-019-036  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:46-66 — GET tree requires positive college ID; 400 `collegeId is required`, 403, 500 `Failed to read module access tree`.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:27-37; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:46-68 — UUID route strict validation and notFound or generic filter error.
- Fix: Document route compatibility and present exact error class/clear recovery.

## G2-10-019-037  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:249-257,694-696 — Failure 'Couldn't load module access' with backend description.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:30-35; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:52-64 — Invalid filters error only; failed scoped read renders route failure.
- Fix: Show read failure banner and retry without hiding other modules.

## G2-4-030-029  [P2] GAP  facet F07  effort M
- Legacy: Couldn't load student overrides with Retry (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:682-684`)
- vNext now: Empty persisted overrides state instead (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:273-277`)
- Fix: Add per-source override lookup error banner and retry.
