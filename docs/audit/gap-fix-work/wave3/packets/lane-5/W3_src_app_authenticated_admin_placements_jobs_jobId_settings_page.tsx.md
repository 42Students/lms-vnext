# Work packet (wave 3): edit src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md

## G2-10-014-012  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:737-813 — Assessment URL, assessment deadline and application deadline inputs.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:46-51; src/components/placements/super-admin-published-drive-edit.tsx:58-61 — Assessment information read-only; only application deadline editable.
- Fix: Add assessment URL/deadline editing.

## G2-10-014-013  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:818-903 — 20 max Important dates dynamic rows with add/removal controls.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:52-56 — Important dates displayed read-only in Additional job details.
- Fix: Restore capped dynamic date editor.

## G2-10-014-017  [P1] MISSING  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1088-1137 — Dynamic Custom Rules label/value max200, max20 rows.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:57-60 — Custom eligibility rules read-only in accordion.
- Fix: Implement bounded custom rules editor.

## G2-10-014-080  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:137-145; docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:619-1137 — Full editor on Settings regardless old open/closed/draft.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:30-36; src/components/placements/placement-drive-workspace.tsx:579-671 — Published only reduced editor; draft moved to Overview.
- Fix: Restore full Settings edit reachability.
