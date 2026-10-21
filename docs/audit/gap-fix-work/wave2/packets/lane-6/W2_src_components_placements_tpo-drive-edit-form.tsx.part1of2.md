# Work packet (wave 2): edit src/components/placements/tpo-drive-edit-form.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid-edit.md

## G2-11-011-007  [P2] MISSING  facet F02  effort M
- Legacy: Persistent Setup review rail shows 4 setup milestones. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:728`
- vNext now: No setup-review progress rail. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Add four-stage setup checklist and progress rail.

## G2-11-011-009  [P2] GAP  facet F02  effort M
- Legacy: The drive has AntD Card with three-column Row/Col responsive grid. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:583`
- vNext now: vNext flat single-column form with one disclosure for compensation. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Use cards and old responsive 24/12/8 span grids.

## G2-11-011-012  [P2] MISSING  facet F02  effort M
- Legacy: Rounds card contains existing rounds (readonly per row) and presets for create. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:702`
- vNext now: No rounds overview in edit form. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Show rounds list with management links while preventing duplicate edit.

## G2-11-011-014  [P2] GAP  facet F03  effort S
- Legacy: Role label, min3, placeholder e.g. Systems Engineer. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:586`
- vNext now: Title label min2, no example placeholder. `src/components/placements/tpo-drive-edit-form.tsx:89`
- Fix: Use Role label and minimum3 with exact placeholder.

## G2-11-011-015  [P2] GAP  facet F03  effort S
- Legacy: Description TextArea rows3, optional. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:587`
- vNext now: Description required, rows4, max20000. `src/components/placements/tpo-drive-edit-form.tsx:90`
- Fix: Preserve optional description and row count unless backend mandates.

## G2-11-011-018  [P2] GAP  facet F03  effort S
- Legacy: Location single text field. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:596`
- vNext now: Locations comma-separated list. `src/components/placements/tpo-drive-edit-form.tsx:91`
- Fix: Map old location field to list and retain placeholder/label.

## G2-11-011-019  [P2] GAP  facet F03  effort S
- Legacy: Application deadline DatePicker with 11:59 PM default. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:597`
- vNext now: DateInput datetime-local prefilled existing IST, no default 23:59. `src/components/placements/tpo-drive-edit-form.tsx:114`
- Fix: Restore end-of-day default for new deadline values.

## G2-11-011-024  [P2] MISSING  facet F03  effort M
- Legacy: Pay row has Joining bonus (LPA) separate. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:631`
- vNext now: Fixed/variable/stipend fields; no joining bonus. `src/components/placements/tpo-drive-edit-form.tsx:100`
- Fix: Restore joining bonus field per package.

## G2-11-011-025  [P2] MISSING  facet F03  effort M
- Legacy: Pay row has internship stipend duration months. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:635`
- vNext now: Monthly stipend only; duration missing. `src/components/placements/tpo-drive-edit-form.tsx:104`
- Fix: Add stipend months.

## G2-11-011-027  [P2] MISSING  facet F03  effort M
- Legacy: Wanted skills multiselect section. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:695`
- vNext now: No skills section. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Add wanted skills controls.

## G2-11-011-028  [P2] GAP  facet F04  effort M
- Legacy: CGPA rule fetched from settings, effective % hints. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:76`
- vNext now: CGPA input with number step.01; no conversion hint. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Show college rule and equivalent percentage explanation.

## G2-11-011-031  [P2] MISSING  facet F04  effort M
- Legacy: Passing years selector allows tags and comma token. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:676`
- vNext now: No passing-year selector. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Add year multiple selector with same parsing.

## G2-11-011-033  [P2] MISSING  facet F04  effort M
- Legacy: 10th minimum separate control. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:681`
- vNext now: No tenth minimum. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Expose per-level min marks.

## G2-11-011-034  [P2] MISSING  facet F04  effort M
- Legacy: 12th minimum separate control. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:682`
- vNext now: No twelfth minimum. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Expose per-level min marks.

## G2-11-011-035  [P2] MISSING  facet F04  effort M
- Legacy: Diploma minimum separate lateral-entry control. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:683`
- vNext now: No diploma minimum. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Add separate diploma rule.

## G2-11-011-036  [P2] MISSING  facet F04  effort M
- Legacy: UG minimum separate control. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:684`
- vNext now: No UG minimum. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Add min undergraduate percentage.

## G2-11-011-037  [P2] MISSING  facet F04  effort M
- Legacy: PG minimum separate control. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:685`
- vNext now: No PG minimum. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Add postgraduate min marks.

## G2-11-011-038  [P2] MISSING  facet F04  effort M
- Legacy: Gender selector for diversity drive excludes Prefer not to say. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:687`
- vNext now: No gender eligibility control. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Support safe optional gender rule with privacy validation.

## G2-11-011-040  [P2] MISSING  facet F05  effort M
- Legacy: Clone options latest first and exclude REQUEST/SENT_BACK/REJECTED. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:53`
- vNext now: Edit form no clone chooser. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Keep Start from clone selector for empty/restart or link to clone flow.

## G2-11-011-041  [P2] MISSING  facet F05  effort M
- Legacy: Eligibility presets buttons set multiple fields, then autosave. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:657`
- vNext now: No preset selector. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Add same presets with change preview.

