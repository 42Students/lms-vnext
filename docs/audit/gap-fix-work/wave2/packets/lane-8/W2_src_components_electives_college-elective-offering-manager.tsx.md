# Work packet (wave 2): edit src/components/electives/college-elective-offering-manager.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md, docs/audit/gap2/lane-9/college-admin-electives.md

## G2-10-006-015  [P2] GAP  facet F04  effort S
- Legacy: Old offering seat column renders activeCount / capacity and waitlist tag `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:169-174`
- vNext now: New offering line renders Seats capacity, Enrolled activeMembers, Waitlist count `src/components/electives/college-elective-offering-manager.tsx:119-121`
- Fix: Match old seat ratio and color-coded waitlist chip

## G2-10-006-016  [P2] GAP  facet F04  effort M
- Legacy: Old panel list includes all offerings and per-row faculty, seat, status and actions `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:149-175`
- vNext now: New Manage offerings inline list with course + capacity + roster link + edit/archive `src/components/electives/college-elective-offering-manager.tsx:114-135`
- Fix: Restore multi-column offering table with faculty and capacity details

## G2-10-006-046  [P2] GAP  facet F10  effort M
- Legacy: Old slot view includes offerings, roster and faculty under GET slot `docs/legacy-source/frontend/src/api/Services/ElectiveService.js:12-12` `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:28-53`
- vNext now: New admin list shows summary counts and separate offerings GET fetch `src/modules/electives/admin-directory-service.ts:22-75` `src/components/electives/college-elective-offering-manager.tsx:112-134`
- Fix: Provide equivalent consolidated slot detail endpoint/read model for selected panel

## G2-10-006-070  [P2] GAP  facet F19  effort M
- Legacy: Old each slot offers one detailed selected panel with offerings roster and allocation `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:228-260` `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:10-26`
- vNext now: New per-row Manage offerings and separate roster route; no single selected drilldown `src/app/(authenticated)/admin/electives/page.tsx:94-106` `src/components/electives/college-elective-offering-manager.tsx:119-134`
- Fix: Restore coherent single-slot drilldown path and detailed roster state

## G2-9-007-012  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:203-206` — Primary Add offering action in Offerings tab
- vNext now: `src/components/electives/college-elective-offering-manager.tsx:107-116` — Secondary Manage offerings opens inline disclosure
- Fix: Move primary Add offering inside slot details

## G2-9-007-043  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:55-69` — Dirty offering/faculty/capacity prompts Discard these elective changes
- vNext now: `src/components/electives/college-elective-offering-manager.tsx:44-56` — Inline manager toggles closed without checking dirty state
- Fix: Prompt before discarding unfinished offering edits

## G2-9-007-061  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:193-195` — Detail drawer width min 1100, viewport-40
- vNext now: `src/components/electives/college-elective-offering-manager.tsx:107-173` — Responsive inline section, no width-constrained drawer
- Fix: Match overlay sizing and phone safe gutters
