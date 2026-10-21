# Work packet (wave 2): edit src/components/placements/placement-job-create-form.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-sections-job-form.md, docs/audit/gap2/lane-11/tpo-drives-new.md

## G2-10-030-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:207-212,233-262 — duplicateFrom initializes create with copy title and clears deadlines.
- vNext now: src/components/placements/placement-job-create-form.tsx:99-115,123-160 — accepts initialCompanyName, no duplicateFrom job payload.
- Fix: Implement copy-drive prefill and cleared deadline behavior.

## G2-10-030-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:578-619 — continuous Ant form with errors at top then fields.
- vNext now: src/components/placements/placement-job-create-form.tsx:669-712,739-750,899-912,1124-1195 — multi-section accordions and preflight steps.
- Fix: Match source one-page field grouping/section hierarchy.

## G2-10-030-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:900-915 — Target Audience card has teal 3px left border.
- vNext now: src/components/placements/placement-job-create-form.tsx:1196-1217 — Eligibility separate section and target controls, no teal left funnel border.
- Fix: Restore legacy scoped funnel visual.

## G2-10-030-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:619-735 — Job Title/Company/Job Description/Responsibilities/Job Type/Location/CTC/Visibility visible upfront.
- vNext now: src/components/placements/placement-job-create-form.tsx:899-1122,1124-1195 — split Opportunity and collapsed Additional job details, distinct controls.
- Fix: Restore source field ordering and default visibility.

## G2-10-030-008  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1017-1136 — Candidate Preferences and custom eligibility rules visible and editable row by row.
- vNext now: src/components/placements/placement-job-create-form.tsx:1174-1192 — fields hidden in Additional details; custom rules one multiline textarea.
- Fix: Expose labeled rows and helper copy.

## G2-10-030-010  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:633-659 — college company autocomplete with existing companies and free typed name.
- vNext now: src/components/placements/placement-job-create-form.tsx:750-870 — Existing/New employer mode, unique company relationship.
- Fix: Preserve autocomplete and free-name behavior within dedupe.

## G2-10-030-012  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:695-700 — Responsibilities rich-text editor height200.
- vNext now: src/components/placements/placement-job-create-form.tsx:1160-1163 — plain textarea in collapsed Additional details.
- Fix: Restore rich formatting and initial visibility.

## G2-10-030-014  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:711-722 — Location and CTC Range text with examples Bangalore Remote, 6-10 LPA.
- vNext now: src/components/placements/placement-job-create-form.tsx:975-1030 — location/work mode and structured minimum/max/fixed LPA fields.
- Fix: Preserve input copy and legacy CTC range compatibility.

## G2-10-030-017  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:901-905 — leaving audience empty targets all students.
- vNext now: src/components/placements/placement-job-create-form.tsx:1220-1269 — unchecked programs all, cohorts narrow; policy may filter on marks.
- Fix: Show exact open-audience guidance and route rules.

## G2-10-030-019  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:619-627 — required job title whitespace custom error Please enter a job title.
- vNext now: src/components/placements/placement-job-create-form.tsx:913-925,295-318 — required min3, error Job title: At least 3 characters.
- Fix: Preserve exact required error while maintaining stricter min length.

## G2-10-030-020  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:633-681 — Company Name required and error Please enter company name.
- vNext now: src/components/placements/placement-job-create-form.tsx:787-860,328-333 — company existing or new, publish check different.
- Fix: Match required copy and permitted free-text state.

## G2-10-030-022  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:702-708 — Job Type required Please select job type.
- vNext now: src/components/placements/placement-job-create-form.tsx:943-957 — default FULL_TIME; no empty/invalid choice.
- Fix: Honor required college job type selection.

## G2-10-030-023  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:736-752 — Assessment URL max2048 http/https, showCount/allowClear.
- vNext now: src/components/placements/placement-job-create-form.tsx:1164-1165 — type=url without maxLength or clear/count.
- Fix: Constrain and display 2048 counter.

