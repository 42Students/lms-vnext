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

## Codemod handoff — F3/F4/F5 (2026-10-19)

- [ ] `scripts/codemods/chat5-states.cjs`: TypeScript-AST, dry-run-by-default conversion of pulse-only authenticated loading placeholders, literal heading/description empty/error states, and bordered role=status/alert notice panels into `GracefulPageLoading`, `EmptyState`, `ErrorState`, `Alert` or `Banner`; path coverage from the complete, non-truncated `main` tree is **490 authenticated `loading.tsx`, 491 `error.tsx`, 15 `not-found.tsx` (996 total)**, plus candidate inline notices in authenticated pages and `src/components/{placements,tpo}`. Run `node scripts/codemods/chat5-states.cjs` to inspect JSON candidate/skip counts, then `node scripts/codemods/chat5-states.cjs --only=loading --apply` or `node scripts/codemods/chat5-states.cjs --apply` after human diff review. Existing shared fallbacks and `PageHeader`-based not-found pages are intentionally skipped. **No codemod was run or applied here; no route source, UI source, tests or CI changed; grep/computed-style and responsive proof remain open.**

## Extended sprint coverage — 19 October 2026 (chat-5)

Synchronized lane branch by clean fast-forward to `main` SHA `3a77aebd651756d5a16b9fea375ffc276fa4404b` before edits. Main continued moving from concurrent lanes afterwards; compare before rebasing or merging. User requested no CI: no app run, no test, no typecheck, no lint, no screenshot, and the codemod was **not executed**.

**Source changes:** 58 scoped `loading.tsx` files migrated from hand-rolled `animate-pulse` blocks to `GracefulPageLoading` with explicit labels and directory-shaped skeletons. Eight `error.tsx` fallbacks migrated to `ErrorState` or `Alert` without dropping retry actions, `PageHeader` where it existed, learner-home fallback link, or error/empty distinctions. The five loaders with visible supplementary status sentences kept those sentences rather than hiding them in a screen-reader-only label. All 66 source files were re-fetched from the lane branch after update and source-checked for import placement, paired opening/closing tags, missing components, and stray quotes; no issues were found in this textual review. Separately, `clone-states-work-queue.md` was updated with all 66 paths; its 1,041 route entries remain unique and **unticked**.

**Not-found census:** Individually inspected all 15 authenticated `not-found.tsx` paths (admin, college-admin, college offering, college, HR, HR placement job, learner course, learner, learner project, mentor, recruiter, superadmin, teach, teacher, TPO). Existing `PageHeader` or `ErrorState` already conveys the page status, and every route provides a scope-appropriate recovery link. Left unchanged to avoid disrupting copy/navigation; responsive computed-style parity is still unproved.

**Coverage boundaries:** A current non-truncated repository source-tree inventory captured 490 authenticated `loading.tsx`, 491 `error.tsx` and 15 `not-found.tsx` (996 authenticated route-state files). The older work queue tracks 1,041 unique route-state files across all `src/app` groups, including public and non-authenticated pages. The 58/8 migrations are committed, but **do not establish zero remaining handcrafted state instances** or full F3/F4/F5 coverage. The AST codemod at `scripts/codemods/chat5-states.cjs` remains dry-run-by-default and should be reviewed and executed by the orchestrator before any remaining mass migration. The 767px breakpoint, state-by-state effective style values, whole-repo grep output, and screenshot parity are unverified.

- [ ] F3 — legacy alert, banner and inline notice computed values plus whole-project coverage, focus/hover/dismiss and phone/tablet proof remain open.
- [ ] F4 — remaining loader census, pulse/spinner coverage, dynamic cases and 767px responsive evidence remain open; the shared skeleton is already present in the migrated files.
- [ ] F5 — remaining custom `error.tsx` and inline empty/error fragments require audit; 15 not-found files reviewed, but 403/404/500, session, maintenance and offline computed-style parity remain open.

**Exact next file:** `src/app/(authenticated)/college/courses/offerings/[offeringId]/loading.tsx` — it contains both a screen-reader-only loading label and a distinct layout; preserve its accessibility text and page geometry when converting to the shared skeleton, then continue the remaining route-state work queue.

### Extended sprint, second pass — latest source count