## G2-11-011-044  [P2] GAP  facet F06  effort S
- Legacy: Role must have at least3 chars, error At least 3 characters. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:586`
- vNext now: New minLength2, max200, native browser validation. `src/components/placements/tpo-drive-edit-form.tsx:89`
- Fix: Use min3 and old error text.

## G2-11-011-045  [P2] GAP  facet F06  effort S
- Legacy: Deadline allows current day, 11:59 PM time default, blocks earlier dates. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:597`
- vNext now: Native datetime-local; server IST conversion. `src/components/placements/tpo-drive-edit-form.tsx:115`
- Fix: Set same date disabled/default behavior.

## G2-11-011-047  [P2] GAP  facet F06  effort M
- Legacy: CTC LPA min0 step0.5. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:628`
- vNext now: New annual INR min/max plus fixed/variable LPA step.01. `src/components/placements/tpo-drive-edit-form.tsx:98`
- Fix: Reconcile units/conversion and original increment.

## G2-11-011-063  [P2] MISSING  facet F09  effort M
- Legacy: Clone confirm warns overwritten typed data, no student notice. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:407`
- vNext now: No clone dialog in edit form. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Implement cloning confirmation and unsaved-data guard.

## G2-11-011-065  [P2] MISSING  facet F09  effort M
- Legacy: Clone note can be dismissed and shows dropped dates/batches/years. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:528`
- vNext now: No clone-note banner. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Show copy caveats if opened after clone.

## G2-11-011-075  [P2] GAP  facet F12  effort M
- Legacy: Autosave blocked during hydration and for frozen/live state. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:322`
- vNext now: New submit only while pending with role/season restrictions. `src/components/placements/tpo-drive-edit-form.tsx:29`
- Fix: Preserve state-based disabled guards for autosave.

## G2-11-011-082  [P2] GAP  facet F13  effort S
- Legacy: Published warning Nothing saves by itself; choose whether to tell applicants. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:527`
- vNext now: New help explains audited live change, no same exact warning. `src/components/placements/tpo-drive-edit-form.tsx:125`
- Fix: Use old clear no-autosave warning.

## G2-11-011-083  [P2] MISSING  facet F13  effort M
- Legacy: Duplicate drive warning identifies company+job+status with Open it. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:541`
- vNext now: No duplicate check/banner in edit view. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Add duplicate detection with link.

## G2-11-011-086  [P2] MISSING  facet F14  effort M
- Legacy: Clone copies content and rounds but clears dates. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:399`
- vNext now: Edit form has no clone flow. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Preserve copy/delete semantics in separate clone route.

## G2-11-011-090  [P2] GAP  facet F16  effort M
- Legacy: Legacy 24-col Row/Col xs24 md8 on mode/location/deadline. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:557`
- vNext now: New grid 2 columns at sm for deadline/CGPA. `src/components/placements/tpo-drive-edit-form.tsx:113`
- Fix: Clone three-column desktop form rhythm and mobile stacking.

## G2-11-011-091  [P2] MISSING  facet F16  effort M
- Legacy: Review rail stays visible while working. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:728`
- vNext now: No review rail. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Make review rail sticky at desktop, below form on mobile.

## G2-11-011-092  [P2] GAP  facet F16  effort M
- Legacy: Pay package card dense 6 fields across responsive columns. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:620`
- vNext now: Compensation disclosure 2/3 grid fields. `src/components/placements/tpo-drive-edit-form.tsx:96`
- Fix: Use legacy package subcards and spacing.

## G2-11-011-093  [P2] MISSING  facet F17  effort S
- Legacy: Round Remove button has aria-label Remove this round. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:715`
- vNext now: No round form controls. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Restore accessible round manager; keep disabled saved-round rules.

## G2-11-011-094  [P2] MISSING  facet F17  effort S
- Legacy: Eligibility presets Space aria-label Eligibility presets. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:662`
- vNext now: No accessible preset selector. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Add labelled preset controls.

## G2-11-011-096  [P2] GAP  facet F18  effort S
- Legacy: Section title The drive. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:583`
- vNext now: New first fields unlabeled as a section. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Add exact section heading.

## G2-11-011-097  [P2] GAP  facet F18  effort S
- Legacy: Section title Pay packages. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:620`
- vNext now: New disclosure Compensation and openings. `src/components/placements/tpo-drive-edit-form.tsx:94`
- Fix: Use Pay packages title and repeatable rows.

## G2-11-011-098  [P2] MISSING  facet F18  effort S
- Legacy: Section title Eligibility. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:657`
- vNext now: Only Minimum CGPA for eligibility label. `src/components/placements/tpo-drive-edit-form.tsx:119`
- Fix: Add full section and original labels.

## G2-11-011-099  [P2] MISSING  facet F18  effort S
- Legacy: Setup review item 3 Application deadline and Required before publishing. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:728`
- vNext now: Deadline field no review milestone. `src/components/placements/tpo-drive-edit-form.tsx:114`
- Fix: Port setup review copy.

## G2-11-011-100  [P2] MISSING  facet F18  effort S
- Legacy: Who this reaches and Updating eligibility preview… `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:737`
- vNext now: No reach/status text. `src/components/placements/tpo-drive-edit-form.tsx:125`
- Fix: Port exact copy and live count state.

## G2-11-011-103  [P2] GAP  facet F19  effort M
- Legacy: Eligibility preview refresh after saved updates. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:274`
- vNext now: New navigates away after save, no same-page preview. `src/components/placements/tpo-drive-edit-form.tsx:80`
- Fix: Keep in-form current reach after save.