## G2-10-030-024  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:754-783 — assessment deadline optional, not past unless unchanged, after application deadline.
- vNext now: src/components/placements/placement-job-create-form.tsx:380-383,1167-1168 — only cross-deadline check on creation, no past-date exception.
- Fix: Implement unchanged expired edit deadline exemption.

## G2-10-030-025  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:791-815 — application deadline may be null; changed date cannot be past.
- vNext now: src/components/placements/placement-job-create-form.tsx:335-338,1075-1119 — publish requires future deadline; 11:59 PM IST shortcut.
- Fix: Preserve draft nullable and source validation wording.

## G2-10-030-026  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:828-870 — important date label requires date and vice versa, reserved Application deadline.
- vNext now: src/components/placements/placement-job-create-form.tsx:377-379,1170-1173 — parses raw pipe-delimited pairs; errors follow alternate parser.
- Fix: Restore paired row-level validation and reserved label rule.

## G2-10-030-028  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:40-43,1078-1136 — custom rule cap20, each label/value max200.
- vNext now: src/components/placements/placement-job-create-form.tsx:1170-1192 — text pair parser of up to20 in multiline textarea.
- Fix: Use row cap/field cap and source add/remove validation.

## G2-10-030-035  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1114-1127 — custom-rule Remove danger text button with disabled last row and tooltip.
- vNext now: src/components/placements/placement-job-create-form.tsx:1189-1192 — custom rules entered in multiline textarea, no per-row Remove.
- Fix: Restore repeating-row affordances.

## G2-10-030-036  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:872-895 — important date Remove disabled when last row, dashed Add date with cap20.
- vNext now: src/components/placements/placement-job-create-form.tsx:1170-1173 — raw text field; no Add/Remove buttons.
- Fix: Restore date-row controls with cap.

## G2-10-030-037  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1172-1186 — Cancel dirty Modal.confirm Discard unsaved changes? with Keep editing.
- vNext now: src/components/placements/placement-job-create-form.tsx:118-125,1476-1486 — unsaved-drive guard, browser draft backup and discard control.
- Fix: Preserve exact source modal copy; keep recovery backup.

## G2-10-030-042  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:233-277 — duplicating title gets (Copy), removes deadlines and assessment URL.
- vNext now: src/components/placements/placement-job-create-form.tsx:99-160 — new form company prefills only.
- Fix: Add duplicateFrom mapping.

## G2-10-030-044  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:508-514 — company/targeting distinct from candidatePreferences guidance.
- vNext now: src/components/placements/placement-job-create-form.tsx:1193-1417 — candidate preferences plus enforced eligibility rules side by side.
- Fix: Keep informational vs enforced eligibility visibly separated.

## G2-10-030-045  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:68-72,299-320 — initial loading disables entire form until hierarchy/prefill done.
- vNext now: src/components/placements/placement-job-create-form.tsx:669-685 — new form initially active using props; no edit prefill phase.
- Fix: Add bounded loading skeleton and edit-blocking state.

## G2-10-030-046  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:594-617 — separate loadError/saveError/hierarchyError alerts.
- vNext now: src/components/placements/placement-job-create-form.tsx:295-668 — toast/error handling without three distinct warning blocks.
- Fix: Display granular errors that do not destroy current fields.

## G2-10-030-049  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:711-722 — two 12-column Ant fields at sm, all controls vertical elsewhere.
- vNext now: src/components/placements/placement-job-create-form.tsx:911-912,1130-1195 — responsive two-col CSS grid and details.
- Fix: Compare responsive layout field order and mobile accordion open state.

## G2-10-030-050  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:633-659 — Ant AutoComplete options and searchable company list.
- vNext now: src/components/placements/placement-job-create-form.tsx:787-824 — company search/provider picker and toggled modes.
- Fix: Verify keyboard autocomplete, focus and selection feedback.

## G2-10-030-051  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1078-1136 — custom rules inputs Rule label and Rule value aria-labels.
- vNext now: src/components/placements/placement-job-create-form.tsx:1189-1192 — textarea single accessible label, no per-item names.
- Fix: Restore accessible per-row labels and remove descriptions.

