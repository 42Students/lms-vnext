# Work packet (wave 2): edit src/app/(authenticated)/tpo/placements/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-index.md, docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md

## G2-11-012-001  [P2] GAP  facet F01  effort S
- Legacy: Sets selected Redux Drives menu key. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:140`
- vNext now: Sidebar Drives opens /tpo/placements then redirects /lifecycle. `src/app/(authenticated)/tpo/placements/page.tsx:3`
- Fix: Verify selected nav item and preserve old /tpo/drives alias.

## G2-16-031-001  [P2] GAP  facet F01  effort M
- Legacy: tpo/drives/index.js:1-20 is TPO Drives entry; TpoDriveController.java:26-74 exposes /api/v1/tpo/drives
- vNext now: src/app/(authenticated)/tpo/placements/page.tsx:1-6 redirects to /tpo/placements/lifecycle
- Fix: Keep visible label Drives and old tab/bookmark entry paths; compare exact sidebar navigation and redirect status
