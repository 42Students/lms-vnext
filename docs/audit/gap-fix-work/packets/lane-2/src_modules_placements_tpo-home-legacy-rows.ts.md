# Work packet: edit src/modules/placements/tpo-home-legacy-rows.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l11-u014-tpo-home.md

## G2-11-014-017  [P1] GAP  facet F04  effort M
- Legacy: Legacy drives status N live and first eligible action from needsYou, request count may appear; attention across multiple urgency types (homeRows.js:74-84,92-96).
- vNext now: vNext drives status N live plus first operations.workQueue mapped detail, request attention from queue; separate pendingRequests value (tpo/home/page.tsx:123-136; tpo-home-legacy-rows.ts:33-34).
- Fix: Compare all legacy DRIVE_REQUESTS/RESULTS_READY/SELECTIONS_TO_VERIFY/DEADLINE_TODAY/SHARE_APPLICANTS urgency and row attention.

## G2-11-014-022  [P1] GAP  facet F05  effort M
- Legacy: Legacy Needs you row attention derived from actual needsYou array per row (homeRows.js:82-84,92-105).
- vNext now: vNext most row attention from recomputed aggregates; Inbox pendingRequestCount fallback 0 if read unavailable (tpo/home/page.tsx:117-145; tpo-home-legacy-rows.ts:28-74).
- Fix: Avoid false No requests waiting or no action when request counter read failed; keep unavailable status distinct.

## G2-11-014-040  [P1] GAP  facet F12  effort S
- Legacy: Legacy No requests or messages waiting shown only after known Home GET (homeRows.js:100-102).
- vNext now: vNext pendingRequestsCount defaults 0 on null; if unreadMessages 0, row says no requests even if count call failed (tpo/home/page.tsx:53-55,140-141; tpo-home-legacy-rows.ts:35-39).
- Fix: Pass pendingRequests null through row builder and show unavailable when no verified count.
