# Work packet (wave 3): edit src/components/placements/super-admin-published-drive-edit.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md

## G2-10-014-011  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:619-717 — Job Title/Company Name/Job Description/Responsibilities/Job Type/Location/CTC.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:55-76 — Published edit supports title, description, locations, openings, CTC; no company/type/responsibilities.
- Fix: Restore omitted fields and safe rich editor.

## G2-10-014-012  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:737-813 — Assessment URL, assessment deadline and application deadline inputs.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:46-51; src/components/placements/super-admin-published-drive-edit.tsx:58-61 — Assessment information read-only; only application deadline editable.
- Fix: Add assessment URL/deadline editing.

## G2-10-014-024  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:634-680 — Company Name autocomplete searches companies, warns on no match.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:55-76 — No company selector.
- Fix: Add college-scoped autocomplete.

## G2-10-014-016  [P2] MISSING  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1028-1076 — Preferred Degree, Specialization, Graduation Year, GPA and City.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:55-76 — No candidate preference editor.
- Fix: Restore display-only candidate preferences edit.

## G2-10-014-069  [P2] MISSING  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:139-208 — Hierarchy options loaded separately; cascade resets dependent selections.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:55-76 — Published form no hierarchy controls/data.
- Fix: Load data on demand and reset children.
