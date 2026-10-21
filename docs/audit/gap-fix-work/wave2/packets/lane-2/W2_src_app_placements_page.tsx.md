# Work packet (wave 2): edit src/app/placements/page.tsx

29 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/placements-index.md, docs/audit/gap2/lane-17/public-job-response-dto.md, docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-11-001-004  [P2] GAP  facet F02  effort S
- Legacy: Gray #f5f7f9 outer shell, 760px width, 32px vertical padding. `docs/legacy-source/frontend/src/pages/placements/index.js:63`
- vNext now: White bordered canvas max-w-4xl and margins. `src/app/placements/page.tsx:42`
- Fix: Match outer backdrop/width/padding.

## G2-11-001-005  [P2] GAP  facet F02  effort S
- Legacy: One Ant Card for heading, about, stats, footer caption. `docs/legacy-source/frontend/src/pages/placements/index.js:67`
- vNext now: Header + independent about section + stat grid. `src/app/placements/page.tsx:63`
- Fix: Restore information grouping/order.

## G2-11-001-007  [P2] GAP  facet F02  effort S
- Legacy: Heading `Placements at {collegeName}`. `docs/legacy-source/frontend/src/pages/placements/index.js:74`
- vNext now: Heading shows only college name. `src/app/placements/page.tsx:44`
- Fix: Restore full heading.

## G2-11-001-008  [P2] GAP  facet F03  effort S
- Legacy: Ant Statistic, wrapped spacing 32. `docs/legacy-source/frontend/src/pages/placements/index.js:78`
- vNext now: Min-height 104 StatTile. `src/app/placements/page.tsx:69`
- Fix: Remove boxed stat tiles.

## G2-11-001-009  [P2] GAP  facet F03  effort S
- Legacy: The 12-month caption only when at least one metric. `docs/legacy-source/frontend/src/pages/placements/index.js:81`
- vNext now: Caption whenever published, even no released metrics. `src/app/placements/page.tsx:67`
- Fix: Gate on actual displayed metric count.

## G2-11-001-021  [P2] GAP  facet F04  effort S
- Legacy: About paragraph follows heading with pre-wrap. `docs/legacy-source/frontend/src/pages/placements/index.js:75`
- vNext now: Adds About your placements heading. `src/app/placements/page.tsx:64`
- Fix: Remove extra subsection title.

## G2-11-001-023  [P2] GAP  facet F05  effort S
- Legacy: Metrics iterated selected order, skipping null. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:101`
- vNext now: Iterated key order while including suppressed tiles. `src/app/placements/page.tsx:69`
- Fix: Preserve order but omit hidden values.

## G2-11-001-043  [P2] GAP  facet F10  effort M
- Legacy: GET public page via /api/v1/public/placements-page. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:50`
- vNext now: SSR queries branding, content, metrics independently. `src/app/placements/page.tsx:26`
- Fix: Prove identical error and freshness behavior.

## G2-11-001-055  [P2] GAP  facet F13  effort S
- Legacy: 404 explicit `This page isn't available`. `docs/legacy-source/frontend/src/pages/placements/index.js:68`
- vNext now: Next sends to global 404. `src/app/placements/page.tsx:35`
- Fix: Route-specific not found.

## G2-11-001-061  [P2] GAP  facet F16  effort S
- Legacy: Stats wrap at 32px gap, no breakpoint. `docs/legacy-source/frontend/src/pages/placements/index.js:77`
- vNext now: Fixed columns at 768/992. `src/app/placements/page.tsx:68`
- Fix: Use legacy wrap at 375/768/1280.

## G2-11-001-066  [P2] GAP  facet F18  effort S
- Legacy: Heading literal `Placements at`. `docs/legacy-source/frontend/src/pages/placements/index.js:74`
- vNext now: Only college name. `src/app/placements/page.tsx:44`
- Fix: Match heading.

## G2-11-001-067  [P2] GAP  facet F18  effort S
- Legacy: `Live numbers over the last 12 months.` after the stats. `docs/legacy-source/frontend/src/pages/placements/index.js:81`
- vNext now: Same words before stats. `src/app/placements/page.tsx:67`
- Fix: Reorder caption.

## G2-17-021-008  [P2] MISSING  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:19-32 — 12 safe-field properties including nested importantDates.
- vNext now: src/app/placements/page.tsx:1-30 — No evidence of equivalent per-job DTO on public route.
- Fix: Define explicit projection and map all 12 fields.

