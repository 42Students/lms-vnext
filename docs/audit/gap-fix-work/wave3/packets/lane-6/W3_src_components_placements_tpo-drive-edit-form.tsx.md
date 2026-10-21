# Work packet (wave 3): edit src/components/placements/tpo-drive-edit-form.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid-edit.md

## G2-11-011-008  [P1] MISSING  facet F02  effort L
- Legacy: Who this reaches live eligibility panel with counts, branch breakdown. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:737`
- vNext now: New form only audit reason and change notice, no eligibility preview. `src/components/placements/tpo-drive-edit-form.tsx:125`
- Fix: Restore live eligibility preview with masked/failed state.

## G2-11-011-010  [P1] MISSING  facet F02  effort L
- Legacy: Pay packages repeatable Form.List rows. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:620`
- vNext now: Only one set of numeric CTC fields, no repeatable role packages. `src/components/placements/tpo-drive-edit-form.tsx:96`
- Fix: Provide full multi-package editor via role-options service.

## G2-11-011-011  [P1] MISSING  facet F02  effort L
- Legacy: Eligibility has batch, branch, passing-year and marks options. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:657`
- vNext now: Only minCgpa input is editable. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Recreate full edit eligibility controls with server-backed policy.

## G2-11-011-013  [P1] MISSING  facet F03  effort L
- Legacy: Company field uses CompanyPicker and company selection. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:585`
- vNext now: No Company input/edit control. `src/components/placements/tpo-drive-edit-form.tsx:89`
- Fix: Expose authorized company reassignment or explicitly readonly original company field.

## G2-11-011-016  [P1] MISSING  facet F03  effort L
- Legacy: Job description file PDF/Word up to5MB and link for students. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:588`
- vNext now: No JD upload/link control. `src/components/placements/tpo-drive-edit-form.tsx:90`
- Fix: Port signed-url JD upload and file validation; keep 5MB limit.

## G2-11-011-084  [P1] MISSING  facet F14  effort L
- Legacy: JD upload optional PDF/Word 5 MB. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:588`
- vNext now: No file control in new edit form. `src/components/placements/tpo-drive-edit-form.tsx:90`
- Fix: Reuse secure upload route with 5MB PDF/Word and signed URL.

## G2-11-011-118  [P1] MISSING  facet F23  effort L
- Legacy: Legacy live Who this reaches panel is fail-closed. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:737`
- vNext now: No equivalent eligible reach projection. `src/components/placements/tpo-drive-edit-form.tsx:125`
- Fix: Add preview with retry before publish/edit.

## G2-11-011-119  [P1] MISSING  facet F23  effort L
- Legacy: Legacy supports JD files and recruiter portal fields. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:587`
- vNext now: No JD or portal fields in edit. `src/components/placements/tpo-drive-edit-form.tsx:90`
- Fix: Restore both secure file and external-portal metadata.
