# Work packet (wave 2): edit src/components/placements/super-admin-drive-deadline.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md, docs/audit/gap2/lane-11/l17-u030-drives-landing.md

## G2-10-014-052  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:100-102,476-491 — Unchanged past deadlines can remain while editing unrelated fields.
- vNext now: src/components/placements/super-admin-drive-deadline.tsx:13-23; src/components/placements/super-admin-published-drive-edit.tsx:59-60 — Extend deadline strictly > existing; published form requires deadline.
- Fix: Permit unchanged past deadline when editing unrelated properties.

## G2-17-030-023  [P2] GAP  facet F06  effort M
- Legacy: Extend deadline modal DatePicker showTime, format YYYY-MM-DD HH:mm and initial +7 days if past; DrivesLanding.js:74-89,674-698
- vNext now: vNext separate form/confirmation uses datetime-local and +05:30, no initial +7 days; super-admin-drive-deadline.tsx:8-56
- Fix: Recreate defaulting, inline picker, warning copy and modal sizing; preserve safe future deadline checks.

## G2-17-030-032  [P2] GAP  facet F09  effort M
- Legacy: Extend deadline Modal with old current date and explanatory helper about Important Dates; DrivesLanding.js:674-699
- vNext now: vNext form + ConfirmDialog separate route; super-admin-drive-deadline.tsx:36-58
- Fix: Embed modal with current deadline and exact helper text; retain explicit confirmation as added safeguard.
