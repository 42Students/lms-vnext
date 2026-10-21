# Work packet (wave 2): edit src/components/placements/placement-draft-edit-form.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-9-013-004  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:77-79` — Successful edit and Cancel both navigate to /college-admin/jobs/{jobId}.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:338-345` — After draft Save refreshes in place; no Cancel action in edit form.
- Fix: Offer Cancel/return to overview with dirty guard; decide route parity deliberately.

## G2-9-013-009  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:786-905` — Important dates appears before Target Audience and Candidate Preferences.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:533-707` — Eligibility rules nested in details beneath main draft fields; no separate important dates section.
- Fix: Recreate legacy section order for supported fields.

## G2-9-013-015  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1080-1135` — Custom rule rows have remove buttons and Add custom rule control.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:531-707` — No custom display-only rule rows/editor.
- Fix: Restore candidate preference custom rule editor with max 20.

## G2-9-013-018  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:215-231` — Important date list parsed with calendar-date semantics; application deadline singled out case-insensitively.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:110-120` — Only ISO application deadline converted to datetime-local; list of important dates absent.
- Fix: Render persisted importantDates and maintain civil-date formatting.

## G2-9-013-023  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:940-1013` — Hierarchy search/select lists are filtered organization/college/department/program/batch/class.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:540-615` — Program/cohort checkbox lists, not cascading searchable dropdowns.
- Fix: Restore searchable dependent selectors and legacy all-values placeholders.

## G2-9-013-025  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:620-627` — Job Title required, whitespace rejection, placeholder e.g., Software Engineer, maxLength 100, autofocus.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:367-377` — Title required, maxLength 200, no legacy placeholder/autofocus.
- Fix: Set max 100, autofocus and identical placeholder/error.

## G2-9-013-027  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:683-701` — Rich text Job Description height 280 and optional Responsibilities height 200.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:379-391` — Plain textarea Description maxLength 20000; Responsibilities missing.
- Fix: Use rich editor and separate responsibility content with legacy behavior.

## G2-9-013-029  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:713-715` — Location single text maxLength 200, placeholder e.g., Bangalore, Remote.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:423-434` — Comma-joined locations array; placeholder Hyderabad, Bengaluru; no 200 char max.
- Fix: Constrain length and preserve exact placeholder/parse semantics.

## G2-9-013-030  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:718-720` — CTC Range text input maxLength 100, help Shown to learners on the job listing.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:450-482` — Minimum/Maximum CTC number controls with LPA/step0.1.
- Fix: Preserve legacy salary text and help or declare normalization migration.

## G2-9-013-034  [P2] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:818-895` — Important dates label+calendar day rows, minimum one row and maximum 20.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:518-535` — Single deadline input only; no milestone rows/add/remove.
- Fix: Implement capped milestones list with paired-field rules.

## G2-9-013-037  [P2] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1080-1135` — Up to 20 custom rules with label and value; incomplete pair omitted on save.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:533-707` — No custom rules input.
- Fix: Add label/value editor and preserve incomplete-row behavior.

## G2-9-013-038  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1138-1185` — Dirty Cancel opens Discard unsaved changes? / Discard / Keep editing.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:694-709` — No Cancel; dirty status text visible only, browser guard hook separate.
- Fix: Add Cancel confirmation matching exact wording.

## G2-9-013-067  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:766-782` — Changed deadline cannot be in past; saved past deadline allowed unchanged.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:518-530` — HTML datetime-local has no original-deadline exception validation at UI.
- Fix: Implement changed-only deadline checks on edit, still enforce at service.

## G2-9-013-075  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:684-699` — Legacy job rich text editor stores formatted content, not file attachment.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:379-390` — Textarea stores plain text.
- Fix: Preserve formatted HTML representation if migrating rich text.

## G2-9-013-079  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:712-1014` — Antd Row xs24/sm12 and wrapped milestone rows; card form is mobile-flex.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:366-715` — sm:grid-cols-2, lg:grid-cols-4 plus full-width phone button.
- Fix: Compare mobile field order/stacking/spacing against legacy at 320/768 widths.

## G2-9-013-084  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:618-627` — Legacy Job Title, Company Name, Job Description, Job Type and Update Job wording.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:359-409` — VNext Edit draft opportunity, Job title, Description, Employment type, Save draft changes.
- Fix: Restore field/button letter case and legacy wording for equivalent values.

## G2-9-013-089  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:117-150` — Company options fetched full list, local autocomplete; hierarchy loaded all in parallel.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:540-615` — Checkbox list all program/cohort options, no search or virtualization.
- Fix: Support searching/paging large cohorts/companies without huge page markup.

## G2-9-013-092  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:481-496` — Application deadline UTC timestamp while other important dates YYYY-MM-DD civil days.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:110-120` — datetime-local conversion only; other dates not represented.
- Fix: Maintain distinct civil-day versus instant types with IST display tests.

## G2-9-013-081  [P3] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:620-627` — First Job Title input autofocus; antd Form.Item associates label/rules.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:367-378` — Nested label semantics; no autofocus.
- Fix: Match initial focus only when safe and show field-level errors.

## G2-9-013-083  [P3] MISSING  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:873-881` — Remove button tooltip At least one row required when disabled.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:533-615` — No milestone removal/tooltip affordance.
- Fix: Restore descriptive disabled tooltip and keyboard accessible add/remove.
