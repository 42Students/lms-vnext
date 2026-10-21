# Work packet (wave 2): edit src/modules/placements/hr-drive-draft-model.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-new.md, docs/audit/gap2/lane-2/choices-controller.md, docs/audit/gap2/lane-4/l12-u015-job-role-option.md

## G2-11-004-037  [P2] GAP  facet F06  effort S
- Legacy: Job description optional and four rows `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:362`
- vNext now: Description trimmed, optional empty, max5000 `src/modules/placements/hr-drive-draft-model.ts:22`
- Fix: Document/change max length and rows

## G2-11-004-038  [P2] GAP  facet F06  effort S
- Legacy: CTC InputNumber min0 step0.1 `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:374`
- vNext now: CTC string regex max4 integer digits and 2 decimal places `src/modules/placements/hr-drive-draft-model.ts:31`
- Fix: Match decimal input affordance and accepted precision

## G2-11-004-042  [P2] GAP  facet F06  effort S
- Legacy: No stated round-count cap; Add round always enabled `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:402`
- vNext now: Rounds max12, Add disabled at 12 `src/modules/placements/hr-drive-draft-model.ts:45`
- Fix: Decide cap and document intentional restriction

## G2-11-004-043  [P2] GAP  facet F06  effort S
- Legacy: Free-form comma-tag branches, no hard max in page `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:408`
- vNext now: Branches max30, each max120 `src/modules/placements/hr-drive-draft-model.ts:43`
- Fix: Validate legacy overlimit handling or align accepted input

## G2-2-030-006  [P2] GAP  facet F03  effort S
- Legacy: ChoicesController.java:27 lists drive modes ON_CAMPUS/POOL/OFF_CAMPUS in order.
- vNext now: src/modules/placements/hr-drive-draft-model.ts has drive mode validation; no global driveModes array in common catalog.
- Fix: Ensure all drive form select options and report labels match three legacy values and ordering.

## G2-12-015-003  [P2] GAP  facet F02  effort M
- Legacy: Pay packages editor second rail step `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:620-642`
- vNext now: New draft model salary fields within a flat schema `src/modules/placements/hr-drive-draft-model.ts:31-41`
- Fix: Use legacy section placement and progressive step indicator.

## G2-12-015-016  [P2] GAP  facet F06  effort M
- Legacy: Money input min=0, step=0.5 for 4 LPA fields `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:627-631`
- vNext now: HR salary regex accepts hundredths `src/modules/placements/hr-drive-draft-model.ts:31-33`
- Fix: Mirror 0.5 spin increments while storing cents accurately.

## G2-12-015-034  [P2] GAP  facet F18  effort M
- Legacy: Exact captions 'Pay packages', 'Package name', 'CTC (LPA)', 'Fixed', 'Variable', 'Joining bonus', 'Stipend / month (internship)', 'Duration (months)' `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:620-635`
- vNext now: New field keys and validations differ `src/modules/placements/hr-drive-draft-model.ts:31-82`
- Fix: Use precise legacy text or document approved wording deviations.
