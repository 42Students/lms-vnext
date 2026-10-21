# Work packet (wave 2): edit src/app/(authenticated)/tracker/issues/page.tsx

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l18-u025-public-tracker-logs-access.md, docs/audit/gap2/lane-16/u004-tracker-issues-index.md

## G2-18-025-042  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/components/tracker/TrackerLogsAccessGate.jsx:7-11 — single reporter only, intentionally no username
- vNext now: src/app/(authenticated)/tracker/issues/page.tsx:33-48 — private superadmin issue access and readiness
- Fix: Use named reporter access for minimal logs view, not SuperAdmin capability

## G2-16-004-003  [P2] GAP  facet F01  effort S
- Legacy: `issues/index.js:229-235`: eyebrow `42 Tracker`, H1 Issues, dynamic `N issues. Search what has already been reported before adding another.`
- vNext now: `tracker/issues/page.tsx:83-86`: H1 Issues, static `Private Super Admin triage...` description.
- Fix: Restore dynamic total+purpose subtitle for equivalent visibility scope.

## G2-16-004-005  [P2] GAP  facet F02  effort M
- Legacy: `issues/index.js:229-291`: top header, one-row five filters, saved views dropdown and manager select toggle.
- vNext now: `tracker/issues/page.tsx:83-148`: header, admin tabs, saved view details, search row + More filters accordion + bulk controls.
- Fix: Match section order and single-line desktop filterbar, saved view dropdown and compact select toggle.

## G2-16-004-006  [P2] GAP  facet F02  effort M
- Legacy: `issues/index.js:295-341`: stacked bordered issue cards with ID+location, severity/status, description, three metadata items.
- vNext now: `tracker/issues/page.tsx:154-179`: simple divided articles with ID+type heading, badges, description and long meta line.
- Fix: Restore full-click card layout, title/subline hierarchy, pills and labelled metadata.

## G2-16-004-007  [P2] GAP  facet F02  effort M
- Legacy: `issues/index.js:343-365,367-397`: bulk bar after cards, save-view modal, numbered Pagination footer.
- vNext now: `tracker/issues/page.tsx:148-149,182-191`: bulk before list, saved-view inline disclosure, cursor Older issues link.
- Fix: Place bulk controls below cards when active; save view in modal and restore numbered bottom pagination.

## G2-16-004-008  [P2] MISSING  facet F03  effort S
- Legacy: `issues/index.js:235`: primary `Report issue` link in top-right.
- vNext now: `tracker/issues/page.tsx:83-95`: no Report issue action; only nav tab.
- Fix: Add primary Report issue action next to page heading.

## G2-16-004-009  [P2] GAP  facet F03  effort M
- Legacy: `issues/index.js:239-275`: search, Status, Environment, Reporter dropdowns, Sort order; all visible.
- vNext now: `tracker/issues/page.tsx:97-146`: search+Apply+Reset visible; other fields in More filters disclosure.
- Fix: Expose all five filters in toolbar at desktop breakpoint; keep mobile accessible stacking.

## G2-16-004-013  [P2] MISSING  facet F04  effort M
- Legacy: `issues/index.js:219-222`: count label is `N issue(s)` from pageInfo.totalElements.
- vNext now: `tracker/issues/page.tsx:83-86`: no total count in heading or footer.
- Fix: Expose total row count via aggregate query, show singular/plural in header.

## G2-16-004-014  [P2] GAP  facet F04  effort S
- Legacy: `issues/index.js:322-337`: list card top ID, location, severity, status; bottom reporter, humanized environment, timestamp.
- vNext now: `tracker/issues/page.tsx:160-173`: top `ID · issueType`, status/severity/environment badges; metadata reporter, raw accountRole, location, date.
- Fix: Restore card hierarchy, location alongside ID, reporter/environment/date three-cell bottom row.

## G2-16-004-018  [P2] GAP  facet F04  effort S
- Legacy: `issues/index.js:331`: description rendered full inside card, CSS controls text overflow.
- vNext now: `tracker/issues/page.tsx:170`: line-clamp-2, truncates additional text.
- Fix: Restore description full display or expandable continuation, preserve layout overflow safety.

## G2-16-004-020  [P2] GAP  facet F05  effort S
- Legacy: `issues/index.js:246-268`: Reporter is exact named dropdown of five.
- vNext now: `tracker/issues/page.tsx:112-115`: free-text Reporter name substring input.
- Fix: Render exact reporter select and match exact filter semantics.

## G2-16-004-024  [P2] GAP  facet F05  effort M
- Legacy: `issues/index.js:387-397`: numbered pages, 20/page, no size changer, total server rows.
- vNext now: `tracker/issues/page.tsx:182-191`; `admin-service.ts:170-206`: cursor Older/Newer pages, 50/page and no total.
- Fix: Restore numbered pagination and total record count, or record approved cursor redesign.