## G2-4-026-001  [P2] GAP  facet F01  effort M
- Legacy: Guest GET `/api/v1/public/placements-page` resolves host (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:20-26,50-56`)
- vNext now: SSR public `/placements` route derives tenant and 404 (`src/app/placements/page.tsx:19-35`)
- Fix: Keep browser-visible route and legacy JSON API compatibility for external clients.

## G2-4-026-005  [P2] GAP  facet F02  effort M
- Legacy: Grey full-viewport shell; centered max760; first Card title+about+metrics (`docs/legacy-source/frontend/src/pages/placements/index.js:62-83`)
- vNext now: White max-4xl canvas; inline header/about/metric grid (`src/app/placements/page.tsx:41-70`)
- Fix: Match grey backdrop, 760px content, card placement and section order.

## G2-4-026-006  [P2] GAP  facet F02  effort M
- Legacy: `Placements at {collegeName}` title, about directly beneath, numbers then last-12-month note (`docs/legacy-source/frontend/src/pages/placements/index.js:73-82`)
- vNext now: College name title, status updated note, About section and note before tiles (`src/app/placements/page.tsx:43-69`)
- Fix: Restore title, about, metrics, last-12-month note order.

## G2-4-026-008  [P2] GAP  facet F03  effort M
- Legacy: Inline AntD Statistic: value under title, wrapped and 32px gap (`docs/legacy-source/frontend/src/pages/placements/index.js:77-81`)
- vNext now: 3-column `StatTile` cards (`src/app/placements/page.tsx:68-70`)
- Fix: Match Statistic typography and non-card inline layout.

## G2-4-026-012  [P2] GAP  facet F03  effort M
- Legacy: Loading skeleton and distinct 404/warning Result cards (`docs/legacy-source/frontend/src/pages/placements/index.js:67-69`)
- vNext now: SSR 404 and inline unavailable notices (`src/app/placements/page.tsx:32-35,53-62`)
- Fix: Match original loading, missing and retry content.

## G2-4-026-023  [P2] GAP  facet F05  effort S
- Legacy: Suppressed metric rows disappear and remaining order unchanged (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:101-113`)
- vNext now: Maps every selected key to tile (`src/app/placements/page.tsx:68-69`)
- Fix: Filter metrics by k-anonymity before mapping to grid.

## G2-4-026-042  [P2] GAP  facet F09  effort M
- Legacy: Loading/404/retry Result cards in page shell (`docs/legacy-source/frontend/src/pages/placements/index.js:67-70`)
- vNext now: notFound/inline notices; no Retry UI (`src/app/placements/page.tsx:32-35,53-62`)
- Fix: Provide equivalent missing/temporary failure views and retry button.

## G2-4-026-044  [P2] GAP  facet F10  effort M
- Legacy: Host→college id; GET calls page service (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:45-55`)
- vNext now: Resolve host then content/statistics/branding reads (`src/app/placements/page.tsx:19-35`)
- Fix: Match one canonical endpoint/response for public API consumers.

## G2-4-026-057  [P2] GAP  facet F13  effort M
- Legacy: Explicit loading/missing/error/retry states (`docs/legacy-source/frontend/src/pages/placements/index.js:12,20-30,67-70`)
- vNext now: Server render/unavailable notices; no retry action (`src/app/placements/page.tsx:19-35,53-62`)
- Fix: Add client error retry and shell-level loading skeleton.

## G2-4-026-065  [P2] GAP  facet F16  effort M
- Legacy: Centered 760px max with 32/16 padding, cards vertically stacked (`docs/legacy-source/frontend/src/pages/placements/index.js:62-65,73-83`)
- vNext now: Max-4xl canvas, cards 1→2→3 metrics at breakpoints (`src/app/placements/page.tsx:42,68-70`)
- Fix: Match 760px mobile content and vertical card stack.

## G2-4-026-068  [P2] GAP  facet F17  effort M
- Legacy: Loading/error uses Result icon and accessible Retry button (`docs/legacy-source/frontend/src/pages/placements/index.js:67-69`)
- vNext now: Status text no retry (`src/app/placements/page.tsx:53-62`)
- Fix: Add keyboard-focusable retry and status-appropriate heading.

## G2-4-026-069  [P2] GAP  facet F18  effort S
- Legacy: Heading `Placements at {collegeName}` (`docs/legacy-source/frontend/src/pages/placements/index.js:74`)
- vNext now: Just `{collegeName}` (`src/app/placements/page.tsx:43-45`)
- Fix: Restore title.

## G2-4-026-071  [P2] GAP  facet F18  effort S
- Legacy: Missing page `This page isn't available` / `The placement cell hasn't published a placements page here.` (`docs/legacy-source/frontend/src/pages/placements/index.js:68-69`)
- vNext now: Generic notFound (`src/app/placements/page.tsx:32-35`)
- Fix: Use exact missing-publication wording.

## G2-4-026-072  [P2] GAP  facet F18  effort S
- Legacy: Loading error `We couldn't load this page` and Retry (`docs/legacy-source/frontend/src/pages/placements/index.js:69`)
- vNext now: Different temporary-unavailable copy, no retry (`src/app/placements/page.tsx:53-62`)
- Fix: Restore explicit retry view when data service fails.

## G2-4-026-073  [P2] GAP  facet F18  effort S
- Legacy: `Live numbers over the last 12 months.` after metrics (`docs/legacy-source/frontend/src/pages/placements/index.js:81`)
- vNext now: Same text before metrics (`src/app/placements/page.tsx:67`)
- Fix: Move note below metrics.

## G2-11-001-069  [P3] GAP  facet F19  effort M
- Legacy: Fetch on mount; no client caching/pagination. `docs/legacy-source/frontend/src/pages/placements/index.js:30`
- vNext now: SSR multi-service reads. `src/app/placements/page.tsx:29`
- Fix: Check cache, query load, freshness and error parity.
