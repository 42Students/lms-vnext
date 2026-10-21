# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md

## G2-1-001-010  [P2] GAP  facet F05  effort M
- Legacy: `Faculty.js:764-765`, `Students.js:915-916` filter statuses based on `suspendedAt`; list is account-wide.
- vNext now: `repository.ts:466-517` filters college memberships by enum status and applies 50 default / 100 max (`validation.ts:56-63`).
- Fix: Preserve legacy All/Active/Suspended filter labels and document the new ENDED filter; ensure accurate roster counts.
