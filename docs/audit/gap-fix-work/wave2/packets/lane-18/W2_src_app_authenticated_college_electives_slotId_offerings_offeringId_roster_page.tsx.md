# Work packet (wave 2): edit src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-electives.md

## G2-9-007-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/OfferingRosterDrawer.jsx:119-142` — Roster is nested 1000px drawer with toolbar/table
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:119-140` — Separate PageHeader + counters + table + faculty sections
- Fix: Match section order and nested panel behaviour

## G2-9-007-017  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/OfferingRosterDrawer.jsx:92-98` — Roster Student/roll, Dept, State, How, Since, actions
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:135-149` — Roster Student, State, Source, Since, actions
- Fix: Restore roll and department and source labels

## G2-9-007-032  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:227-248` — Faculty modal simultaneously selects primary and co-teachers
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:180-209` — Faculty role managed one assignment/removal at time
- Fix: Preserve combined editing and primary deduplication

## G2-9-007-057  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/OfferingRosterDrawer.jsx:125-141` — Archived read-only notice, retry on load failure and mutation errors
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:131-139` — Read-only notice/feedback exist but no data read retry
- Fix: Add roster retry with safe error details

## G2-9-007-062  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/OfferingRosterDrawer.jsx:119-122` — Roster drawer min 1000, viewport-60
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:119-125` — Full-page responsive roster
- Fix: Compare tablet and phone containment and restore drawer contract

## G2-9-007-064  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/OfferingRosterDrawer.jsx:99-114` — Remove uses confirmation Popconfirm
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:167-174` — Requires confirm-removal checkbox
- Fix: Use accessible equivalent confirmation with focus announcement
