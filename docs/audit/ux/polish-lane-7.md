# UI/UX polish — lane chat-7

## Surface 1 — `src/app/(authenticated)/admin/placements/shortlisted/page.tsx`

**Problems found (10):** (1) lengthy permissions/filters explanation cramped the page-heading row; (2) Back, Refresh and CSV export fought for header prominence; (3) Search, Status, page-size and submit were treated equally; (4) rarely changed page-size occupied the initial viewport; (5) one-row form cramped at 375px and lacked clear tablet column grouping; (6) results count sat apart from actions; (7) “Clear search” was shown even with no filters; (8) applicant title, status, role and decision had a ragged vertical rhythm; (9) per-row detail link sat as an extra row rather than alongside the record; (10) empty state lacked its own next-step control, while loading used a card skeleton instead of directory rows.

**Removed/merged/moved/realigned:** Opt-in `compactReadLayout` in the existing `AdminScopedReadPage` shared renderer, enabled **only** by this route; other consumers retain their DOM/layout. Left-aligned the existing Placement overview back control above one page h1, and relocated the **unchanged** description underneath as a constrained readable line. Prioritized Search and Status, kept one primary **Filter** submit, and moved existing **Rows per page** into a native, keyboard-accessible details/summary without changing form values or routes. Reflowed the toolbar to full-width, stacked 44px touch controls at 375px and a proportional three-control grid at 768px. Moved existing Refresh and Export matching CSV (max 250) next to the record count, with Clear search only for active filters. Consolidated each list entry's title, status, job/role, existing decision/screening metadata and **Open details →** into a hairline-separated responsive row, with one action column on tablet/desktop and a 44px target on phone. Moved existing Clear search to the no-results EmptyState recovery action; loading now uses the shared directory skeleton, while invalid-filter, access-denied, college-not-selected, unavailable-directory and route error/retry copy and behavior remain intact. No colors, radius tokens, font tokens, IDs, data-testid, existing aria labels, permissions, data output or wording were altered.

**Files changed:**
- `src/app/(authenticated)/admin/placements/shortlisted/page.tsx`
- `src/components/admin/admin-scoped-read-page.tsx` (optional scoped layout; no other callers changed)
- `src/app/(authenticated)/admin/placements/shortlisted/loading.tsx`
- `docs/orchestrator/queues/clone/lane-7-polish.md`
- `docs/audit/ux/polish-lane-7.md`

**Source-level state and viewport audit:** Filled rows, empty search, invalid filters, denied permission, missing selected college, loader failure, route error + Retry, loading + slow network recovery; hover/focus inherit existing shared controls. 1280: aligned record/action columns; 768: constrained search/status/Filter row, secondary actions grouped; 375: stacked full-width primary controls, 44px targets and wrapped record text. Visual browser comparison and CI not performed, per instruction.
