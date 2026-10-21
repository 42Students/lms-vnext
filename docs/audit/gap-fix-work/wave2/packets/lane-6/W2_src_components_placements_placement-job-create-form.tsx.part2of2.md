# Work packet (wave 2): edit src/components/placements/placement-job-create-form.tsx (part 2 of 2)

27 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-new.md, docs/audit/gap2/lane-3/tpo-drive-controller.md, docs/audit/gap2/lane-10/superadmin-sections-job-form.md

## G2-11-013-020  [P2] GAP  facet F05  effort M
- Legacy: Default roleOptions has a named Default entry. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:195`
- vNext now: Single job-level compensation, no package choice. `src/components/placements/placement-job-create-form.tsx:1004`
- Fix: Create default named package row.

## G2-11-013-022  [P2] GAP  facet F05  effort M
- Legacy: Initial rounds empty, individually addable. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:195`
- vNext now: Round preset defaults NONE, no individual add. `src/components/placements/placement-job-create-form.tsx:141`
- Fix: Add arbitrary draft round rows with no preset.

## G2-11-013-023  [P2] GAP  facet F05  effort M
- Legacy: OFF_CAMPUS reveals company application link. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:606`
- vNext now: External application URL depends on application mode. `src/components/placements/placement-job-create-form.tsx:1064`
- Fix: Map old drive-mode-dependent external URL.

## G2-11-013-027  [P2] GAP  facet F06  effort S
- Legacy: CTC numeric steps 0.5 LPA. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:628`
- vNext now: Free numeric LPA min/max steps differ. `src/components/placements/placement-job-create-form.tsx:1008`
- Fix: Match increments or document approved precision change.

## G2-11-013-046  [P2] GAP  facet F10  effort M
- Legacy: Publish saves draft then opens ?publish=1 on detail. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:458`
- vNext now: Creation redirects workspace after draft, no publish query. `src/components/placements/placement-job-create-form.tsx:643`
- Fix: Offer same publish continuation deep link.

## G2-11-013-048  [P2] GAP  facet F11  effort M
- Legacy: Server autosave not started before company+role minimum3. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:290`
- vNext now: New explicit create validates company before publish, no server debounce. `src/components/placements/placement-job-create-form.tsx:330`
- Fix: Apply minimum draft identity guard before server save.

## G2-11-013-052  [P2] GAP  facet F12  effort M
- Legacy: OFF_CAMPUS URL displayed only for company-site mode. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:607`
- vNext now: New external application field keyed by INTERNAL/HYBRID/EXTERNAL_ONLY. `src/components/placements/placement-job-create-form.tsx:1064`
- Fix: Map old off-campus semantics to new application modes.

## G2-11-013-058  [P2] MISSING  facet F13  effort M
- Legacy: Reach error labels Eligibility preview unavailable, never stale count. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:745`
- vNext now: No pre-save preview state. `src/components/placements/placement-job-create-form.tsx:1446`
- Fix: Add correct unknown/retry state.

## G2-11-013-066  [P2] GAP  facet F16  effort L
- Legacy: Responsive AntD Row/Col xs24 md8. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:557`
- vNext now: New sm grids with different breakpoint density. `src/components/placements/placement-job-create-form.tsx:903`
- Fix: Clone pixel spacing at mobile/tablet/desktop.

## G2-11-013-067  [P2] GAP  facet F16  effort M
- Legacy: Review rail stays visible beside form. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:728`
- vNext now: Collapsible review above form. `src/components/placements/placement-job-create-form.tsx:693`
- Fix: Restore sticky desktop aside.

## G2-11-013-068  [P2] GAP  facet F16  effort M
- Legacy: Pay package rows densely aligned across six columns. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:620`
- vNext now: Job compensation fields in generic two/three-col grid. `src/components/placements/placement-job-create-form.tsx:1004`
- Fix: Use old pay package subcards and grid.

## G2-11-013-069  [P2] MISSING  facet F17  effort S
- Legacy: Round remove accessible name Remove this round. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:715`
- vNext now: Static template summary list with no removal. `src/components/placements/placement-job-create-form.tsx:1436`
- Fix: Restore accessible individual round removal.

