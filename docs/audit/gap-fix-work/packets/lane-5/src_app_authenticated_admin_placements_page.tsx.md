# Work packet: edit src/app/(authenticated)/admin/placements/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u030-drives-landing.md, docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md

## G2-17-030-038  [P0] GAP  facet F11  effort M
- Legacy: GLOBAL placement policy superadmin only and prompts clear selection before editing; DrivesLanding.js:264-270
- vNext now: vNext admin policy controls on college-scoped page and no-college branch, service enforces superadmin; admin/placements/page.tsx:35-59,80-85
- Fix: Ensure no-college global override editor is actually available and save guarded as GLOBAL, not acting-college setting.

## G2-10-017-033  [P1] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:674-698 — Extend deadline prohibits past date, picker YYYY-MM-DD HH:mm, defaults +7d end of day.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:64-75 — Shortcut missing so no equivalent field validation.
- Fix: Restore datepicker and validation.

## G2-10-017-048  [P1] MISSING  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:74-88 — extendJobDeadline mutation within card; validated Important Date entry.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:64-75 — No equivalent on overview list.
- Fix: Wire deadline mutation with optimistic token and audit.

## G2-17-030-022  [P1] GAP  facet F06  effort L
- Legacy: New drive opens Modal width800 with JobForm; Duplicate same dialog prefilled duplicateFrom; DrivesLanding.js:656-672
- vNext now: New separate route `/admin/placements/new`, no landing dialog; admin/placements/new/page.tsx:9-38; admin/placements/page.tsx:68-74
- Fix: Restore width800 Create Drive dialog and duplicate-prefill, while preserving newer form validations.

## G2-17-030-058  [P1] GAP  facet F23  effort L
- Legacy: Legacy inline duplicate, deadline, retention and lookup actions embedded in one landing; DrivesLanding.js:565-698
- vNext now: vNext separate directory/create/deadline/retention/student lookup pages; admin/placements/page.tsx:28-84; admin/placements/drives/page.tsx:80-115
- Fix: Restore first-class actions in landing while keeping routable backup workflows.

## G2-15-026-001  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:41-51 /api/v1/admin/placement/jobs for organization-scoped admin jobs (vasan)
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:34-71 /admin/placements requires selected college and labels 'Drives'
- Fix: Restore org-scoped authorized view (or explicit redirect/UX parity waiver), retaining College Admin isolation

## G2-15-026-002  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:139-163 GET job list and 169-199 individual job endpoint
- vNext now: src/modules/placements/job-service.ts:86-148 list/get under college, src/app/(authenticated)/admin/placements/page.tsx:61-69 new drive action
- Fix: Provide scoped legacy Jobs -> Drives mapping and direct job detail link

## G2-15-026-035  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:76-81 feature flag placements enabled required on all endpoints
- vNext now: src/modules/placements/job-service.ts:86-93 requirePlacementManageScope, src/app/(authenticated)/admin/placements/page.tsx:19-21 scope/read checks
- Fix: Verify placement module toggle at every job read/write endpoint and active tenant lock

## G2-15-026-037  [P1] GAP  facet F11  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:83-108 global/org/scoped Super Admin resolves org, not college
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:34-48 global admin must select college
- Fix: Support org-scoped aggregate read for global Super Admin without unsafe mutations

## G2-15-026-065  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:139-163 org-wide jobs endpoint supports cross-college context
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:34-48 selected college mandatory
- Fix: Document intentional restriction but restore authorized aggregate read for org/global admins

## G2-10-017-039  [P2] MISSING  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:74-88 — Extend deadline success and failure message toasts.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:64-75 — No card-level extend action or toast.
- Fix: Reintroduce action-specific feedback.