**62 authenticated loading routes** now have `GracefulPageLoading` (including the preserving-geometry `college/courses/offerings/[offeringId]` route, and Mentor Notifications with its existing `PageHeader`). **24 authenticated route error fallbacks** now use shared `Alert` or `ErrorState`, preserving user-visible wording, original heading levels in Alert-wrapped routes, retry button callbacks and existing recovery links. Twelve converted Alerts had conflicting bespoke background/border/padding classes removed so the shared component's tone can control its visuals. The 15 existing authenticated `not-found.tsx` recovery pages were source-reviewed and intentionally unchanged. These numbers replace the interim 58/8 count above; these are **committed source edits, not claims of fully verified parity**.

All converted JSX files were re-fetched and text-inspected for shared-component imports, exact opening/closing tag pairs and stray quotes. No app execution, CI, lint, test, screenshot comparison, codemod application or complete `grep` was performed in this turn. The codemod remains ready for the orchestrator's reviewed local application. `clone-states-work-queue.md` now annotates all 62+24 changed route files without ticking anything. The unmodified route-state inventory contains 1,041 unique paths, of which 996 are authenticated route-state files as of the recorded source-tree census.

- [ ] F3 **OPEN:** warning/info/success/error token visual-value and interaction parity, remaining hand-rolled notices, mobile 767px comparison.
- [ ] F4 **OPEN:** run the codemod across remaining pulse-only loading routes, verify skipped judgement cases, spinner/motion and mobile values.
- [ ] F5 **OPEN:** enumerate remaining custom error/empty/403/404/500/session/maintenance/offline components and verify behaviour and visual responsiveness.

**Next exact source file:** `src/app/(authenticated)/tpo/reports/offers-expiry/error.tsx` — source currently contains a role=alert section with separate background/border/padding; convert to shared error feedback without changing the watchlist warning or Retry.


## TPO report error batch — 2026-10-19

**10 source files changed and individually re-read:** eight TPO report error routes now use `Alert tone="error"` instead of one-off `role="alert"` sections; two existing `ErrorState` routes have literal escaped line breaks removed from titles/descriptions. All ten preserve their report-specific warning and the `reset` callback. Work remains on whole-repo F3–F5 parity; this is **file-level source proof, not browser/runtime visual proof**.

### Cross-file legacy-to-vNext value table

| Property/state | Exact legacy source/value | Shared or route-level source/value | Result |
| --- | --- | --- | --- |
| Error semantic color | `docs/design/legacy-styles/components___variables.scss:71` — `#ef4444` | `src/app/globals.css:51` — `--lms-error: #ef4444`; shared `Alert` error tone in `src/components/ui/alert.tsx:11` | Canonical status hue equal |
| Error background | `legacy-styles/components___variables.scss:72` — `rgba(239,68,68,.10)` | `globals.css:52` same, used by `alert.tsx:11` as `--lms-error-subtle`; `ErrorState` via `globals.css:597` | Canonical effective background source equal |
| Heading family/color | `docs/design/old-lms-pages.md:7` — h1 around 30px / 600 / `#172033` | `src/app/globals.css:327` — `--lms-heading:#172033`; eight route `h1` use `text-[30px] font-semibold` and token color | Known title values equal; two existing ErrorState h2 semantics unchanged |
| Body text color | `legacy-styles/components___variables.scss:25` — `#54505d` | `globals.css:35,73` — `#54505d` via `--lms-body-text`; each route description uses body token | Equal color |
| Error container border | Legacy status color in `variables.scss:71` but no exact legacy alert border alpha in examined references | `src/components/ui/alert.tsx:11` — `rgba(239,68,68,.25)`; existing `ErrorState` from `globals.css:597` | **Not yet exact legacy alpha proof; strict category still open** |
| Component radii / padding | Legacy canvas 12px radius + 24px desktop padding per `old-lms-pages.md:6`; not a specific error-alert component rule | `alert.tsx:17` uses `--lms-control-radius` (9px) and `--lms-space-4/3` (16px/12px); single containing page canvas retained | Inner alert is a notice rather than duplicate canvas; exact old alert geometry not proven |
| Recovery control | Legacy page anatomy `old-lms-pages.md:7` calls for an outlined action on a notice | Shared `Button variant="secondary"` on each route; no raw button; each invokes `reset` exactly once | Source-level action parity; hover/focus values inherited from shared Button |
| 767px phone/tablet behavior | `legacy-styles/components___antddesign.scss:21-23` uses a maximum-width 767px breakpoint for mobile layout | `Alert` has `min-w-0 max-w-full flex-col break-words`; changed routes have `w-full`, `text-balance break-words`, `flex-wrap` around actions; existing ErrorState likewise is fluid | **Source-level no fixed-width overflow; browser measurement at phone/tablet not performed** |

