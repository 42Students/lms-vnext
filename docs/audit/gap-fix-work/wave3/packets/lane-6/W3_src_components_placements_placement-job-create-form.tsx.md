# Work packet (wave 3): edit src/components/placements/placement-job-create-form.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-new.md

## G2-11-013-007  [P1] MISSING  facet F02  effort L
- Legacy: Who this reaches card gives live eligibility counts. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:737`
- vNext now: New reach area has explanation only until saved. `src/components/placements/placement-job-create-form.tsx:1445`
- Fix: Support read-only live eligibility estimation before publish.

## G2-11-013-014  [P1] MISSING  facet F04  effort L
- Legacy: Repeatable named pay packages in Form.List. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:620`
- vNext now: New single min/max/fixed/variable/stipend job inputs. `src/components/placements/placement-job-create-form.tsx:1004`
- Fix: Implement named multiple packages with per-row edit/remove.

## G2-11-013-059  [P1] MISSING  facet F14  effort L
- Legacy: JD upload PDF/Word max5MB. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:588`
- vNext now: No JD upload field in create form. `src/components/placements/placement-job-create-form.tsx:913`
- Fix: Add signed-url JD upload with extension/mime/5MB enforcement.
