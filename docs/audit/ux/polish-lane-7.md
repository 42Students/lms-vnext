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


## Surface 2 — `src/app/(authenticated)/admin/placements/student-lookup/page.tsx`

**Problems found (7):** header back navigation and Analytics competed with the primary search; search field occupied only a narrow slice of tablet width; controls lost their common bottom alignment; initial section gaps fragmented the single-canvas layout; student heading, roll/email and joining badge wandered across narrow widths; truncation notice was buried after the entire result list; no-match result had no direct recovery action.

**Fixed:** Left-aligned existing Placement overview back link above the single h1; preserved the Analytics destination/action but demoted it beneath the search bar. Made Name, roll number or email the widest control, paired with one Search students action at 768 and stacked both to full width with 44px targets at 375. Unified 16/12px legacy section gaps and hairline-separated student groups. Added min-width/wrap handling for long names, roll/email; joined status aligns in its own column at tablet widths without overflow. Moved original truncation message ahead of results for immediate visibility; reused existing Clear search label/route as the no-result recovery action. Loading now uses shared directory-row skeleton; invalid query, loader failure, missing scope, no applications and retry states retain wording/behavior and existing IDs/aria labels.

**Files changed:** `src/app/(authenticated)/admin/placements/student-lookup/page.tsx`, `src/app/(authenticated)/admin/placements/student-lookup/loading.tsx`, `docs/orchestrator/queues/clone/lane-7-polish.md`, `docs/audit/ux/polish-lane-7.md`.

**Coverage:** source inspection of page, DateTable, PageHeader, StatusBadge, EmptyState, ErrorState, Input/Button/PageBackLink, graceful loading and route error. Desktop 1280/tablet 768/phone 375 layouts reasoned from explicit grid breakpoints; browser screenshot and CI not run.


## Surface 3 — src/app/(authenticated)/admin/programs/page.tsx

**Problems found (9):** creation form dominated above-the-fold space, fields cramped at 768px, duplicate overview affordances crowded the header, search lacked search semantics, page-size dominated the toolbar, CSV/Refresh alignment was inconsistent, Edit/Archive crowded action cells, mobile Create Program did not fill its column, and loading had a generic card skeleton.

**Fixed:** Made Create New Program an accessible details disclosure (open automatically when there are no programs); all fields, names, IDs, mutation validation, pending/success/error behavior preserved. Kept the existing overview link ahead of PageHeader and the Academic Setup steps under it; widened 768px create fields to two columns, four from 1280, single on phones. Made the primary submit full-width on phones; shared search semantics and aligned toolbar; moved Rows per page into a disclosure, preserved all export/refresh interactions; reuses the concurrently updated compactActions option, which groups Edit and Archive in the existing accessible Actions menu, retaining disabled and confirmation flows. Rows and paging controls wrap, with tabular range numbers; loading is a directory skeleton.

**Files changed:** src/app/(authenticated)/admin/programs/page.tsx; src/components/admin/admin-program-directory.tsx; src/app/(authenticated)/admin/programs/loading.tsx; docs/orchestrator/queues/clone/lane-7-polish.md; docs/audit/ux/polish-lane-7.md.

**States covered:** missing college/permission and service failure, no departments, no programs, populated/filtered page, create validation/pending/response, edit/discard/archive modal/disabled, mobile 375, tablet 768, 1280, route load/retry. Source review; no browser screenshots or CI.


## Surface 4 — src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx

**Problems found (7):** route overflow clipping could cut off controls and overlays; back action crowded the header on phone; heading/breadcrumbs/tabs used inconsistent large gaps; ten workspace tabs were confined by an unnecessary parent clip; release/sprint nesting created double cards; delivery cards added a second outlined surface; loading skeleton was generic.

**Fixed:** Removed route-level overflow clipping, leaving horizontal tab overflow to existing ScrollCue. Added an opt-in `polishAdminSection` passed only by this route through AdminProjectSectionPage to ProjectWorkspace; keeps existing ProjectWorkspace unchanged in other contexts. Moves the same back link before the heading with its route and aria label intact, preserves status/archive controls and breadcrumbs, reduces section rhythm to 16px. Flattens admin release, sprint and delivery nested bordered cards into hairline-separated rows on the white canvas; all existing labels, controls, permissions, calls and dialogs remain. Shared directory-style loading skeleton; route 404/error states unchanged.

**Files changed:** src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx; src/components/projects/admin-project-section-page.tsx; src/components/projects/project-workspace.tsx; src/app/(authenticated)/admin/projects/[projectId]/[section]/loading.tsx; docs/orchestrator/queues/clone/lane-7-polish.md; docs/audit/ux/polish-lane-7.md. **States reviewed:** all ten named sections, filled/empty, archived/read-only, risk reason, all action affordances and existing dialog flows, mobile 375/tablet 768/desktop 1280. Source inspection only; no screenshot or CI.


## Surface 5 — src/app/(authenticated)/admin/projects/[projectId]/page.tsx

**Problems found (1):** this URL is a validated, access-checked redirect to the canonical summary, not a rendered page; the transient loading fallback used a generic card skeleton inconsistent with the destination. No clutter, duplicated actions or responsive content exists in this redirect-only route to remove without changing behavior.

**Fixed:** Left the Super Admin guard, exact project validation, project permission verification, notFound, and redirect URI entirely unchanged. Reused GracefulPageLoading with a project-specific label and the directory skeleton so the transient fallback is calm and consistent. Existing retryable error boundary and not-found behavior preserved. No new UI or route behavior invented.

**Files changed:** src/app/(authenticated)/admin/projects/[projectId]/loading.tsx; docs/orchestrator/queues/clone/lane-7-polish.md; docs/audit/ux/polish-lane-7.md. **States covered:** loading, project access denied, invalid ID not-found, authorized redirect, route error recovery. 375/768/1280 share the same canonical destination. Source review only, no CI.