### Per-file source grep and responsive checks

Counts below were **computed by exact regex matches on the fetched GitHub file content** on the lane branch. They are equivalent to the indicated single-file grep checks, not whole-repo grep results. `A` is `<Alert`, `C` is `</Alert>`, `E` is `<ErrorState`, `R` is `onClick={reset}`, `S` is raw `<section`, `P` is `animate-pulse`, and `N` is literal backslash-n. Responsive proof is source-only (column `Phone/tablet source`).

| File (`src/app/(authenticated)/tpo/reports/…`) | Changed title line | Changed description line | A/C/E/R/S/P/N | Phone/tablet source |
| --- | ---: | ---: | --- | --- |
| `offers-expiry/error.tsx` | 11 | 14 | 1/1/0/1/0/0/0 | w-full + Alert min-w-0/max-w-full, break-words, flex-wrap |
| `placed-branch/error.tsx` | 11 | 14 | 1/1/0/1/0/0/0 | w-full + Alert min-w-0/max-w-full, break-words, flex-wrap |
| `joining-status/error.tsx` | 11 | 14 | 1/1/0/1/0/0/0 | w-full + Alert min-w-0/max-w-full, break-words, flex-wrap |
| `season-pipeline/error.tsx` | 11 | 14 | 1/1/0/1/0/0/0 | w-full + Alert min-w-0/max-w-full, break-words, flex-wrap |
| `offers-acceptance/error.tsx` | 11 | 14 | 1/1/0/1/0/0/0 | w-full + Alert min-w-0/max-w-full, break-words, flex-wrap |
| `placement-summary/error.tsx` | 11 | 14 | 1/1/0/1/0/0/0 | w-full + Alert min-w-0/max-w-full, break-words, flex-wrap |
| `leads/error.tsx` | 11 | 14 | 1/1/0/1/0/0/0 | w-full + Alert min-w-0/max-w-full, break-words, flex-wrap |
| `unplaced/error.tsx` | 11 | 14 | 1/1/0/1/0/0/0 | w-full + Alert min-w-0/max-w-full, break-words, flex-wrap |
| `by-company/error.tsx` | 8 | 9 | 0/0/1/1/0/0/0 | ErrorState min-w-0, break-words, flex-wrap |
| `by-branch/error.tsx` | 8 | 9 | 0/0/1/1/0/0/0 | ErrorState min-w-0, break-words, flex-wrap |

Equivalent checks on a locally available checkout (the **counts above were established from remote bytes**, not from running these commands):

```sh
rg -n '<Alert|</Alert>|<ErrorState|onClick=\{reset\}|<section|animate-pulse|\\n' 'src/app/(authenticated)/tpo/reports/'{offers-expiry,placed-branch,joining-status,season-pipeline,offers-acceptance,placement-summary,leads,unplaced,by-company,by-branch}/error.tsx
rg -n 'w-full|break-words|flex-wrap' 'src/app/(authenticated)/tpo/reports/'{offers-expiry,placed-branch,joining-status,season-pipeline,offers-acceptance,placement-summary,leads,unplaced}/error.tsx
```

- [x] **Source migration done — 10 report error files**, source grep counts verified, original message/retry preserved, responsive *source* containment checked.
- [ ] **Strict F3/F5 visual-parity tick deferred:** full old error-container spacing/border proof, real 320px/767px browser comparison, and whole-repository zero-instance census are not complete. Do not equate the source checklist with full visual parity.

**Next source file:** `src/app/(authenticated)/tpo/reports/ctc/error.tsx` — inspect existing fallback before changing anything; keep report-specific copy and the retry action.


## Replacement lane bounded turn — 2026-10-19 (branch-only source work)

