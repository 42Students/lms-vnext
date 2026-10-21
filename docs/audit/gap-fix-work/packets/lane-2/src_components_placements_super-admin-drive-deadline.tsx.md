# Work packet: edit src/components/placements/super-admin-drive-deadline.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u030-drives-landing.md

## G2-17-030-012  [P1] MISSING  facet F03  effort M
- Legacy: Each active card has More actions dropdown with Duplicate as new drive and Extend deadline; DrivesLanding.js:565-584
- vNext now: vNext portfolio row Open drive only, separate deadline page and clone flow; placement-operations-overview.tsx:100-106; super-admin-drive-deadline.tsx:9-58
- Fix: Restore visible per-card More actions menu with exact labels and linked modal flows.

## G2-17-030-035  [P1] GAP  facet F10  effort M
- Legacy: Legacy `extendJobDeadline` uses current selected collegeId, refreshes jobs/attention; DrivesLanding.js:74-88
- vNext now: vNext POST /api/placements/college/jobs/{id}/extend-deadline; super-admin-drive-deadline.tsx:24-39
- Fix: Verify selected-SuperAdmin college authorization for endpoint; avoid use of college-only action without acting-scope.

## G2-17-030-030  [P2] GAP  facet F08  effort S
- Legacy: Success toast `Deadline extended to D MMM YYYY`, failure `Could not extend the deadline`; DrivesLanding.js:74-88
- vNext now: vNext inline `Deadline extended.` and generic `Deadline extension failed.`; super-admin-drive-deadline.tsx:9-50
- Fix: Use exact toast content and IST formatted date, keep underlying CAS validation.
