# UI clone states audit — lane chat-5 (2026-10-19)

Goal: make vNext look like a new module inside the old LMS, without changing page content. Reviewed `docs/design/ui-clone-checklist.md` (WORK STYLE, STRICT TICK RULE); `docs/orchestrator/queues/master-queue.md` (OWNER GOAL); `docs/design/old-lms-pages.md`; `docs/design/old-lms-shell.css`; and legacy SCSS files `components___variables.scss`, `components___common.scss`, `components___antddesign.scss`, `components___button.scss` and `components___notification-drawer.scss`.

Branch: `chatgpt/chat-5-b` only; commits tagged [chat-5]. This turn migrated **38** loading routes to shared GracefulPageLoading and created a full source-path inventory at [clone-states-work-queue.md](clone-states-work-queue.md). App code was not run; no typecheck, lint, test, CI, browser or screenshot verification.

## F3 — Alerts, banners, inline notices: source/value table

| Property and state | Old LMS exact source/value | vNext source/value | Result |
| --- | --- | --- | --- |
| Warning status colour | `legacy-styles/components___variables.scss:69` = #d97706 | `src/app/globals.css:42` = #d97706 | Token matches |
| Warning subtle background | `legacy-styles/components___variables.scss:70` = rgba(217,119,6,0.10) | `globals.css:43` matches, but `src/components/ui/banner.tsx:10` uses --lms-warning-surface instead | **Unmatched effective Banner surface** |
| Info colour/background | `legacy-styles/components___variables.scss:73-74` = #26bac7 / #eff8fa | `globals.css:49-50` matches; `banner.tsx:8` and `alert.tsx:8` use primary-subtle | Same canonical palette, computed style unproved |
| Slim warning strip | `docs/design/old-lms-pages.md:7` = slim pale-yellow banner with info dot | `banner.tsx:15-18` = default warning, 10px vertical padding, 6px dot, control radius | Exact old dimensions not supplied; **open** |
| Outlined strip action | `old-lms-pages.md:7` = outlined action | `banner.tsx:5,19` = arbitrary action ReactNode | Not guaranteed; **open** |
| Dismiss default/hover/focus | No exact legacy timing or state table established | `inline-notice.tsx:12-41` = 5000ms visible-tab success timeout plus Dismiss | **Open** |
| Phone/tablet wrap | `legacy-styles/components___antddesign.scss:21-23` = 767px mobile breakpoint | `banner.tsx:16` uses flex-wrap; no measured 767px breakpoint proof | **Open** |

- [ ] F3 Alerts/Banners/Inline notices (missing: equivalent effective warning surface; guaranteed outlined action; legacy dimensional values; complete per-state, responsive and grep evidence).

## F4 — Loading, dotted spinner, skeleton and button pending: source/value table

| Property and state | Old LMS exact source/value | vNext source/value | Result |
| --- | --- | --- | --- |
| Skeleton background | `legacy-styles/components___variables.scss:31` = #f1f4f9 | `src/app/globals.css:33` = #f1f4f9; `src/components/ui/skeleton.tsx:22` uses that token | Equal background |
| Skeleton radius | `legacy-styles/components___common.scss:237-238` = neutral-100 fill and 6px radius in a legacy common block | `skeleton.tsx:10-16,22` = varying card/control/skeleton radii | Exact per-state value still unproved |
| Shimmer motion | No exact legacy in-product skeleton duration sourced | `globals.css:281-297` = 1.5s animation | **Open** |
| Dotted spinner | `old-lms-pages.md` Behaviour notes mentions only an initial *dev compile* spinner, explicitly not part of UI spec | `skeleton.tsx:18-27` uses shimmer; `button.tsx` uses a rotating ring | **Open:** do not assume a production spinner appearance |
| Slow retry | Legacy pending-screen duration not measured | `graceful-page-loading.tsx:8-27` exposes “Try again” after 12 seconds using secondary Button | Behaviour exists, pixel values unproved |
| Reduced motion | No exact legacy rule established | `skeleton.tsx:22` disables animation on reduced motion | Accessible; parity still open |
| 767px responsive | `components___antddesign.scss:21-23` = 767px | Shared loader is fluid; exact 320px and 640–767px interval not verified | **Open** |

