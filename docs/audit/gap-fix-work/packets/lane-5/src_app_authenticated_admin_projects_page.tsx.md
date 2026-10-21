# Work packet: edit src/app/(authenticated)/admin/projects/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md, docs/audit/gap2/lane-7/u031-superadmin-projects-index.md, docs/audit/gap2/lane-10/cross-10-list-conventions.md

## G2-10-028-002  [P1] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:352-361 — Create workspace, Bulk reassign mentor and Deleted workspaces buttons visible.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:140-151 — first two nested in More; Deleted absent.
- Fix: Expose three separate header actions and deleted destination.

## G2-10-028-018  [P1] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:444-461 — default table and inline table pagination.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:158-162; src/modules/projects/admin-projects-query-model.ts:10-16 — rendered default cards, schema defaults table.
- Fix: Unify default table selection.

## G2-11-028-001  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:12-13`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:27-38`
- Fix: Legacy route /superadmin/projects/workspaces/deleted is a dedicated discoverable page; vNext has no corresponding /admin/projects/workspaces/deleted or route alias in app tree.

## G2-11-028-002  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:353-361`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:140-153`
- Fix: Legacy main workspace list has explicit Deleted workspaces button; vNext More menu includes Create workspace and Bulk reassign mentor but not Deleted workspaces.

## G2-11-028-070  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:145-209`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:137-201`
- Fix: No dedicated Deleted workspaces page and no navigation entry on vNext; Archived status filter is only a related, non-equivalent lifecycle.

## G2-7-031-021  [P1] GAP  facet F11  effort M
- Legacy: superadmin/projects/index.js:10-15 templates first is Super Admin catalogue authoring not per-college workspace
- vNext now: admin/projects/page.tsx:37-49 selected college required to see workspaces; admin/projects/templates/page.tsx:26-47 global template permission
- Fix: Land on template catalogue to avoid bogus select-college state for Super Admin

## G2-10-031-030  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:812-820 — Couldn't refresh drives warning and Showing last drives loaded.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:104-130 — project generic ErrorState replacement.
- Fix: Retain stale view with warning and Retry.

## G2-10-028-028  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:315-323 — invalid collegeId 400, unauthenticated 401.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:37-49,51-69 — typed access-denied/no-scope states.
- Fix: Maintain legacy safe actionable error coverage.

## G2-11-028-023  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:58-66`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:120-128`
- Fix: Legacy Failed to load deleted workspaces. error plus Alert Deleted workspaces could not be loaded; vNext generic Project workspaces unavailable and Retry loading workspaces.

## G2-10-028-026  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:165-179 — Failed to load project workspaces fallback.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:120-130 — Project workspaces unavailable/ErrorState.
- Fix: Preserve source failure copy.

## G2-11-028-028  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:158-160`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:124-128`
- Fix: Legacy deleted fetch error has Retry inside Empty card; vNext Retry loading workspaces link, no deleted-only error copy.
