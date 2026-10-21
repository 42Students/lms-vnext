# Work packet: edit src/components/placements/learner-placements-tabs.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-cell.md

## G2-12-005-059  [P1] GAP  facet F15  effort S
- Legacy: Announcement tab badge counts unread college announcements and listens for read event `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:71-87`
- vNext now: Notices badge counts unread personal alerts only `src/components/placements/learner-placements-tabs.tsx:53-60`
- Fix: Use correct college-wide announcement unread source for tab badge
