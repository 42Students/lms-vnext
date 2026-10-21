# Work packet: edit src/components/placements/tpo-drive-edit-form.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid-edit.md

## G2-11-011-006  [P1] GAP  facet F02  effort L
- Legacy: Main form has Start from, The drive, Pay packages, Eligibility, Skills, Rounds sections. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:547`
- vNext now: New edit form has title/description/locations, compensation disclosure, deadline, CGPA, reason. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Port all sections/field groups for edit workspace.

## G2-11-011-017  [P1] MISSING  facet F03  effort M
- Legacy: Mode On campus/Pool/Off campus with explanatory help. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:595`
- vNext now: No driveMode selector. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Recreate mode field and context-specific fields.

## G2-11-011-020  [P1] MISSING  facet F03  effort M
- Legacy: Off-campus mode shows company application URL field. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:606`
- vNext now: No company external application link in edit form. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Expose off-campus URL with https validation.

## G2-11-011-021  [P1] MISSING  facet F03  effort M
- Legacy: Recorded outside checkbox disables normal application window. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:608`
- vNext now: No recordedOutside toggle. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Expose mode aftercare state with safe notification rule.

## G2-11-011-022  [P1] MISSING  facet F03  effort M
- Legacy: Portal-registration checkbox and portal name/url fields. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:611`
- vNext now: No portal registration fields. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Restore external registration section and preview.

## G2-11-011-023  [P1] GAP  facet F03  effort L
- Legacy: Package name e.g. Digital,Ninja, Add another package. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:627`
- vNext now: Min/max INR without named packages. `src/components/placements/tpo-drive-edit-form.tsx:98`
- Fix: Expose named role options and packages.

## G2-11-011-026  [P1] GAP  facet F03  effort L
- Legacy: Category computed Regular/Dream/Super-dream, optional override with reason. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:647`
- vNext now: Boolean Dream drive with held-offer limit exception. `src/components/placements/tpo-drive-edit-form.tsx:109`
- Fix: Restore three-tier category and reason override UI.

## G2-11-011-030  [P1] MISSING  facet F04  effort M
- Legacy: Branches selector merges choices/students. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:672`
- vNext now: No branch selector. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Expose branch options with all-branches default.

## G2-11-011-032  [P1] MISSING  facet F04  effort M
- Legacy: Percentage throughout 0–100, lowest of qualifying school/UG marks. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:680`
- vNext now: No percent-throughout field. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Port eligibility percentage mapping.

## G2-11-011-043  [P1] MISSING  facet F06  effort M
- Legacy: Company is required, message Add the company. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:585`
- vNext now: Company not editable at all. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Restore required Company picker state for supported lifecycle.

## G2-11-011-048  [P1] MISSING  facet F06  effort M
- Legacy: Category override requires reason. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:651`
- vNext now: Boolean isDream no override reason. `src/components/placements/tpo-drive-edit-form.tsx:109`
- Fix: Require reason for manual tier override.

## G2-11-011-050  [P1] GAP  facet F06  effort M
- Legacy: Autosave minimum company and role length3; no early save. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:290`
- vNext now: Explicit Save form requires title/description/reason. `src/components/placements/tpo-drive-edit-form.tsx:28`
- Fix: Match draft save trigger/minimal fields without losing safety.

## G2-11-011-055  [P1] MISSING  facet F07  effort M
- Legacy: Eligibility preview failure hides stale counts; Retry. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:745`
- vNext now: No eligibility preview/error state. `src/components/placements/tpo-drive-edit-form.tsx:125`
- Fix: Implement fail-closed eligibility panel and Retry.

## G2-11-011-062  [P1] MISSING  facet F09  effort M
- Legacy: Recruiter request live modal warns company owns pay/location and eligibility only tightens. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:482`
- vNext now: New Dialog only describes applicant notifications. `src/components/placements/tpo-drive-edit-form.tsx:134`
- Fix: Add recruiter-owned-field/eligibility restriction warning.

## G2-11-011-064  [P1] MISSING  facet F09  effort M
- Legacy: Before route leave, unsaved changes confirm native window dialog. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:223`
- vNext now: No useUnsavedDriveGuard import or hook in TpoDriveEditForm. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Add beforeunload/route guard for edited unsaved live form.

## G2-11-011-069  [P1] GAP  facet F10  effort M
- Legacy: Draft debounced autosave at 1200ms. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:327`
- vNext now: New explicit submit only. `src/components/placements/tpo-drive-edit-form.tsx:28`
- Fix: Implement debounced draft save with optimistic token + undo/error feedback.

## G2-11-011-078  [P1] GAP  facet F12  effort M
- Legacy: RecordedOutside removes stale application window. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:251`
- vNext now: New date nullable independent of recordedOutside. `src/components/placements/tpo-drive-edit-form.tsx:47`
- Fix: Enforce recorded-outside deadline semantics in server mapping.

## G2-11-011-089  [P1] MISSING  facet F15  effort M
- Legacy: Recorded outside says No student is told when you publish it. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:608`
- vNext now: New edit form cannot toggle recorded outside. `src/components/placements/tpo-drive-edit-form.tsx:125`
- Fix: Preserve suppression of publish notices for recorded drives.

## G2-11-011-101  [P1] GAP  facet F19  effort M
- Legacy: Autosave after 1200ms in draft. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:327`
- vNext now: Explicit save triggered manually. `src/components/placements/tpo-drive-edit-form.tsx:28`
- Fix: Debounce with no double-submit, or owner approve new save interaction.

## G2-11-011-107  [P1] MISSING  facet F20  effort M
- Legacy: Route-leave unsaved changes guarded. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:223`
- vNext now: New form has no evident unload/route guard. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Implement dirty guard; no navigation-loss of edits.