**Synchronization:** `chatgpt/chat-5-b` had zero commits ahead and 1,565 behind `main`. Fast-forwarded that branch (without force and without writing `main`) from `323be5784b0f40732bec3c76fe431753d338a526` to `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0` using an expected-head lease, then made source edits. No local git checkout, application execution, tests, lint, TypeScript check, CI or browser screenshots were run. File-content searches below were conducted using GitHub code search on `main` and explicit GitHub file reads on the lane branch; **these are not whole-repository grep results**.

### Changed-file source checks

| Group | Source files changed | Fetched-source check after changes | Responsive source proof and limitations |
| --- | ---: | --- | --- |
| TPO report/placements `error.tsx` line-break repairs | 6: `reports/{ctc,accreditation,failure-reasons,branch-season}/error.tsx`, `reports/error.tsx`, `placements/error.tsx` | 6/6 re-fetched; literal `\\n` occurrence count **0**; 6/6 retain `onClick={reset}`, `ErrorState`, and report-specific failure copy | Existing shared ErrorState is fluid via `min-w-0`, `break-words`; actual 320px/767px screenshots missing |
| TPO job error fallback panels | 5: `jobs/[jobId]/{edit,letters,closeout,candidate-schedule}/error.tsx` and `jobs/[jobId]/offers/[offerId]/error.tsx` | 5 matching `<Alert tone="error">` and **5** matching `</Alert>`; original recovery actions present 5/5; raw `<button` on offer error now **0**; bespoke `<section role="alert"` now **0** in these five | Shared Alert: `min-w-0 max-w-full flex-col break-words`; retry remains reachable and edits retain their existing links; visual/tablet comparison still missing |
| TPO round-result table | 1: `jobs/[jobId]/rounds/[roundId]/results/page.tsx` | 3 `<Alert` / 3 `</Alert>`, 1 `<EmptyState`; invalid-filter clear link, capped result notices, status totals and filter form retained | Shared Alert/EmptyState use fluid widths; no screenshot yet |
| TPO loading placeholders | 10: `reports/{by-branch,by-company}`, `settings/{rules,season,team,branding,recruiters}`, `students/requests`, `announcements`, `team/[threadId]`, each `loading.tsx` | 10/10 re-fetched; literal `animate-pulse` **0**; each uses `Skeleton` with preserved placeholder heights and original grid breakpoint classes where present; existing accessible loading labels retained or provided | Original loader dimensions preserved in CSS px by optional shared Skeleton `height`/`width` (new API); original `sm:grid-cols-2`, `lg:grid-cols-5`, `xl:grid-cols-5` breakpoints retained on grid routes. **Not** a browser proof of legacy spinner shape or computed shimmer |
| More TPO placement empty/capped notices | 4: `jobs/[jobId]/{shortlist,about,interview-slots}/page.tsx`, `schedule-conflicts/page.tsx` | Shared EmptyState counts **1/2/1/1 = 5**; two of these pages also use paired warning Alerts (**2** openings / **2** closings); original wording retained | EmptyState uses `min-w-0`, text wrap and `sm:` padding; shortlists and tables still use existing DataTable empty props. No computed mobile layout measurement |

Shared component changes: `src/components/ui/skeleton.tsx` now accepts optional numeric `height` and `width` and passes them only to the inner placeholder as inline CSS pixel lengths, preserving the default variant dimensions for every existing caller. `src/components/ui/empty-state.tsx` now permits absent `description`; existing nonempty descriptions still render unchanged, and title-only empty states no longer render blank paragraphs. Both files were re-fetched after update.

**Exact scoped source counts:** On the ten changed loading files, matching `animate-pulse` occurrences = **0** and `<Skeleton` occurrences = **32** (per-source JSX occurrences, not rendered blocks; five-item arrays render more). On the five changed error panels, `<Alert` count = **5**, `</Alert>` count = **5**, and raw `<section role="alert"` count = **0**. On the six repaired error sources, literal backslash-n = **0**. On the round-results page `<Alert`/closing = **3/3**. These are **fetched-file equivalent counts**, not executions of `grep` or `rg`.

Suggested reproducible local commands, **not executed here**:
```sh
git ls-tree -r --name-only chatgpt/chat-5-b src/app | grep -E '(^|/)(loading|error|not-found)\.tsx$' | sort
rg -l 'animate-pulse|bg-muted|bg-surface-secondary' src/app -g loading.tsx | sort
rg -l '<(section|div|p)[^>]*role="(status|alert)"' src/app src/components -g '*.tsx' | sort
rg -l '<(Banner|Alert|EmptyState|ErrorState|Skeleton|GracefulPageLoading)\b' src/app -g '*.tsx' | sort
```