## G2-16-004-025  [P2] GAP  facet F05  effort M
- Legacy: `issues/index.js:303-337`: whole card clickable to detail; in select mode click toggles ID.
- vNext now: `tracker/issues/page.tsx:155-177`: only linked ID/type opens detail; bulk separate list.
- Fix: Make complete card click target and selection overlay operate on same row.

## G2-16-004-027  [P2] GAP  facet F06  effort M
- Legacy: `issues/index.js:86-97`: search input auto applies after 300ms debounce, resets page.
- vNext now: `tracker/issues/page.tsx:97-107`: requires Apply filters click.
- Fix: Debounce search by 300ms and update list/URL without explicit apply.

## G2-16-004-028  [P2] GAP  facet F06  effort M
- Legacy: `issues/index.js:246-276`: status/environment/reporter/sort apply instantly, resetting page 0.
- vNext now: `tracker/issues/page.tsx:108-146`: deferred until whole form GET submit.
- Fix: Auto-apply dropdown changes while preserving safe URL hydration.

## G2-16-004-044  [P2] GAP  facet F10  effort M
- Legacy: `issues/index.js:44-84`: filters live in URL with `router.replace(... shallow)` on every edit.
- vNext now: `tracker/issues/page.tsx:97-146`: GET navigation via submit, full server refresh; saved views push navigation.
- Fix: Mirror shallow replace (or client-side equivalent) for filter changes, preserve address-bar state.

## G2-16-004-051  [P2] GAP  facet F12  effort M
- Legacy: `issues/index.js:387-396`: hides Pagination when total<=page size.
- vNext now: `tracker/issues/page.tsx:182-191`: only shows Older issues when cursor present; never numbered page.
- Fix: Hide pagination under threshold but use total and numbered controls above.

## G2-16-004-052  [P2] GAP  facet F13  effort M
- Legacy: `issues/index.js:295-301`: first load displays 3 animated skeleton issue cards.
- vNext now: `tracker/issues/page.tsx:27-67,150-152`: server-rendered list, EmptyState or error; no three-card skeleton in page.
- Fix: Add loading.tsx skeleton matching three list cards.

## G2-16-004-058  [P2] GAP  facet F16  effort M
- Legacy: `issues/index.js:238-291`: horizontal search+four selectors then toolbar, wraps at small widths.
- vNext now: `tracker/issues/page.tsx:97-146`: form grid with mobile full width and accordion extra fields.
- Fix: Restore filterbar visual arrangement at 1280/768 while preserving mobile stacking.

## G2-16-004-059  [P2] GAP  facet F16  effort M
- Legacy: `issues/index.js:303-337`: responsive whole-row issue cards; selection checkbox overlays card.
- vNext now: `tracker/issues/page.tsx:154-179`: vertical articles and independent bulk checkbox list.
- Fix: Restore card/badge/meta alignment and selectable-card state across widths.

## G2-16-004-063  [P2] GAP  facet F18  effort S
- Legacy: `issues/index.js:231-235`: eyebrow `42 Tracker`, intro with `N issues. Search what has already been reported before adding another.`.
- vNext now: `tracker/issues/page.tsx:83-86`: `Private Super Admin triage. Engineering notes ...`.
- Fix: Use exact legacy introduction when returning viewer scope.

## G2-16-004-069  [P2] GAP  facet F19  effort M
- Legacy: `issues/index.js:86-122`: 300ms search debounce and AbortController to avoid stale results.
- vNext now: `tracker/issues/page.tsx:97-107,67`: query executed server side after form navigation, no client search debounce.
- Fix: Debounced URL update and cancel/ignore superseded fetches.

## G2-16-004-015  [P3] GAP  facet F04  effort S
- Legacy: `issues/index.js:332-336`; `bugTrackerData.js:18-25`: environment shown with mapped display label.
- vNext now: `tracker/issues/page.tsx:168,172`: raw uppercase enum displayed.
- Fix: Use environmentLabel to humanize.

## G2-16-004-016  [P3] GAP  facet F04  effort S
- Legacy: `issues/index.js:327-329`: severity pill precedes status pill.
- vNext now: `tracker/issues/page.tsx:165-168`: status first, severity second, environment third.
- Fix: Reorder severity→status and return environment to card meta.

## G2-16-004-054  [P3] GAP  facet F13  effort S
- Legacy: `issues/index.js:293`: errors keep stale items in state while alert shown.
- vNext now: `tracker/issues/page.tsx:38-62,67`: invalid filters render ErrorState and Reset rather than old list.
- Fix: Retain prior filtered results on retriable fetch errors where feasible.

## G2-16-004-065  [P3] GAP  facet F18  effort S
- Legacy: `issues/index.js:250,258,266`: filter placeholders `Status`, `Environment`, `Reporter`.
- vNext now: `tracker/issues/page.tsx:114,119,134`: `Reporter name`, `All statuses`, `All environments`.
- Fix: Restore short placeholders, humanize option labels.