- [ ] F4 Loading/spinner/skeletons/button loading (missing: all exact values, full source grep/route coverage, and phone/tablet state proof).

## F5 — Empty/error states, 403/404/500, maintenance, session expiry, offline, retry

| Property/state | Old LMS exact source/value | vNext source/value | Result |
| --- | --- | --- | --- |
| Body text | `legacy-styles/components___variables.scss:25` = #54505d | `globals.css:28` = #54505d; `empty-state.tsx:8` uses body text token | Baseline matches |
| Error status | `legacy-styles/components___variables.scss:71` = #ef4444 | `globals.css:44` = #ef4444 | Token matches |
| Empty drawer layout | `legacy-styles/components___notification-drawer.scss:272-282` = centered flex column, 32px 20px padding | `empty-state.tsx:6-10` = responsive page empty component; different context | **Open:** needs separate drawer/page comparison |
| Empty drawer typography | `notification-drawer.scss:309-318` = 14px; 500-weight message | `empty-state.tsx:7` = large semibold heading | **Open:** page and drawer not equivalent |
| Error surface | `old-lms-pages.md:1` = white canvas, no verified pink error card | `error-state.tsx:6` = transparent hairline; `globals.css:593` forces red-tinted ErrorState background | **Open conflict**, global-skin lane owns globals.css |
| Recovery action | Exact legacy handler/size not established | `error-state.tsx:6-9` role alert, action slot | Functional contract present; pixel proof pending |
| Public 403 | Legacy dimensions not established | `src/app/forbidden/page.tsx:1-11` uses GracefulScreen | **Open** |
| Public 404 | Legacy dimensions not established | `src/app/not-found.tsx:1-8` uses GracefulScreen | **Open** |
| Public 500 | Legacy dimensions not established | `src/app/error.tsx:1-11` uses GracefulErrorBoundary | **Open** |
| Offline/maintenance/session-expired | No legacy comparison established | `src/app/offline/page.tsx:1-12` and `src/app/maintenance/page.tsx:1-12` use GracefulScreen; session expiry unreviewed | **Open** |
| Phone/tablet | `components___antddesign.scss:21-23` = 767px | `empty-state.tsx:6` uses sm: spacing (640px) | **Open** |

- [ ] F5 Empty/Error/Recovery states (missing: per-route source inspection and grep, session expiry, exact values, responsive screenshots, and globals.css effective-style resolution).

## Work queue and count proof

The complete *non-truncated GitHub Git-tree path inventory* of main contains **1,041 state files**, comprising **511 loading.tsx**, **512 error.tsx** and **18 not-found.tsx**. These numbers are full-tree **filename counts only**, NOT proof of component usage. All paths are individually listed, unchecked, in [clone-states-work-queue.md](clone-states-work-queue.md). Exactly **38** route loading files were migrated to shared `GracefulPageLoading` this turn, retaining export names and explicit loading labels.

Equivalent shell commands for those filename counts (NOT run; computed from Git tree API):
`git ls-tree -r --name-only main src/app | grep -Ec '(^|/)loading\.tsx$'` → 511
`git ls-tree -r --name-only main src/app | grep -Ec '(^|/)error\.tsx$'` → 512
`git ls-tree -r --name-only main src/app | grep -Ec '(^|/)not-found\.tsx$'` → 18

Required **unexecuted content greps**, counts remain **unknown**, NOT zero:

`grep -rlE 'animate-pulse|bg-muted|bg-surface-secondary' src/app --include='loading.tsx' | wc -l`
`grep -rlE '<(Banner|Alert|EmptyState|ErrorState)[ >]' src --include='*.tsx' | wc -l`
`grep -rnE 'role="(alert|status)"|Could not load|Try again|Session expired|offline' src/app src/components --include='*.tsx'`
`grep -rlE 'rounded.*bg-(amber|yellow)|bg-\[#fff' src/app src/components --include='*.tsx'`
`grep -rlE '<button[ >]' src/components/ui/inline-notice.tsx src/components/ui/banner.tsx src/components/ui/error-state.tsx`