### Legacy values versus component source (STRICT TICK RULE: mixed matches, **category ticks still open**)

| F item / property | Exact legacy reference | vNext source value | Evidence / result |
| --- | --- | --- | --- |
| F3 error tone foreground | `docs/design/legacy-styles/components___variables.scss:71` — `#ef4444` | `src/app/globals.css:51` — `--lms-error: #ef4444`; `src/components/ui/alert.tsx:11` uses error token | Semantic hue equal; inherited text shade remains to verify |
| F3 error background | `legacy-styles/components___variables.scss:72` — `rgba(239,68,68,0.10)` | `globals.css:52`; `alert.tsx:11` references `--lms-error-subtle` | Canonical fill token equal |
| F3 error border | Legacy precise alert border opacity not identified in scanned source | `alert.tsx:11` — `rgba(239,68,68,0.25)` | **OPEN** — no equality proof |
| F3 info-strip anatomy | `docs/design/old-lms-pages.md:7` — slim pale-yellow strip, info dot, outlined action | `src/components/ui/banner.tsx:15-19` — default warning, 6px dot, optional action region, vertical padding 10px | **OPEN** — exact SCSS geometry and action hover/focus still unproved |
| F4 neutral loading fill | `legacy-styles/components___variables.scss:31` — `#f1f4f9` | `src/components/ui/skeleton.tsx:23` uses `--lms-neutral-100` with matching source token in `globals.css` | Token equal; animation timing and dotted-spinner parity **OPEN** |
| F4 placeholder dimensions | No matching legacy loader dimensions proven for each TPO page | Ten route loaders use `Skeleton height={...}` and optional width; original *vNext bespoke* placeholder dimensions carried over | Source geometry preserved; **not** equality with old-LMS screenshot |
| F5 empty/error responsiveness | `legacy-styles/components___common.scss:20-24`: mobile `max-width:767px`; `legacy-styles/components___accessibility.scss:11-20`: 2px keyboard focus, offset 3px | `src/components/ui/empty-state.tsx:6-9` wraps, `sm:` padding; `alert.tsx:17` max-width-full; buttons inherit focus via shared Button | Fluid mobile source, no fixed overflow in converted wrappers; **OPEN** actual 320px, 767px, tablet and focus-offset measured parity |

### Strict checklist and grep-derived Work queue

- [ ] **F3 Alerts/Banners and inline notices** (missing: exact border and radius/tone tables across hover/focus/disabled, whole-repo bespoke-state grep counts, 320px/767px/tablet browser proof). Existing `inline-notice.tsx` still uses its own raw dismissal button; review with the forms/buttons lane before touching global Button.
- [ ] **F4 Loading/skeleton/spinner** (missing: all 511 loading routes rechecked against current tree, repository-wide zero bespoke loaders, legacy dotted spinner animation values and browser proof).
- [ ] **F5 Empty/error and exceptional states** (missing: all 512 error/18 not-found routes recounted after moving main, 403/404/500/maintenance/session/offline matrix, full project status-panel and empty-state grep proof, visual breakpoint proof).

**Next unticked from GitHub source-search for bespoke TPO placement feedback:** `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx` (invalid filter `<p role="alert">` and a Suspense grid `<p role="status">`; preserve the `PageHeader`, the Clear applicant filters link, and all grid/data semantics). Other known candidates after that: `jobs/[jobId]/share-audit/page.tsx`, `jobs/[jobId]/rounds/[roundId]/slots/page.tsx`, `jobs/[jobId]/about/page.tsx` activity fallback, and all public maintenance/offline/session pages. Github code search on main showed `animate-pulse` in ten migrated TPO loading files plus the non-loader `tpo/batches/[batchId]/page.tsx` `target:animate-pulse` (the latter is an interaction style, not a loading placeholder; exempt pending separate animation audit). The complete `src` count is **unknown**, never zero by assumption.

## Replacement lane follow-up — 16 TPO placements pages (19 October 2026)

All 16 source files below were independently re-fetched from chatgpt/chat-5-b after their write. These are source-byte regex counts, NOT locally executed grep output, TypeScript parsing, rendered screenshots or responsive browser observations. No code execution, tests, lint or CI.

