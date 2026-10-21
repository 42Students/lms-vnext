# Work packet: edit src/components/placements/super-admin-published-drive-edit.tsx (part 2 of 2)

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md, docs/audit/gap2/lane-10/superadmin-sections-job-form.md

## G2-10-014-037  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:547-559 — Job updated success toast and save-error banner.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:36-52 — Published edit refresh without success toast.
- Fix: Add success feedback.

## G2-10-030-031  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:558-569 — 409 stale update modal This drive changed since you loaded it with Reload/Dismiss.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:27-50 — FriendlyFetchError feedback inline; no modal.
- Fix: Restore conflict modal and safe reload.