The strict coverage proof is pending until actual source greps identify every bespoke state. Source inspection of 38 edited loaders found self-closing shared JSX without raw open/close-tag conversions; this is **not** a compiler or browser guarantee.

## Priority queue

1. Current checkpoint: finish value/state tables, cross-portal greps and responsive proof for the 38 changed loading routes; never claim a strict tick based only on component imports.
2. **Exact next file:** `src/app/(authenticated)/tpo/reports/intelligence/loading.tsx` — bespoke animate-pulse blocks remain. Continue TPO reports, placement jobs, drives and selection workflows, preserving all existing page content.
3. Review `src/components/ui/banner.tsx` warning effective surface and secondary/outlined actions, `alert.tsx` tone states and `inline-notice.tsx` dismiss/focus states; edit ONLY explicitly owned UI component files.
4. Inspect the remaining loading/error/not-found routes in inventory, plus public `forbidden`, `offline`, `maintenance` and session-expired states. Existing shared primitives need proof before any tick; do not rewrite already-compliant routes gratuitously.
5. Coordinate the red-tinted `[data-slot="error-state"]` global style in `src/app/globals.css:593` with the global CSS owner; do not edit that file from chat-5.
6. After all sources are exhausted: replay source greps for zero bespoke instances or documented exemptions, prove 320px/767px/tablet layouts, record exact legacy/vNext line-by-line value equality, and verify JSX integrity. Checklist J screenshot parity belongs to orchestrator.

**F3/F4/F5 remain unticked** until every element of STRICT TICK RULE is satisfied. No tests or CI were run.


## Bounded turn 2 — legacy feedback/value-matching and dynamic state sweep (2026-10-19)

**Branch synchronization:** The lane head was 1,019 commits behind `main` and 0 ahead. Fast-forwarded `chatgpt/chat-5-b` to `main` at `46cd0161a0e289e7da68e615359589b03ee463e9` before the changes below. Only the lane branch was written. GitHub file-source reads and textual JSX inspection were used; **no app code, build, lint, tests, CI, or browser** was run.

**Changes:** 20 TPO route `loading.tsx` states use the existing shared `GracefulPageLoading` with explicit context labels and directory skeletons; 16 page-level source commits replace bespoke placement notices, offer/joining status pills and navigation controls with shared `Banner`, `Alert`, `Badge` and `Tabs`. The fully enumerated 1,041-path work queue is updated with 20 “migrated” annotations, deliberately keeping every checkbox open until strict proof.

### Verified source-level value comparisons and remaining mismatches

| Case/property | Legacy exact source and value | Current vNext source and value | Result / open evidence |
| --- | --- | --- | --- |
| Success status token | `docs/design/legacy-styles/components___variables.scss:67-68`: #059669, rgba(5,150,105,.10) | `src/app/globals.css:40-41`: same values; `src/components/ui/badge.tsx:10` references success-subtle and success-text | Canonical semantic hue/surface match; text/contrast and responsive presentation not fully proved |
| Warning status token | `legacy-styles/components___variables.scss:69-70`: #d97706, rgba(217,119,6,.10) | `globals.css:42-43`: same token values; `badge.tsx:11` uses warning-subtle | Token equality. Warning Banner independently uses pale-yellow `--lms-warning-surface` (`banner.tsx:10`), not the transparent pill surface; do not conflate pills and notices |
| Error status token | `legacy-styles/components___variables.scss:71-72`: #ef4444, rgba(239,68,68,.10) | `globals.css:44-45`: same | Token equality; full ErrorState component contrast/visual parity remains unproved |
| Info status token | `legacy-styles/components___variables.scss:73-74`: #26bac7, #eff8fa | `globals.css:49-50`: same; `badge.tsx:9` and `banner.tsx:8` use primary-subtle | Canonical palette equality; effective background/computed value and interaction-state proof still open |
| Slim notice | `docs/design/old-lms-pages.md:7`: pale-yellow strip, info dot, outlined action | `src/components/ui/banner.tsx:15-19`: warning default, 6px dot, 10px vertical padding, action slot | Used on TPO offer-release information, cancellation/close blocks; **open** exact legacy geometry and action variant evidence |
| Counted tabs | `docs/design/old-lms-pages.md:4`: counts and teal active underline | `src/components/ui/tabs.tsx` navigation branch: teal border on active and rendered counts; used for offer statuses and company-share filters | Source-pattern match; **open** exact underline height/timing, 320px/767px behavior and keyboard visual comparison |
| Warning count-pill judgment | `docs/design/old-lms-pages.md:3-4`: needs-doing/attention chips and count tabs | `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx`: warning `Badge` for positive REQUESTS and neutral for other counts | Preserved warning visual priority and active URL semantics; intentionally did not collapse every count to identical neutral tab styling |
| Loading neutral | `legacy-styles/components___variables.scss:31`: #f1f4f9 | `src/components/ui/skeleton.tsx:22`: neutral-100 from `globals.css:33` = #f1f4f9 | Same base fill, no measured spinner/shimmer equivalence |
| Responsive reference | `legacy-styles/components___antddesign.scss:21-23`: mobile maximum 767px | Shared Tabs uses horizontal scroll and shared Banner wraps; sources `tabs.tsx`, `banner.tsx` | Functional containment visible in source; **open** 320px/tablet/browser proof |

