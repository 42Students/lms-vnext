# Work packet: edit src/components/placements/placement-job-create-form.tsx (part 2 of 2)

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-new.md, docs/audit/gap2/lane-3/tpo-drive-controller.md, docs/audit/gap2/lane-10/superadmin-sections-job-form.md

## G2-11-013-076  [P1] GAP  facet F19  effort L
- Legacy: 1200ms server draft autosave. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:327`
- vNext now: 400ms browser backup, no server save until submitted. `src/components/placements/placement-job-create-form.tsx:272`
- Fix: Support draft persistence parity with idempotent create.

## G2-11-013-086  [P1] GAP  facet F22  effort L
- Legacy: Legacy payload includes role options, category, eligibility and rounds. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:248`
- vNext now: vNext writes job then policies and rounds in separate resources. `src/components/placements/placement-job-create-form.tsx:471`
- Fix: Map all legacy fields and reconcile partial creation.

## G2-11-013-088  [P1] GAP  facet F22  effort M
- Legacy: Round includes name/kind/mode ON_CAMPUS/VIRTUAL. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:711`
- vNext now: New creates planned round name/kind only, mode set later. `src/components/placements/placement-job-create-form.tsx:639`
- Fix: Include round mode in create DTO.

## G2-11-013-090  [P1] GAP  facet F23  effort L
- Legacy: Unified full create editor, pay packages, editable rounds and autosave. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:41`
- vNext now: vNext long form richer details but single pay row and deferred rounds/server draft. `src/components/placements/placement-job-create-form.tsx:670`
- Fix: Restore interactive parity, preserve safety additions.

## G2-11-013-091  [P1] GAP  facet F23  effort L
- Legacy: Reach preview before publication. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:737`
- vNext now: Reach deferred until after create. `src/components/placements/placement-job-create-form.tsx:1446`
- Fix: Add truthful prepublish reach preview.

## G2-3-023-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/DriveForm.java:14-57`
- vNext now: `src/components/placements/placement-job-create-form.tsx:300-383`, `src/modules/placements/job-service.ts:150-272`
- Fix: Legacy flat DriveForm/recruiter/category/deadline fields need explicit conversion to normalized company, role and eligibility records.

## G2-10-030-030  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:594-613 — load/save Alerts with titles Drive was not created / Drive changes were not saved.
- vNext now: src/components/placements/placement-job-create-form.tsx:295-668 — error feedback through toast/form message, no matching top Alerts.
- Fix: Restore scoped alert placement/copy.

## G2-10-030-032  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:615-617 — hierarchy load failure warning Some dropdown data failed to load.
- vNext now: src/components/placements/placement-job-create-form.tsx:161-186 — options are server-provided; no equivalent warning rendered in form.
- Fix: Surface partial dropdown failure separately.

## G2-11-013-032  [P2] MISSING  facet F07  effort M
- Legacy: Eligibility preview failure hides stale counts, shows Retry. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:745`
- vNext now: No live count or preview error on form. `src/components/placements/placement-job-create-form.tsx:1446`
- Fix: Add fail-closed reach preview state and retry.

## G2-11-013-033  [P2] GAP  facet F07  effort S
- Legacy: Server save failure uses API detail or Could not save. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:298`
- vNext now: Create failure toast and partial request recovery. `src/components/placements/placement-job-create-form.tsx:660`
- Fix: Preserve exact fallback and field values.

## G2-11-013-034  [P2] MISSING  facet F07  effort S
- Legacy: Publish preflight fails with One thing is missing before publishing. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:455`
- vNext now: Publish absent in creation page. `src/components/placements/placement-job-create-form.tsx:1454`
- Fix: Show exact missing-items count in publish preflight.

## G2-11-013-035  [P2] GAP  facet F08  effort S
- Legacy: Draft autosave success All changes saved. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:307`
- vNext now: Local backup message only; server status unknown until Create draft. `src/components/placements/placement-job-create-form.tsx:689`
- Fix: Show distinction and actual server success toast.

## G2-11-013-037  [P2] MISSING  facet F08  effort S
- Legacy: Reach loading says Updating eligibility preview…. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:739`
- vNext now: No preview load spinner. `src/components/placements/placement-job-create-form.tsx:1446`
- Fix: Add loading and verification warning.

## G2-11-013-038  [P2] GAP  facet F08  effort M
- Legacy: Last saved by {name} at HH:mm D MMM YYYY. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:491`
- vNext now: Shows local backup timestamp, not server lastSaved actor. `src/components/placements/placement-job-create-form.tsx:689`
- Fix: Add authoritative save actor and timestamp.

## G2-3-023-015  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:93-110`
- vNext now: `src/components/placements/placement-job-create-form.tsx:645-651`
- Fix: Legacy returns 201 Job and audit DRIVE_CREATED, VNext toast Draft opportunity created and route redirect. Align success copy.

## G2-10-030-033  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:547-555 — Job saved as draft / Job published successfully / Job updated successfully success toast.
- vNext now: src/components/placements/placement-job-create-form.tsx:295-668 — create path and server outcome feedback; legacy exact success strings not present.
- Fix: Match success copy for each mutation.

## G2-10-030-034  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:661-670 — unknown company informational Alert suggests Companies directory.
- vNext now: src/components/placements/placement-job-create-form.tsx:139-156,416-455 — duplicate detection and new relationship flow, no same information banner.
- Fix: Expose company matching warning and link.
