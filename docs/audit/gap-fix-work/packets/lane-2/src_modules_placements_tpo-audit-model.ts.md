# Work packet: edit src/modules/placements/tpo-audit-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-audit.md

## G2-11-006-016  [P1] GAP  facet F04  effort M
- Legacy: About labels: Drives, Recruiters, Students, Offers, Rounds, Shares and downloads, Settings, Bulk actions, General. `docs/legacy-source/frontend/src/pages/tpo/audit.js:18`
- vNext now: Kinds: activity/application/screening/round/result/offer/joining/share. `src/modules/placements/tpo-audit-model.ts:1`
- Fix: Preserve entity taxonomy separately from event kind.

## G2-11-006-080  [P1] GAP  facet F23  effort M
- Legacy: Old About categories GENERAL/BULK/SETTINGS/RECRUITER_LEAD/STUDENT and others. `docs/legacy-source/frontend/src/pages/tpo/audit.js:18`
- vNext now: New category enum drops these and adds status-history kinds. `src/modules/placements/tpo-audit-model.ts:1`
- Fix: Keep old facet vocabulary plus approved new kinds.