| Source file (relative to src/app/(authenticated)/tpo/placements/) | Alert opens/closes | Banner opens/closes | EmptyState | Skeleton | Bespoke styled notice | All raw role=status/alert | First shared component line | Responsive source tokens |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| jobs/[jobId]/applicants-pipeline/page.tsx | 1/1 | 0/0 | 1 | 1 | 0 | 1 | 29 | md:min-h-9, sm:grid-cols-4, flex-wrap |
| jobs/[jobId]/share-audit/page.tsx | 2/2 | 0/0 | 1 | 0 | 0 | 0 | 29 | min-w-0, md:min-h-9, flex-wrap |
| jobs/[jobId]/rounds/[roundId]/slots/page.tsx | 2/2 | 0/0 | 0 | 0 | 0 | 0 | 23 | min-w-0, md:min-h-9 |
| jobs/[jobId]/cancel-preview/page.tsx | 1/1 | 0/0 | 0 | 0 | 0 | 0 | 39 | min-w-0, md:min-h-9 |
| jobs/[jobId]/close-preview/page.tsx | 1/1 | 0/0 | 0 | 0 | 0 | 0 | 24 | min-w-0, md:min-h-9 |
| jobs/[jobId]/closeout/page.tsx | 1/1 | 0/0 | 0 | 0 | 0 | 0 | 52 | min-w-0, md:min-h-9, sm:grid-cols-2, xl:grid-cols-4 |
| jobs/[jobId]/edit/page.tsx | 1/1 | 0/0 | 0 | 0 | 0 | 0 | 22 | min-w-0, md:min-h-9 |
| jobs/[jobId]/share-preview/page.tsx | 1/1 | 0/0 | 1 | 0 | 0 | 0 | 89 | min-w-0, md:min-h-9, flex-wrap |
| jobs/[jobId]/about/page.tsx | 0/0 | 0/0 | 3 | 0 | 0 | 0 | 51 | flex-wrap, sm:grid-cols-2, lg:grid-cols-3, md:min-h-9 |
| jobs/[jobId]/candidate-schedule/page.tsx | 1/1 | 1/1 | 4 | 0 | 0 | 0 | 47 | min-w-0, md:min-h-9, flex-wrap |
| jobs/[jobId]/joining/page.tsx | 1/1 | 0/0 | 0 | 0 | 0 | 0 | 61 | min-w-0, md:min-h-9, sm:grid-cols-2, xl:grid-cols-5 |
| jobs/[jobId]/offers/page.tsx | 0/0 | 1/1 | 1 | 0 | 0 | 1 | 48 | min-w-0, md:min-h-9, flex-wrap, sm:grid-cols-3 |
| recorded-outside/page.tsx | 0/0 | 1/1 | 1 | 0 | 0 | 0 | 28 | min-w-0, md:min-h-9, flex-wrap |
| jobs/[jobId]/selections/page.tsx | 2/2 | 0/0 | 0 | 0 | 0 | 0 | 28 | min-w-0, flex-wrap, md:min-h-9 |
| jobs/[jobId]/applications-export/page.tsx | 0/0 | 1/1 | 1 | 0 | 0 | 0 | 67 | min-w-0, md:min-h-9, flex-wrap, sm:grid-cols-4 |
| jobs/[jobId]/discussion/page.tsx | 1/1 | 0/0 | 1 | 0 | 0 | 1 | 22 | min-w-0, md:min-h-9 |

Scoped proof: Alert openings/closings = 15/15; Banner openings/closings = 4/4; EmptyState = 14; Skeleton = 1; bespoke styled notices = 0; raw status/alert elements = 3 (all unstyled live counters); raw button tags = 0; animate-pulse instances = 0. Counts are over these 16 files only. Every edited component opening and closing pair matches. No claim is made of a zero whole-repository grep.

Reproducible checkout commands (NOT executed here):
```sh
rg -n '<(Alert|Banner|EmptyState|Skeleton)([ >])|</(Alert|Banner)>' 'src/app/(authenticated)/tpo/placements' -g page.tsx
rg -n '<(p|div|section|aside)[^>]*role="(status|alert)"[^>]*(rounded|border|bg-|px-|py-)' 'src/app/(authenticated)/tpo/placements' -g page.tsx
rg -n '<button([ >])|animate-pulse' 'src/app/(authenticated)/tpo/placements' -g page.tsx
```

