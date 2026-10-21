# Work packet: edit src/components/placements/tpo-drive-edit-form.tsx (part 2 of 2)

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid-edit.md

## G2-11-011-110  [P1] MISSING  facet F21  effort M
- Legacy: Legacy JD is external file link consumed by students. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:588`
- vNext now: New edit does not manipulate file asset. `src/components/placements/tpo-drive-edit-form.tsx:90`
- Fix: Support secure file link and permissions.

## G2-11-011-112  [P1] GAP  facet F22  effort L
- Legacy: Legacy pay category derives Regular/Dream/Super dream and override reason. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:653`
- vNext now: New isDream boolean, lacks three-tier enum/override reason. `src/components/placements/tpo-drive-edit-form.tsx:109`
- Fix: Preserve category tier and reason in persisted schema.

## G2-11-011-117  [P1] GAP  facet F23  effort L
- Legacy: Legacy drafts autosave; live asks consent; frozen readonly. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:327`
- vNext now: New all edits require Save, live asks consent, frozen only alert. `src/components/placements/tpo-drive-edit-form.tsx:128`
- Fix: Restore per-lifecycle workflow semantics.

## G2-11-011-056  [P2] GAP  facet F07  effort S
- Legacy: Failed autosave shows server error or Could not save. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:298`
- vNext now: New error maps tpoDriveFormErrorMessage and closes confirmation. `src/components/placements/tpo-drive-edit-form.tsx:82`
- Fix: Display exact failure reason while preserving unsaved inputs.

## G2-11-011-057  [P2] MISSING  facet F08  effort M
- Legacy: Save states Saving changes, Changes not saved, Last saved by X at HH:mm D MMM YYYY. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:491`
- vNext now: No save-state timestamp/author indicator. `src/components/placements/tpo-drive-edit-form.tsx:125`
- Fix: Add status dot and last saved metadata.

## G2-11-011-058  [P2] GAP  facet F08  effort M
- Legacy: Successful draft autosave shows All changes saved. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:307`
- vNext now: Successful explicit Save redirects to drive page. `src/components/placements/tpo-drive-edit-form.tsx:80`
- Fix: Retain confirmation inline and avoid forced redirect for draft.

## G2-11-011-059  [P2] MISSING  facet F08  effort M
- Legacy: Publish missing items toast one thing/things are missing before publishing. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:455`
- vNext now: No Publish control in new edit form. `src/components/placements/tpo-drive-edit-form.tsx:125`
- Fix: Add draft publish preflight CTA and precise blockers.

## G2-11-011-060  [P2] MISSING  facet F08  effort M
- Legacy: Clone success toast Copy made. Set the dates, check it and publish. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:399`
- vNext now: No clone within edit form. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Restore success feedback in clone workflow.