## G2-11-013-073  [P2] GAP  facet F18  effort S
- Legacy: Section The drive. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:583`
- vNext now: Section Drive details. `src/components/placements/placement-job-create-form.tsx:903`
- Fix: Use exact legacy heading.

## G2-11-013-074  [P2] MISSING  facet F18  effort S
- Legacy: Pay packages heading. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:620`
- vNext now: No dedicated pay heading. `src/components/placements/placement-job-create-form.tsx:1004`
- Fix: Add heading and repeatable rows.

## G2-11-013-075  [P2] GAP  facet F18  effort M
- Legacy: Who this reaches has live eligible/excluded counts. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:737`
- vNext now: Same heading with explanatory deferred preview. `src/components/placements/placement-job-create-form.tsx:1445`
- Fix: Restore live count and status copy.

## G2-11-013-078  [P2] GAP  facet F19  effort M
- Legacy: Refresh reach after successful save. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:274`
- vNext now: Reach deferred to workspace. `src/components/placements/placement-job-create-form.tsx:1446`
- Fix: Recompute count before release.

## G2-11-013-082  [P2] GAP  facet F20  effort M
- Legacy: Autosave timer cleared and coalesced. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:327`
- vNext now: Local backup timer coalesced. `src/components/placements/placement-job-create-form.tsx:272`
- Fix: Use server CAS if restoring autosave.

## G2-11-013-084  [P2] GAP  facet F21  effort M
- Legacy: Publish handoff retains intent via ?publish=1. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:465`
- vNext now: New draft route does not preserve publish intent. `src/components/placements/placement-job-create-form.tsx:643`
- Fix: Support safe publish deep link.

## G2-11-013-093  [P2] GAP  facet F23  effort M
- Legacy: Draft save can proceed to publish immediately. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:437`
- vNext now: New Create draft completes without direct publish path. `src/components/placements/placement-job-create-form.tsx:1454`
- Fix: Offer publish continuation once saved.

## G2-3-023-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:77-90`
- vNext now: `src/components/placements/placement-job-create-form.tsx:675-690`
- Fix: Legacy detail hydrates persisted Last saved by faculty and timestamp; new browser-draft save indicator is not equivalent shared provenance.

## G2-3-023-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:93-110`
- vNext now: `src/components/placements/placement-job-create-form.tsx:675-704`
- Fix: Legacy create/edit is a basic draft form; VNext Company/Drive details/Eligibility/Publish review steps differ in hierarchy and labels.

## G2-3-023-011  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:93-110`
- vNext now: `src/components/placements/placement-job-create-form.tsx:300-383`
- Fix: Legacy POST/PUT JSON DriveForm differs from VNext multi-step form; map required field validation and publish review.

## G2-3-023-037  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:56-61`
- vNext now: `src/modules/placements/job-service.ts:254-265`, `src/components/placements/placement-job-create-form.tsx:645-651`
- Fix: Legacy audit codes and Last saved by not displayed with same copy as VNext draft created/local-draft messages.

## G2-3-023-049  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:77-90`
- vNext now: `src/components/placements/placement-job-create-form.tsx:675-690`
- Fix: No shown persisted Last saved by counterpart; add shared server actor/time in editor.

## G2-10-030-009  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:619-627 — Job Title placeholder e.g., Software Engineer, max100.
- vNext now: src/components/placements/placement-job-create-form.tsx:913-926 — Job title placeholder Software Development Engineer, min3 max100.
- Fix: Use exact source title placeholder.

## G2-10-030-027  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1036-1076 — Preferred graduation year digits 1990..2050, GPA 0..10.
- vNext now: src/components/placements/placement-job-create-form.tsx:1180-1188 — HTML number controls for same ranges but altered labels/max length.
- Fix: Align placeholders/error messages.

## G2-11-013-062  [P3] GAP  facet F14  effort S
- Legacy: Wanted skills choose tags. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:695`
- vNext now: New comma-separated max30 skills textarea. `src/components/placements/placement-job-create-form.tsx:1157`
- Fix: Preserve tag-style interaction and max lengths.