## G2-10-030-052  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:619-752 — precise labels Job Title, Company Name, Job Description, Responsibilities, Job Type, CTC Range, Visibility.
- vNext now: src/components/placements/placement-job-create-form.tsx:905-1030 — Job title, Employer, Description, Employment type, structured CTC, no Visibility.
- Fix: Match visible legacy labels; keep deliberate data model enhancements.

## G2-10-030-053  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1138-1169 — Publish Job, Save as draft, Save draft, Update Job, Publish now.
- vNext now: src/components/placements/placement-job-create-form.tsx:1451-1465 — Create draft/Publish buttons only, separate edits.
- Fix: Restore role/state-appropriate CTA text.

## G2-10-030-054  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:139-205,371-435 — async hierarchy loads and dependency filters.
- vNext now: src/components/placements/placement-job-create-form.tsx:161-186,1196-1315 — preloaded academic choices filtered client-side.
- Fix: Compare stale dependent dropdown clearing and race guarding.

## G2-10-030-055  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:40-43,818-895 — max20 date rows and max20 custom-rule rows.
- vNext now: src/components/placements/placement-job-create-form.tsx:1170-1192 — text parser/list size checks rather than bounded UI rows.
- Fix: Maintain bounded additions and precise overflow guidance.

## G2-10-030-058  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:99-105,332-343 — edit deadlines and custom rules tracked in dirty state.
- vNext now: src/components/placements/placement-job-create-form.tsx:673-685 — onChange marks form dirty; no equivalent full edit form.
- Fix: Ensure every edit field triggers unsaved guard.

## G2-11-013-005  [P2] GAP  facet F02  effort L
- Legacy: Old cards are Start from, The drive, Pay packages, Eligibility, Skills, Rounds. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:547`
- vNext now: New sections are season/company, Drive details, Additional details, Eligibility, Interview rounds. `src/components/placements/placement-job-create-form.tsx:714`
- Fix: Restore original card arrangement and section order.

## G2-11-013-006  [P2] GAP  facet F02  effort M
- Legacy: Setup review is a sticky right-side milestone card. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:728`
- vNext now: New Setup review is collapsible at top. `src/components/placements/placement-job-create-form.tsx:693`
- Fix: Restore right-side review rail with four legacy milestones.

## G2-11-013-008  [P2] GAP  facet F02  effort L
- Legacy: AntD vertical form uses responsive 24-column grids. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:557`
- vNext now: New CSS grid and border-bottom form sections. `src/components/placements/placement-job-create-form.tsx:903`
- Fix: Clone control metrics, card borders and breakpoints.

## G2-11-013-011  [P2] GAP  facet F03  effort S
- Legacy: Duplicate warning identifies existing drive and Open it. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:541`
- vNext now: New link exists inside Company Memory disclosure. `src/components/placements/placement-job-create-form.tsx:842`
- Fix: Promote alert at form head when title matches.

## G2-11-013-012  [P2] GAP  facet F03  effort M
- Legacy: Save dot says Not saved yet, Saving changes, All changes saved or Changes not saved. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:491`
- vNext now: New message reports browser-local draft backup only. `src/components/placements/placement-job-create-form.tsx:689`
- Fix: Show server save state distinct from local backup.

## G2-11-013-013  [P2] GAP  facet F03  effort S
- Legacy: Preset rounds selectable via three shortcut buttons. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:703`
- vNext now: New Round template dropdown with planned summary. `src/components/placements/placement-job-create-form.tsx:1424`
- Fix: Offer original 3 preset shortcut buttons.

## G2-11-013-015  [P2] MISSING  facet F04  effort M
- Legacy: Joining bonus LPA entered per package. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:631`
- vNext now: No joining bonus input. `src/components/placements/placement-job-create-form.tsx:1033`
- Fix: Add per-package joining bonus and persistence.

## G2-11-013-016  [P2] MISSING  facet F04  effort M
- Legacy: Stipend months entered with min1. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:635`
- vNext now: Only stipend per month entered. `src/components/placements/placement-job-create-form.tsx:1038`
- Fix: Add duration months with validation.
