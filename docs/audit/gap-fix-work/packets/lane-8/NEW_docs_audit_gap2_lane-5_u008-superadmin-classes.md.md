# Work packet: NEW / MISSING items from docs/audit/gap2/lane-5/u008-superadmin-classes.md

7 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u008-superadmin-classes.md

## G2-5-008-004  [P1] GAP  facet F01 Purpose/entry/navigation  effort L
- Legacy: Schedule action opens class recurring scheduler Modal (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:389-426)
- vNext now: Schedule link anchors section schedule details (src/app/(authenticated)/admin/classes/page.tsx:84-85)
- Fix: Provide legacy recurrence modal action or exact equivalent.

## G2-5-008-012  [P1] GAP  facet F03 Visible elements  effort M
- Legacy: Option failure Retry warning inside form area (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:430-435)
- vNext now: SSR options read without independent per-lookup retry (src/app/(authenticated)/admin/classes/page.tsx:28-33)
- Fix: Add partial-option error banner with Retry.

## G2-5-008-030  [P1] GAP  facet F06 Forms  effort M
- Legacy: Edit Maximum students 1–200 same as create (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:91-105)
- vNext now: Edit capacity allows 1–10000 or blank unlimited (src/components/academics/college-section-management.tsx:206-209)
- Fix: Match upper bound and lowerLimit invariant.

## G2-5-008-035  [P1] GAP  facet F07 Validation/errors  effort L
- Legacy: Could not load programs/batches shows Retry options (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:429-435)
- vNext now: Promise.all list+options errors become SSR exception (src/app/(authenticated)/admin/classes/page.tsx:28-33)
- Fix: Catch data/option failures separately with retry.

## G2-5-008-045  [P1] GAP  facet F10 Actions/side effects  effort L
- Legacy: PUT /api/v1/class/update/:id allows permitted Program/Batch reassignment (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:274-285; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:181-216)
- vNext now: PATCH section forbids cohort/period mutation (src/modules/academics/college-section-mutation-service.ts:180-236)
- Fix: Support safe reassignment or written accepted gap.

## G2-5-008-052  [P1] GAP  facet F12 Business rules  effort M
- Legacy: Delete blocked when enrolled or active class schedules (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:403-425)
- vNext now: Archive/Restore has more dependencies and different result (src/components/academics/college-section-lifecycle-action.tsx:19-54)
- Fix: Specify delete dependency semantics and distinct archive safety.

## G2-5-008-077  [P1] GAP  facet F22 Data/migrations  effort L
- Legacy: Hard delete row after guards (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:225-255)
- vNext now: Soft archive/restore instead (src/components/academics/college-section-lifecycle-action.tsx:19-54)
- Fix: Explicit data retention decision and archival migration.
