# Work packet (wave 2): edit src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-electives.md

## G2-9-007-066  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:330-350` — Eligible students / Allocate selected to and detailed count warning
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx:161-168` — Processed N learner(s); N failed. summary
- Fix: Use legacy added/waitlisted/skipped/timetable detail