### Judgment/behavior preservation checklist (source review only)

- **Offer register** — `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx`: route-filter tabs keep each status query and all previously appended search/filter parameters. Shared `Tabs` receives count as numeric prop and renders navigation links, not inert client-state buttons. Status `Badge` uses ACCEPTED=success, DECLINED/WITHDRAWN=error, EXPIRED=warning, else info. The offer-release policy remains verbatim, now in a warning `Banner`.
- **Joining** — `jobs/[jobId]/joining/page.tsx`: JOINED=success, DID_NOT_JOIN=error, DEFERRED=warning, otherwise info; text remains the formatted existing status. “No currently accepted offers” copy remains unchanged inside shared info `Banner`.
- **Selection gating and change requests** — `jobs/[jobId]/selections/page.tsx`, `change-requests/page.tsx`: conditionals, migration-dependent operations and user-visible text remain, now using warning `Alert` (including both opening and closing tags).
- **Drive cancellation and close-preview** — `cancel-preview/page.tsx` and `close-preview/page.tsx`: do not alter conditional business rules or messages; blocked states are now slim warning `Banner`.
- **Company share** — `share-preview/page.tsx` and `share-audit/page.tsx`: existing `companyShareLinksHref` and `tpoCompanyAuditHref` builders are passed through to `Tabs` navigation, preserving query parameters and destination. Pending migration uses shared warning `Alert`.
- **Recorded-outside and interview-slot proposals** — confirmed outside-drive save uses success `Banner`; missing recruiter proposals show shared info `Alert`. Both preserve pre-existing text.
- **Loading** — 20 paths under `tpo/reports/**/loading.tsx` and `tpo/placements/jobs/**/loading.tsx` have scoped labels and directory-shaped shared skeletons; the shared loader still owns its slow-network retry and reduced-motion skeleton behavior.

### Remaining proof (no premature ticks)

- [ ] F3 (missing: complete effective value table of default/hover/focus/error, legacy banner geometry, outlined action parity, whole-project hand-rolled grep counts and phone/tablet proof).
- [ ] F4 (missing: production-source dotted spinner comparison, per-route inventory and source grep for bespoke pulse states, exact per-shape/shimmer state values, phone/tablet proof).
- [ ] F5 (missing: bespoke error/empty handling census across the 1,041 route-state files, legacy 403/404/500/session/offline comparisons, 640–767px proof, and inherited `globals.css:593` error-surface discrepancy).

Equivalent **unexecuted** verification command: `grep -rlE 'animate-pulse|bg-muted|bg-surface-secondary' src/app --include='loading.tsx' | wc -l`; count **not known**, and must not be reported as zero. Source grep for bespoke pill, tab, warning and status-state markup still needed across all portal pages. Textual review of the replaced JSX found paired component close tags; TypeScript syntax/type checking and screenshots were deliberately not run.

**Exact next file for bounded turn 3:** `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx` — inspect bulk-staging notices, empty result table and dynamic result status/filtered counts, then sweep remaining TPO placements pages and revisit F3/F4/F5 strict source proofs.
