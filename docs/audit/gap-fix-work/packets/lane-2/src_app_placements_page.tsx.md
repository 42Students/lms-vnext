# Work packet: edit src/app/placements/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/placements-index.md

## G2-11-001-081  [P0] GAP  facet F23  effort L
- Legacy: Legacy recruiting form available for any published page. `docs/legacy-source/frontend/src/pages/placements/index.js:83`
- vNext now: vNext hides behind two deployment flags. `src/app/placements/page.tsx:72`
- Fix: Fulfil DB09/proxy verification and keep form available.

## G2-11-001-056  [P1] GAP  facet F13  effort M
- Legacy: Load error separate from missing and retryable. `docs/legacy-source/frontend/src/pages/placements/index.js:69`
- vNext now: Optional-read can display partial page on read errors. `src/app/placements/page.tsx:12`
- Fix: Dedicated retryable error state.

## G2-11-001-076  [P1] GAP  facet F22  effort L
- Legacy: One college_placements_page row with about, numbers, enabled, updated_by. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:67`
- vNext now: Split settings and content tables. `src/app/placements/page.tsx:9`
- Fix: Document migration field mapping and constraints.

## G2-11-001-038  [P2] GAP  facet F07  effort S
- Legacy: 404 uses explicit unpublished explanation. `docs/legacy-source/frontend/src/pages/placements/index.js:68`
- vNext now: Next `notFound()` generic fallback. `src/app/placements/page.tsx:35`
- Fix: Route-specific 404 text.
