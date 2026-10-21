# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u030-drives-landing.md

## G2-17-030-042  [P2] GAP  facet F13  effort M
- Legacy: Initial active loading CardGridSkeleton cards4 cols4, attention ListSkeleton3, jobsRefreshing RefreshStatus; DrivesLanding.js:390-402,497-510
- vNext now: vNext route loading graceful directory, not isolated per-section skeleton; admin/placements/loading.tsx:1-3
- Fix: Render old cards and 3-row attention skeleton separately and refresh-status without wiping cards.