### Legacy value table (reference location on both sides)

| State/property | Old LMS source and exact value | vNext source and exact value | Proof status |
| --- | --- | --- | --- |
| Error background | docs/design/legacy-styles/components___variables.scss:71-72 — #ef4444 and rgba(239,68,68,.10) | src/app/globals.css:51-52 — same tokens; src/components/ui/alert.tsx:13 uses error-subtle | Palette token MATCH, border alpha and text color OPEN |
| Warning background | legacy-styles/components___variables.scss:69-70 — #d97706 and rgba(217,119,6,.10) | globals.css:49-50 same tokens; alert.tsx:12 and banner.tsx:12 use separate warning surface | Warning token MATCH; exact notice surface OPEN |
| Info background | legacy-styles/components___variables.scss:73-74 — #26bac7 and #eff8fa | globals.css:56-57 and alert.tsx:10 / banner.tsx:10 — same info/subtle tokens | Palette token MATCH, border OPEN |
| Success background | legacy-styles/components___variables.scss:67-68 — #059669 and rgba(5,150,105,.10) | globals.css:47-48 and banner.tsx:11 — same tokens | Palette token MATCH, border OPEN |
| Body text | legacy-styles/components___variables.scss:25 — #54505d | globals.css:35,73 — #54505d; alert and banner have semantic tone text instead of body | Generic body MATCH; tone text OPEN |
| Spacing scale | legacy-styles/components___variables.scss:116-123 — 4, 8, 12, 16, 24, 32, 40, 48px | globals.css:349-355 — 4, 8, 12, 16, 24, 32px; Alert:18 px-4, py-3 | Shared tokens MATCH where compared; complete component geometry OPEN |
| Legacy notice anatomy | docs/design/old-lms-pages.md:12 — pale yellow slim strip, info dot, outlined action | src/components/ui/banner.tsx:17-22 — 6px dot, vertical 10px padding, flexible action | General structure present; exact border, radius, dot, hover values OPEN |
| Empty and error layout | docs/design/old-lms-pages.md:6 — white canvas radius 12px, border #e5e9f0, 24px padding | EmptyState.tsx:6-10 — inner transparent no-card section; Alert.tsx:17-21 — border, 16px/12px padding; global canvas remains | No nested canvas; exact empty/notice geometry OPEN |
| Responsive behavior | legacy-styles/components___variables.scss:148-150 — breakpoints 767/991/1024px; components___antddesign.scss:21-23 — <=767px | Alert.tsx:18 flex min-w-0 max-w-full; Banner.tsx:19 flex-wrap; EmptyState.tsx:6-9 word-wrap, Tailwind sm: begins 640px; DataTable.tsx:36 mobile priorities | Source fluidity verified; 640-767px breakpoint discrepancy and 320px/tablet screenshot OPEN |
| Focus/disabled | legacy-styles/components___accessibility.scss:19-23 — outline 2px, offset 3px, teal #1a95a1 | src/components/ui/button.tsx:28-29 — focus offset 2px, lms-primary and disabled states; route Link style preserved | Known focus-offset discrepancy; strict tick OPEN |
| Empty status semantics | 16 legacy-style bespoke elements included role=status notices | src/components/ui/empty-state.tsx:6 — role=status aria-live=polite; changed routes carry title/recovery actions | Source semantics restored, live-region runtime behavior unverified |

All 16 changed pages retain original copy, conditionals, permissions, links, filter reset, paging, and data counts. Applicant-grid Suspense preserves the deferred table with a labeled shared Skeleton fallback. Unstyled status counters on applicants-pipeline, offers and discussion are deliberate exemptions from decorative notice migration.

### Strict tick rule
- [ ] F3 alerts/banners/inline notices (missing: effective exact geometry/tone/focus/hover value table; whole-repo grep; browser phone 320px, 767px, tablet).
- [ ] F4 loading/skeleton/spinner (missing: complete route inventory and animation equivalence; full grep; browser proof).
- [ ] F5 empty/error/system states (missing: entire 403/404/500/offline/session/maintenance inventory, full grep, responsive browser proof).

Next exact file: src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/page.tsx — two capped-result notices. Then src/app/(authenticated)/tpo/placements/lifecycle/page.tsx — recruiter-access-ended notice.
