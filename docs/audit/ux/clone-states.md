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


## Chat-5 continuation: next 36 TPO state/component sources (2026-10-19)

**Branch baseline and output.** Fast-forwarded the lane to its then-current `main` ancestor `68d52934a61acdeeda3b4c68804550b86607a5ea` (no rewrite, no changes to `main`). Edited 36 **distinct** TPO placement route/component TSX source files, each through a branch-only `[chat-5]` update. All 36 changed sources were independently re-fetched from the lane and scanned with anchored, text-level regexes. This is not execution of TypeScript, app code, tests, lint, CI, browser screenshots, or checkout-local `rg`.

### Per-source grep-equivalent proof

The following counts came from re-fetched `chatgpt/chat-5-b` file bytes. Alert and Banner counts show **open / close**. Raw includes deliberately retained unstyled `role="status"` announcements on live counters and structured result lists; Styled is raw status regions containing their own border/bg/padding. Path source prefix is exact. All 36 Alert pairs matched. No new skeletal loader was introduced in this turn.

| Re-fetched modified source | Alert open/close | Banner open/close | EmptyState | InlineNotice | Remaining raw status/alert | Styled raw |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/page.tsx` | 2/2 | 0/0 | 2 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx` | 1/1 | 0/0 | 0 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/page.tsx` | 0/0 | 0/0 | 1 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/page.tsx` | 1/1 | 0/0 | 0 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx` | 1/1 | 0/0 | 1 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx` | 0/0 | 0/0 | 1 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx` | 2/2 | 0/0 | 0 | 3 | 0 | 0 |
| `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx` | 1/1 | 0/0 | 3 | 0 | 2 | 0 |
| `src/components/placements/tpo-applicant-review-form.tsx` | 0/0 | 0/0 | 0 | 2 | 0 | 0 |
| `src/components/placements/tpo-bulk-drive-reminder.tsx` | 0/0 | 0/0 | 0 | 2 | 0 | 0 |
| `src/components/placements/tpo-company-feedback-form.tsx` | 0/0 | 0/0 | 0 | 2 | 0 | 0 |
| `src/components/placements/tpo-company-interaction-form.tsx` | 0/0 | 0/0 | 0 | 2 | 0 | 0 |
| `src/components/placements/tpo-drive-cancel-form.tsx` | 0/0 | 0/0 | 0 | 1 | 0 | 0 |
| `src/components/placements/tpo-drive-change-requests.tsx` | 1/1 | 0/0 | 1 | 3 | 0 | 0 |
| `src/components/placements/tpo-drive-clone-action.tsx` | 0/0 | 0/0 | 0 | 1 | 0 | 0 |
| `src/components/placements/tpo-drive-close-preview-form.tsx` | 0/0 | 0/0 | 0 | 1 | 0 | 0 |
| `src/components/placements/tpo-drive-deadline-form.tsx` | 0/0 | 0/0 | 0 | 1 | 0 | 0 |
| `src/components/placements/tpo-drive-edit-form.tsx` | 0/0 | 0/0 | 0 | 1 | 0 | 0 |
| `src/components/placements/tpo-drive-saved-views.tsx` | 0/0 | 0/0 | 1 | 2 | 0 | 0 |
| `src/components/placements/tpo-drive-selection-manager.tsx` | 1/1 | 0/0 | 1 | 3 | 1 | 1 |
| `src/components/placements/tpo-general-requests-panel.tsx` | 0/0 | 0/0 | 1 | 3 | 0 | 0 |
| `src/components/placements/tpo-interview-slot-planner.tsx` | 0/0 | 0/0 | 1 | 3 | 1 | 0 |
| `src/components/placements/tpo-joining-update-form.tsx` | 0/0 | 0/0 | 0 | 1 | 0 | 0 |
| `src/components/placements/tpo-remind-non-applicants.tsx` | 0/0 | 0/0 | 0 | 5 | 0 | 0 |
| `src/components/placements/tpo-report-invalid-filters.tsx` | 1/1 | 0/0 | 0 | 0 | 0 | 0 |
| `src/components/placements/tpo-request-bulk-decision.tsx` | 1/1 | 0/0 | 0 | 2 | 2 | 0 |
| `src/components/placements/tpo-request-decision-control.tsx` | 0/0 | 0/0 | 0 | 2 | 0 | 0 |
| `src/components/placements/tpo-round-apply-control.tsx` | 1/1 | 0/0 | 0 | 1 | 1 | 0 |
| `src/components/placements/tpo-round-calendar-control.tsx` | 2/2 | 0/0 | 1 | 1 | 0 | 0 |
| `src/components/placements/tpo-round-check-in.tsx` | 0/0 | 0/0 | 0 | 1 | 0 | 0 |
| `src/components/placements/tpo-round-reorder.tsx` | 0/0 | 0/0 | 0 | 4 | 0 | 0 |
| `src/components/placements/tpo-round-result-entry-form.tsx` | 0/0 | 0/0 | 0 | 2 | 0 | 0 |
| `src/components/placements/tpo-round-results-import.tsx` | 0/0 | 0/0 | 4 | 1 | 2 | 1 |
| `src/components/placements/tpo-selection-import.tsx` | 0/0 | 0/0 | 2 | 2 | 1 | 0 |
| `src/components/placements/tpo-trust-toggle.tsx` | 0/0 | 0/0 | 0 | 2 | 0 | 0 |
| `src/components/placements/tpo-waitlist-promotion-control.tsx` | 1/1 | 0/0 | 1 | 2 | 0 | 0 |
| **Scoped total** | **16/16** | **0/0** | **21** | **56** | **10** | **2** |

**Intentional exemptions from notice-component conversion:** the two styled raw `role="status"` containers are `src/components/placements/tpo-drive-selection-manager.tsx` and `src/components/placements/tpo-round-results-import.tsx`, both bounded/scrollable **itemized operation-result regions** rather than inline banners. The other raw status regions are unstyled live counts, selection totals, and import/result announcements. These are not claims of zero remaining hand-rolled states across the application. No `src/components/ui/*` files were modified in this continuation; the shared primitives retain their existing APIs. `tpo-round-reorder.tsx` had a duplicate `Button` import removed while updating the source.

Commands for local verification (NOT EXECUTED here):
```sh
git ls-tree -r --name-only chatgpt/chat-5-b src/app | grep -E '(^|/)(loading|error|not-found)\.tsx$' | sort
rg -n 'role="(alert|status)"|<Alert|</Alert>|<Banner|</Banner>|<InlineNotice|<EmptyState' src/app src/components -g '*.tsx'
rg -n '<(p|div|span|section)[^>]*role="(alert|status)"[^>]*(rounded|border|bg-|p-[0-9]|px-|py-)' src/app src/components -g '*.tsx'
rg -n 'animate-pulse|bg-muted|bg-surface-secondary' src/app -g 'loading.tsx'
```
This is *source-file grep proof only*, not whole-repo command output. The main-branch GitHub source index is asynchronous and cannot establish a zero remaining instance count for the lane.

### Legacy / vNext value comparison, exact source lines

| Element property / state | Legacy exact value/source | vNext exact source/value | Verdict |
| --- | --- | --- | --- |
| Success hue and subtle fill | `docs/design/legacy-styles/components___variables.scss:67-68`: `#059669`, `rgba(5,150,105,.10)` | `src/app/globals.css:47-48`: same values; `src/components/ui/inline-notice.tsx:10` uses token fill | **MATCH** color tokens; 0.25 border opacity not sourced as exact old property |
| Warning hue/fill | `components___variables.scss:69-70`: `#d97706`, `rgba(217,119,6,.10)` | `globals.css:49-50` same; `src/components/ui/alert.tsx:12` uses `--lms-warning-surface` (actual `globals.css:1077` = `#fef6e7`) | **MISMATCH / missing source equivalence** for rendered warning fill |
| Error hue/fill | `components___variables.scss:71-72`: `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51-52` same; `alert.tsx:13`, `inline-notice.tsx:9` use fill token and `rgba(239,68,68,.25)` border | **MATCH** base fill and hue; **OPEN** border opacity and tone text |
| Info hue/fill | `components___variables.scss:73-74`: `#26bac7`, `#eff8fa` | `globals.css:56-57` same; `alert.tsx:10`, `inline-notice.tsx:11` use `--lms-primary-subtle` | **MATCH** base palette; border exact old value **OPEN** |
| Default notice geometry | `docs/design/old-lms-pages.md:12`: visually slim yellow strip with dot and outlined action; no authoritative per-element px rule on this source line | `src/components/ui/banner.tsx:17-22`: 6px dot, 10px vertical padding, flex-wrap and optional action; `alert.tsx:18`: 16px horizontal / 12px vertical, `--lms-control-radius` | **OPEN** exact match, especially radius and original outlined-action metrics |
| Control radius | `components___variables.scss:133`: `6px` | `globals.css:343`: `9px` used by `alert.tsx:18`, `inline-notice.tsx:33` | **MISMATCH**; owning foundation/forms lane must reconcile without cross-lane CSS overwrite |
| Spacing 1–6 | `components___variables.scss:116-121`: 4/8/12/16/24/32px | `globals.css:350-355`: same values | **MATCH** first six tokens |
| Spacing 7/8 | `components___variables.scss:122-123`: 40/48px | `globals.css:356-357`: 48/64px | **MISMATCH**, not altered by chat-5 |
| Error vs status live region | Legacy bespoke per-route markup varied; `components___accessibility.scss:19-23` keyboard ring 2px, 3px offset | `src/components/ui/inline-notice.tsx:32-36` provides role alert/status, assertive/polite announcement, wrapped text, 44px mobile dismiss target | **Source semantic parity** for migrated notices; keyboard-focus ring offset differs; no browser proof |
| Empty-state word wrapping | `docs/design/legacy-styles/components___antddesign.scss:21-23` mobile max-width 767px (drawer example), `old-lms-pages.md:6` one white canvas | `src/components/ui/empty-state.tsx:6-9` transparent interior, `min-w-0`, `break-words`, `[overflow-wrap:anywhere]`, phone 16px padding, `sm:` (640px) 24px padding | **Overflow-conscious source**, but **OPEN** 640–767px breakpoint mismatch and actual 320px/767px/991px rendering |
| Hover/focus/disabled/loading | `components___accessibility.scss:19-23`: 2px outline, 3px offset; `components___variables.scss:139`: 44px touch target | `inline-notice.tsx:35-36`: dismiss focus offset 2px, min-h-11 then `sm:` control height 36px, hover white/50; `Button` callers retain `disabled={pending}`; `Alert` no actions of its own | **OPEN** hover/focus/disabled exact-value proof and rendered target sizes. No change to shared Button |
| Loading and reduced motion | Legacy page observation `old-lms-pages.md:26`: dotted compile spinner in dev, not a page spec | `src/components/ui/skeleton.tsx:21-30`: shimmer with `motion-reduce:animate-none`; this continuation migrated error/empty/inline, not route loaders | **OPEN** dotted-spinner comparison; no F4 strict tick |

### Responsive / no-regression proof (static, bounded)

All updated feedback mounts only shared `Alert` / `InlineNotice` / `EmptyState` in place of visual one-off markup. `Alert` has `min-w-0 max-w-full flex-col break-words` (`alert.tsx:18`); `InlineNotice` has `min-w-0` and a wrapping `flex-1 break-words` message (`inline-notice.tsx:32-34`); `EmptyState` uses word wrapping and phone/tablet padding (`empty-state.tsx:6-9`). Existing TPO grids retain `sm:grid-cols-2/3`, `md:min-h-9`, wrapping action rows and scrolling result lists. Per-route conditions (data truncation, absent result/offer, storage migration gate, invalid date, audited cancellation, offer/selection release, role permission) and original recovery/confirmation functions remained unchanged. Converted JSX opening/closing names re-read and balanced for Alert/Banner/Button. These are **static source-level phone/tablet overflow checks, not viewport screenshots or pixel parity**. In particular the Tailwind 640px breakpoint and old 767px distinction is not resolved by this turn.

- [ ] **F3 alerts/banners/inline** (missing exact old padding, radius, color and focus/hover state equivalence; whole-repo grep; browser 320px/767px/tablet proofs).
- [ ] **F4 loading** (missing all-route loading census, component animation timing and reduced-motion proof, live screenshot).
- [ ] **F5 empty/error/system states** (missing whole-repo census including 403/404/500/maintenance/offline/session, responsive browser proofs and visual parity).

**Next exact source:** `src/components/placements/tpo-sequential-request-review.tsx` (unreviewed response/error statuses); after that `src/components/placements/tpo-recruiter-grant-controls.tsx`. Do not tick entire F3–F5 or route inventory just because the source component was updated.


### Next 12 TPO state sources after the 36-file table — 2026-10-19

This continuation extends the same chat-5 lane source-migration evidence to twelve more distinct `src/components/placements/tpo-*.tsx` files. All twelve were fetched from the written lane branch and reviewed for Alert/InlineNotice/EmptyState use, role semantics and mobile source tokens. No `src/components/ui/*` changes, build, tests, CI, runtime or screenshots.

| Updated source file | Alert pairs | EmptyState | InlineNotice | Remaining raw status | Styled raw | Source line(s) | Responsive/exemption check |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `src/components/placements/tpo-sequential-request-review.tsx` | 0/0 | 0 | 2 | 1 | 0 | 53,57 | status-counter kept; shared notices wrap |
| `src/components/placements/tpo-public-placement-toggle.tsx` | 0/0 | 0 | 1 | 0 | 0 | 41 | original button unchanged |
| `src/components/placements/tpo-company-lifecycle-editor.tsx` | 0/0 | 0 | 3 | 0 | 0 | 107-109 | existing action wrap intact |
| `src/components/placements/tpo-round-result-recorder.tsx` | 0/0 | 0 | 1 | 0 | 0 | 232 | result form unchanged |
| `src/components/placements/tpo-request-page-clipboard.tsx` | 0/0 | 1 | 1 | 1 | 0 | 98,129 | mobile table selection unchanged |
| `src/components/placements/tpo-recruiter-grant-controls.tsx` | 0/0 | 1 | 9 | 0 | 0 | 50,78-85,120-126,163-169 | sm:grid-cols-3; min-h-11 buttons |
| `src/components/placements/tpo-college-rules-control.tsx` | 0/0 | 0 | 2 | 1 | 1 | 84,114 | policy explanatory section kept as role=status |
| `src/components/placements/tpo-outside-participants-editor.tsx` | 1/1 | 0 | 1 | 0 | 0 | 38,59 | availability gate and flex-wrap preserved |
| `src/components/placements/tpo-company-person-editor.tsx` | 1/1 | 0 | 1 | 0 | 0 | 109,119 | review Button no longer nested inside a paragraph |
| `src/components/placements/tpo-season-controls.tsx` | 1/1 | 0 | 1 | 0 | 0 | 71,102 | sm:grid-cols-2, mobile action wrap |
| `src/components/placements/tpo-public-placement-content-editor.tsx` | 1/1 | 0 | 2 | 0 | 0 | 81-82,86 | 44px touch targets and flex items unchanged |
| `src/components/placements/tpo-drive-act-on-panel.tsx` | 0/0 | 0 | 1 | 1 | 0 | 132 | count/status report retained, feedback shared |
| **Scoped total** | **4/4** | **2** | **25** | **4** | **1** | — | Re-fetched source, not browser proof |

**Incremental source-regex proof:** Alert openings and closings each **4**; `<EmptyState` **2**; `<InlineNotice` **25**; raw `role="status"/"alert"` **4**; one styled retained `role="status"` explanatory policy-summary section (`tpo-college-rules-control.tsx:104`), not an actionable alert. Other raw statuses are per-page counts / sequencing and bulk action summaries with intentionally preserved live reporting. New UI imports are named and matched, with no mismatched `<Alert>`/closing pairs. The parent 36-file table plus this table covers **48** distinct source files in this turn (excluding the two audit files).

**Value and responsive cross-check carried forward:** `docs/design/legacy-styles/components___variables.scss:67-74` semantic status colors match `src/app/globals.css:47-57` for success/warning/error/info base colors. Rendered warning fill still differs (`globals.css:1077` is `#fef6e7` versus SCSS's `rgba(217,119,6,.10)`), control radius is still 9px vs legacy 6px (`globals.css:343` vs `variables.scss:133`), and focus outline offset in `inline-notice.tsx:35-36` is 2px versus legacy 3px (`components___accessibility.scss:19-23`). `Alert.tsx:18` and `InlineNotice.tsx:32-34` ensure `min-w-0` and message breaks, with old responsive selectors at `components___antddesign.scss:21-23` max-width 767px and modern `sm:` 640px requiring side-by-side comparison. All discrepancies remain **OPEN** and were not silently normalized to unverified values.

To reproduce the **scoped** source counts locally (commands NOT run):
```sh
rg -n '<Alert|</Alert>|<InlineNotice|<EmptyState|role="(alert|status)"' src/components/placements/tpo-*.tsx
rg -n 'max-w-full|min-w-0|break-words|flex-wrap|sm:|md:|lg:' src/components/placements/tpo-*.tsx
```
These commands, if run against the entire glob, will include files outside the 48 modified-source scope; the counts above are from fetched individual source files only, not purported whole-repository results.

- [ ] F3 **OPEN** — full legacy property/state match, whole-repo zero hand-rolled count, 320/767/tablet actual visuals.
- [ ] F4 **OPEN** — route loaders, spinner timing and reduced-motion broad proof not completed by this batch.
- [ ] F5 **OPEN** — complete 403/404/500, maintenance, offline, session, error and empty inventory plus responsive checks.

**Next exact file:** `src/components/placements/tpo-report-presentation.tsx` (error/status fallbacks), followed by `src/components/placements/tpo-report-record-links.tsx`.


### Report state addendum — 50 source files total, 2026-10-19

Two additional source-level migrations were re-fetched from `chatgpt/chat-5-b` after writing:

| Source file | Shared feedback counts | Raw notices | Mobile source/legacy comparison |
| --- | --- | ---: | --- |
| `src/components/placements/tpo-report-presentation.tsx` | `InlineNotice` 1, `Alert` 0 | 0 | Existing `inline-flex flex-wrap` action row preserved; InlineNotice uses `min-w-0`/wrapping at `src/components/ui/inline-notice.tsx:32-34`. Exact old focus/offset remains unproven |
| `src/components/placements/tpo-report-record-links.tsx` | `Alert` **2 opens / 2 closes**, `EmptyState` 2 | 0 | Existing `md:grid-cols-2` and `break-words` links preserved; shared `Alert` uses `max-w-full`; exact 767px layout comparison open |

Status/truncation semantics were retained: presentation errors still announce without dismissing the view, and 100-row report truncation warnings remain distinct from a true zero-record result. This brings the current **distinct TSX source-file count to 50** (36 + 12 + 2), apart from the two audit documents. This line is a count of files migrated at source level, not a claim that all F3/F4/F5 strict parity items are completed.

**Source grep proof (bounded, fetched-byte):** `<Alert`=2, `</Alert>`=2, `<EmptyState`=2, `<InlineNotice`=1, raw `role="alert"/"status"`=0 for these two files. Local repeatable command, **NOT executed here**:

```sh
rg -n '<Alert|</Alert>|<EmptyState|<InlineNotice|role="(alert|status)"' src/components/placements/tpo-report-{presentation,record-links}.tsx
```

**Value status:** this addendum reuses the full legacy-to-vNext table just above: base info `#26bac7` and error `#ef4444` match the tokens (`legacy-styles/components___variables.scss:71-74`, `globals.css:51-57`); 9px vNext control radius vs legacy 6px remains mismatched (`globals.css:343` vs `variables.scss:133`); 2px vs 3px focus-offset mismatch remains (`inline-notice.tsx:35-36` vs `legacy-styles/components___accessibility.scss:19-23`); exact warning border/surface and mobile breakpoint visual parity remain **OPEN**. No browser, app execution, TS build, tests or CI.

- [ ] F3, F4, F5 strict category proofs remain open; zero whole-repo bespoke instances, final responsive values and actual browser comparisons have not been established.

**Next exact source:** `src/components/placements/tpo-report-saved-filters.tsx` (one remaining raw status announcement on the latest source read), then remaining placement component alerts and finally cross-portal 403/404/500/offline/maintenance/session paths.

- [ ] F3 codemod batch — pattern: simple leaf `<p>`/`<span role="alert">` with string literal or `{error}`/`{message}` and no nested JSX; planned candidate inventory: GitHub index currently returns up to 63 placement component files and 61 TPO app files (stale search, **not** a confirmed match count). Script: `scripts/codemods/chat-5-alerts.cjs`; dry run `node scripts/codemods/chat-5-alerts.cjs --scope=src/components/placements`; apply `node scripts/codemods/chat-5-alerts.cjs --apply`; strict tick blocked until script is actually run locally, parser/typecheck and responsive proofs complete. The codemod deliberately skips result counters, complex JSX, non-string expressions and shared `src/components/ui` elements. No code execution performed by chat-5.


## Chat-5 next feedback batch — source proof after main fast-forward (2026-10-19)

**Sync:** At batch start, `chatgpt/chat-5-b` was 640 commits behind and zero ahead; lane ref was fast-forwarded non-forcibly from `1d44995fdec3b1214063a97f451e9e8a73f758a2` to `36460671b6456b21e3bc67e0944c15053dce4d9c` (`main` at that instant). All writes are branch-only, `[chat-5]` tagged, never direct-to-main. Current main can advance concurrently.

**Shared F3 token parity corrected at source:**
- `src/components/ui/alert.tsx:10,12`: info uses `--lms-info-subtle` (`#eff8fa`), warning uses `--lms-warning-subtle` (`rgba(217,119,6,.1)`). Matching legacy `docs/design/legacy-styles/components___variables.scss:69-70,73-74`, vNext `src/app/globals.css:49-50,56-57`.
- `src/components/ui/banner.tsx:10,12`: identical info/warning fill tokens. Alert/Banner API, content roles, action slots, min-w-0, flex-wrap and child elements unchanged. Rendered warning `#fef6e7` differed from the old status-token background in earlier audits and was changed to the matching legacy status-token alpha fill.
- `src/components/ui/inline-notice.tsx:11`: info surface now `--lms-info-subtle` matching legacy status-info background `#eff8fa`; success/error backgrounds remain the exact legacy token values.
- **Still OPEN:** border opacities `0.25` vs old border source unverified; `--lms-control-radius` 9px vNext vs 6px old control variable (`globals.css:343` vs legacy `components___variables.scss:133`); focus outline offset 2px vs 3px (`inline-notice.tsx:36` vs `components___accessibility.scss:19-23`); banner action hover/focus and 320/767/tablet rendered pixel comparison. Do not mark F3 strictly done.

### Source re-read: next twelve TPO page/component files

The following are actual re-fetched branch TSX texts following each write, scanned for `<Alert` and `</Alert>` pairs, `<InlineNotice`, `<EmptyState`, and `<p|div|span|section role="status|alert"`. File position is the first converted JSX shared-state markup. This is **not** a checked-out `rg` command, TypeScript parser, browser or screenshot measurement.

| Updated file | Alert opens/closes | InlineNotice | EmptyState | Remaining raw status count | First shared JSX line | Mobile/tablet source condition |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `src/components/placements/tpo-report-saved-filters.tsx` | 0/0 | 1 | 0 | 0 | 79 | min-w-0, flex-wrap, md:min-h-9 |
| `src/components/placements/tpo-interview-reschedule-form.tsx` | 0/0 | 1 | 0 | 0 | 54 | sm:col-span-2, md:min-h-9 |
| `src/components/placements/tpo-delete-draft-action.tsx` | 0/0 | 1 | 0 | 0 | 42 | shared InlineNotice min-w-0 / wrapping |
| `src/components/placements/tpo-mark-own-notification-read.tsx` | 0/0 | 1 | 0 | 0 | 30 | shared notice min-w-0, button target preserved |
| `src/components/placements/tpo-drive-refresh-control.tsx` | 0/0 | 1 | 0 | 0 | 20 | flex-wrap row; pending announcement |
| `src/components/placements/tpo-offer-lifecycle-panel.tsx` | 0/0 | 0 | 1 | 0 | 130 | existing scroll list and empty state wrapping |
| `src/components/placements/tpo-week-hour-calendar.tsx` | 2/2 | 2 | 0 | 0 | 200–219 | flex-wrap toolbar; calendar fixed column styles unchanged |
| `src/components/placements/tpo-drive-lifecycle-controls.tsx` | 1/1 | 2 | 0 | 0 | 127,166–167 | shared alert min-w-0; action row untouched |
| `src/components/placements/tpo-round-drive-day-read-only.tsx` | 0/0 | 0 | 1 | 1 | 258 | DataTable empty; mobilePriority columns retained |
| `src/components/placements/tpo-bulk-round-result-recorder.tsx` | 1/1 | 1 | 1 | 1 | 149,238,263 | multi-column result form; role-status result list retained |
| `src/components/placements/tpo-calendar-followup-actions.tsx` | 0/0 | 2 | 0 | 1 | 141,226 | flex-wrap form; lead-search suggestion status exempt |
| `src/app/(authenticated)/tpo/calendar/error.tsx` | 0/0 | 0 | 0 | 0 | 7 | ErrorState shared retry Button, source literal escapes removed |

**Scoped totals for these 12**: 4 Alert openings and 4 closings; 12 InlineNotice; 3 EmptyState; 3 raw status announcement elements, **zero** styled raw status/alert wrappers. Raw exemptions: `tpo-round-drive-day-read-only.tsx` unknown attendance tally, `tpo-bulk-round-result-recorder.tsx` itemized result log with export, `tpo-calendar-followup-actions.tsx` in-label lead-search no-results status. They are data/live announcements, not decorated banners. Do not conflate these with whole-repository zero.

`src/app/(authenticated)/tpo/calendar/error.tsx:7-9` now has human-readable `title` and `description` string attribute copy rather than literal `\\n` escape text from an earlier route migration. Shared `ErrorState` and functional `Retry` callback retained.

### Reproduction / responsive proof boundary

Commands to run on a checkout (**not executed** by this lane):
```sh
rg -n '<(Alert|InlineNotice|EmptyState)\\b|</Alert>|role="(alert|status)"' src/components/placements/tpo-*.tsx
rg -n 'rounded|border|bg-|px-|py-' src/components/placements/tpo-*.tsx
rg -n 'animate-pulse|bg-muted' src/app -g 'loading.tsx'
```
Shared primitives bound the notice width with `min-w-0`, `max-w-full` and break-word wrapping (`alert.tsx:18`, `inline-notice.tsx:33-34`, `empty-state.tsx:6-9`), with existing page `flex-wrap`, `sm:` and `md:` grid/action classes retained. Old mobile max-width is 767px in `docs/design/legacy-styles/components___antddesign.scss:21-23`; modern `sm:` activates at 640px. The source-level overflow path is documented; actual phone/tablet viewport proof is **not** available without running both apps.

- [ ] F3: global remaining instances, all default/hover/active/focus/disabled values and pixel parity open.
- [ ] F4: full loader, dotted spinner (old dev-only), Skeleton height/timing and motion-reduction comparison open.
- [ ] F5: full 403/404/500, maintenance/offline/session-expired/no-data route inventory and browser comparison open.

### Automated batch supplied for next orchestrated execution

`scripts/codemods/chat-5-alerts.cjs` uses TypeScript TSX AST to convert only simple leaf `<p role="alert">` and `<span role="alert">` notices with literal/error-string content (opening and closing tags atomically), inserts the existing shared InlineNotice import, and **skips** nested JSX, counters, spread props and risky source. Preview `node scripts/codemods/chat-5-alerts.cjs`; apply `node scripts/codemods/chat-5-alerts.cjs --apply`. This script is committed but **not executed** here (no compile/tests/CI), so no script-produced files are reported as completed.

**Next exact hand-audit source:** `src/components/placements/tpo-calendar-followup-actions.tsx` already source migrated; next untouched unique state file `src/components/placements/tpo-calendar-followup-actions.tsx` search-suggestion empty wording remains an intentional plain status span. Resume instead at `src/app/(authenticated)/tpo/calendar/rounds/page.tsx` to inspect duplicated bespoke schedule/error notices.


## Chat-5 TPO page-state consolidation — 13 additional pages (2026-10-19)

After the 12-file TPO component batch above, the following 13 entire page TSX files were individually migrated and re-read in `chatgpt/chat-5-b`. All replacements preserve page content, branch conditions, link destinations, form actions, data caps, server-side authorization and result counters. These file-level edits are only F3/F5 **source passes**, not strict pixel parity completion. Every JSX `Alert` opening and closing pair was checked after migration, including in conditional expressions with nested links. No source code, app, tests, TypeScript compile, CI or browser was executed.

| Path below `src/app/(authenticated)/tpo/` | Alert opens/closes | Banner | InlineNotice | EmptyState | Raw role status/alert | Bespoke styled raw | First shared JSX line | Responsive source / preservation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `calendar/export/page.tsx` | 1/1 | 0 | 0 | 1 | 0 | 0 | 60 | sm:min-h-9 export form; shared empty wraps |
| `calendar/page.tsx` | 1/1 | 0 | 0 | 0 | 0 | 0 | 45 | sm:min-h-9 reset link; shared alert max-w-full |
| `follow-ups/page.tsx` | 1/1 | 0 | 0 | 0 | 0 | 0 | 68 | flex-wrap pagination, min-w-0 |
| `drive-day/[roundId]/no-shows/page.tsx` | 2/2 | 0 | 0 | 1 | 0 | 0 | 92 | table mobilePriority primary/secondary unchanged |
| `drive-day/page.tsx` | 4/4 | 0 | 0 | 1 | 1 | 0 | 50 | sm:grid-cols-3, lg:grid-cols-6, action wrap |
| `requests/page.tsx` | 1/1 | 0 | 0 | 1 | 0 | 0 | 56 | min-w-0, action wrap, search reset link |
| `companies/page.tsx` | 2/2 | 0 | 0 | 0 | 1 | 0 | 64 | sm:grid-cols-3, lists retain reachability |
| `notifications/page.tsx` | 3/3 | 0 | 0 | 0 | 1 | 0 | 51 | notification list and older-page action unchanged |
| `verification/page.tsx` | 4/4 | 0 | 0 | 0 | 1 | 0 | 20 | queue pagination wraps; count is deliberately plain |
| `team/page.tsx` | 2/2 | 0 | 0 | 2 | 1 | 0 | 146 | min-[768px] link target and search filters unchanged |
| `announcements/page.tsx` | 7/7 | 0 | 2 | 1 | 2 | 0 | 40 | md:grid-cols-2; scheduled/ended metadata unstyled |
| `batches/page.tsx` | 12/12 | 1 | 6 | 1 | 2 | 0 | 46 | sm:grid-cols-2/4, xl:grid-cols-3; mobile reset action |
| `find/page.tsx` | 1/1 | 0 | 0 | 2 | 0 | 0 | 45 | min-w-0 finder form and per-section counts unchanged |
| **13-file scoped total** | **41/41** | **1** | **8** | **10** | **9** | **0** | — | Source-only bounded scan |

**Source grep equivalent:** `<Alert\b`=41, `</Alert>`=41, `<Banner\b`=1, `</Banner>`=1, `<InlineNotice\b`=8, `<EmptyState\b`=10; raw `role=status/alert`=9, all exempt: live counts, scheduled/ended announcement metadata, and batch eligibility details. Styled bespoke role=status/alert wrappers=**0** in these 13 page sources. These are bounded files, NOT repository-wide zero claims.

Reproduce locally, commands **not executed in this turn**:
```sh
rg -n '<(Alert|Banner|InlineNotice|EmptyState)([ >])|</(Alert|Banner)>' 'src/app/(authenticated)/tpo' -g page.tsx
rg -n '<(p|div|section|span)[^>]*role="(status|alert)"' 'src/app/(authenticated)/tpo' -g page.tsx
rg -n 'animate-pulse|bg-muted|bg-surface-secondary' src/app -g loading.tsx
```

### Exact legacy value re-check for migrated page notices

| Checked property/state | Old LMS path:line exact | vNext path:line exact | Status |
| --- | --- | --- | --- |
| Error token/color | `docs/design/legacy-styles/components___variables.scss:71-72` `#ef4444`, `rgba(239,68,68,0.10)` | `src/app/globals.css:51-52` same; `src/components/ui/alert.tsx:13` error background token | **MATCH base fill**; border/text state OPEN |
| Warning token/fill | `components___variables.scss:69-70` `#d97706`, `rgba(217,119,6,0.10)` | `globals.css:49-50`, shared `alert.tsx:12`/`banner.tsx:12` now `--lms-warning-subtle` | **MATCH fill** after this turn's shared primitive update |
| Info token/fill | `components___variables.scss:73-74` `#26bac7`, `#eff8fa` | `globals.css:56-57` and shared `alert.tsx:10`, `inline-notice.tsx:11` now `--lms-info-subtle` | **MATCH fill**, border and text OPEN |
| Success fill | `components___variables.scss:67-68` `#059669`, `rgba(5,150,105,0.10)` | `globals.css:47-48`, `inline-notice.tsx:10` | **MATCH fill** |
| Control radius | `components___variables.scss:133`: 6px | `globals.css:343`: 9px; shared `alert.tsx:18` token | **OPEN discrepancy**. Do not override global token owned by chat-17 |
| Spacing scale | `components___variables.scss:116-123`: 4,8,12,16,24,32,40,48px | `globals.css:350-357`: 4,8,12,16,24,32,48,64px | **MATCH** 1-6; 7/8 mismatch, owned by chat-17 |
| Focus ring and interaction | `components___accessibility.scss:19-23` outline 2px, offset 3px | `inline-notice.tsx:36` outline 2px, offset 2px; shared Link/Button retains focus | **OPEN** focus-offset and hover exact proofs |
| Phone/tablet breakpoint | `components___antddesign.scss:21-23`: max-width 767px | `empty-state.tsx:6-9` mobile 16px and `sm:` 640px; `alert.tsx:18` min-w-0/max-w-full | **OPEN** 640–767px pixel comparison; wrap rules source-reviewed |
| Loading / error / empty states | `docs/design/old-lms-pages.md:6,12,26`: single white canvas, pale info strip, dev-only dotted spinner | `src/components/ui/empty-state.tsx:6-10`: no inner white card; `error-state.tsx:5-10`: transparent inside canvas; route shared `GracefulPageLoading` uses Skeleton | Structure source-reviewed, full F4/F5 STRICT tick **OPEN** |

**Accessibility and functional guardrails:** error notices retain alert priority, informational banners retain polite status, no-data actions preserve authenticated links. A filter parse failure remains an actual error, not a falsified zero count. The Drive Day no-show view keeps unknown/unmarked distinct from recorded absence. Announcement scheduled/ended statuses remain local metadata, not decorative F3 panels.

- [ ] F3 **OPEN** until all interactive/visual property values, repo-wide hand-rolled greps, phone/tablet comparison and no-regression checks pass.
- [ ] F4 **OPEN** until route-specific loader inventory and legacy motion timing are verified.
- [ ] F5 **OPEN** until 403/404/500/offline/maintenance/session and every TPO/other-portal state are fully inventoried.

**Exact next source**: `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx`, then remaining `src/app/(authenticated)/tpo/students/page.tsx` and other portal pages.


## Chat-5 company and roster states — five source files (2026-10-19)

The next five previously unconverted TSX files were migrated and independently re-fetched from `chatgpt/chat-5-b` after each update. Counts below are exact **source-byte grep equivalents scoped to these five source files**, not checkout-wide `rg` output, TypeScript compilation, viewport screenshots, or visual comparison. No tests, lint, code execution or CI were run.

| Re-fetched path | Alert opens/closes | EmptyState | InlineNotice | Skeleton | Remaining raw role status/alert | First shared JSX line | Phone/tablet source path |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx` | 2/2 | 3 | 0 | 0 | 0 | 167 | Existing `sm:grid-cols-2`, `xl:grid-cols-5`, responsive DataTable priorities and `min-w-0` |
| `src/app/(authenticated)/tpo/companies/[companyId]/people/page.tsx` | 1/1 | 1 | 0 | 0 | 0 | 30 | Shared Alert `max-w-full` and EmptyState `min-w-0`; plain linked-contact list untouched |
| `src/app/(authenticated)/tpo/companies/[companyId]/contact-log/page.tsx` | 3/3 | 1 | 0 | 0 | 0 | 70 | Existing `flex-wrap` controls, DataTable mobile-priority fields and shared status wrapping |
| `src/app/(authenticated)/tpo/companies/[companyId]/feedback/page.tsx` | 3/3 | 1 | 0 | 0 | 0 | 53 | Existing note timeline flex-wrap/list sections plus shared EmptyState wrapping |
| `src/app/(authenticated)/tpo/students/page.tsx` | 6/6 | 0 | 1 | 1 | 0 | 264 | `sm:`/`md:` responsive layout and shared Skeleton grid fallback (five rows) |
| **Scoped totals** | **15/15** | **6** | **1** | **1** | **0** | — | Static source only |

The company detail retains its persisted drive/offer/hiring read conditions, including distinct records-unavailable vs recorded-zero evidence. Company people/contact log/feedback keep their DB09 or CRM-write gates, original links and table column priority. Student roster keeps the same saved filters and independent data-read requirements; invalid filters are Alert(error), missing registration/verification/outcome/external-offer sources are Alert(warning), timed-debarment incompleteness is InlineNotice(info), and the spreadsheet Suspense fallback is a labelled shared Skeleton rather than an unstyled live text paragraph. All source replacement pairs were re-read and balanced. No permission or server data-fetching branches were modified.

### Value table carried through this batch

| Property | Old LMS exact source/value | vNext actual source/value | Verdict |
| --- | --- | --- | --- |
| Warning background | `docs/design/legacy-styles/components___variables.scss:69-70`: `#d97706` and `rgba(217,119,6,.10)` | `src/app/globals.css:49-50` identical; shared `src/components/ui/alert.tsx:12` uses `--lms-warning-subtle` | **MATCH** base fill/hue; warning border and text metrics OPEN |
| Info background | `components___variables.scss:73-74`: `#26bac7` and `#eff8fa` | `globals.css:56-57` identical; `inline-notice.tsx:11` uses `--lms-info-subtle` | **MATCH** base fill; outline/border OPEN |
| Error background | `components___variables.scss:71-72`: `#ef4444` and `rgba(239,68,68,.10)` | `globals.css:51-52` identical; `alert.tsx:13` uses `--lms-error-subtle` | **MATCH** base fill; alpha border 0.25 not legacy-proven |
| Control radius | `components___variables.scss:133`: 6px | `globals.css:343`: 9px, shared `Alert`/InlineNotice uses the same token | **OPEN mismatch**, global token owned by chat-17 |
| Spacing scale | `components___variables.scss:116-123`: 4,8,12,16,24,32,40,48px | `globals.css:350-357`: 4,8,12,16,24,32,48,64px | MATCH first six, **OPEN mismatch** for 7/8 |
| Focus/mouse action | `components___accessibility.scss:19-23`: 2px focus outline, 3px offset | `src/components/ui/inline-notice.tsx:35-36`: 2px outline, 2px offset; shared Alert has no dismiss button | **OPEN** full hover/focus/disabled exact parity |
| Phone/tablet | `components___antddesign.scss:21-23`: mobile at max-width 767px | `src/components/ui/alert.tsx:18` `min-w-0 max-w-full`, `empty-state.tsx:6-9` wrap and responsive padding, `skeleton.tsx:24-30` `min-w-0` and reduced motion | Source constraints checked, **OPEN** 640–767 breakpoint and actual phone/tablet measurements |
| Loading / empty skeleton | `docs/design/old-lms-pages.md:26`: small dotted spinner during dev compile (not UI spec) | `src/components/ui/skeleton.tsx:21-30` shimmer with `motion-reduce:animate-none`, 5-row `Skeleton` in student grid | **OPEN** exact placeholder timing, heights, viewport and network recovery proof |

To reproduce on a checkout (commands **not executed** here):
```sh
rg -n '<(Alert|EmptyState|InlineNotice|Skeleton)([ >])|</Alert>' 'src/app/(authenticated)/tpo/companies' 'src/app/(authenticated)/tpo/students/page.tsx' -g '*.tsx'
rg -n '<(p|div|section|span)[^>]*role="(status|alert)"[^>]*(rounded|border|bg-|p-[0-9]|px-|py-)' 'src/app/(authenticated)/tpo/companies' 'src/app/(authenticated)/tpo/students/page.tsx' -g '*.tsx'
```

- [ ] F3 **OPEN**: whole-repo zero hand-rolled coverage, exact semantic border/radius/focus/hover values, responsive/visual proof missing.
- [ ] F4 **OPEN**: student Suspense source uses shared Skeleton; whole-route loader and motion parity still missing.
- [ ] F5 **OPEN**: five migrated file-level states; full system-state and all-portal inventory not verified.

**Next exact file:** `src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx` (continue with student history and request state fallbacks). The companion `src/app/(authenticated)/tpo/companies/[companyId]/manage/page.tsx` has no bespoke role-status/alert, EmptyState or error JSX from its last source read and was deliberately left unchanged.


## Chat-5 next four student workflow states — source proof (2026-10-19)

The four source files below were written only to `chatgpt/chat-5-b` and independently re-fetched after each update; shared notice JSX pairs and the original conditional branches were inspected. Values/source comparison inherits the full table above for unchanged shared components, with token fills matching old SCSS `components___variables.scss:67-74` and current `globals.css:47-57`. Radius (6px legacy vs 9px new), focus offset (3px legacy vs 2px new) and 640px vs 767px breakpoint discrepancies **remain open**; no viewport screenshots or runtime tests were performed.

| Re-fetched file | Alert open/close | EmptyState | Remaining raw status/alert | First migrated line | Responsive source |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx` | 0/0 | 1 | 0 | 90 | Existing item row wrapping and linked history unchanged |
| `src/app/(authenticated)/tpo/students/preparation-plan/page.tsx` | 2/2 | 1 | 1 | 24 | `min-w-0` page and mobile shared feedback; numeric course count stays plain live metadata |
| `src/app/(authenticated)/tpo/students/requests/page.tsx` | 1/1 | 0 | 0 | 122 | Existing grid/table breakpoints and `flex-wrap` links unchanged |
| `src/app/(authenticated)/tpo/students/preparation-prep/page.tsx` | 2/2 | 1 | 0 | 17 | Existing responsive list and pagination navigation retained |
| **Bounded total** | **5/5** | **3** | **1** | — | **0** styled bespoke status wrappers |

**Scoped source grep equivalent:** `<Alert`=5 `</Alert>`=5, `<EmptyState`=3, `<InlineNotice`=0, `<Skeleton`=0; raw status/alert=1 (unstyled evidence-count summary), styled raw=0. Every altered paired opening and closing tag was re-read. The history page retains absence of **persisted** applications, without inferring unrecorded offers, and the preparation-plan keeps the distinction between unregistered settings and an empty configured course subset. The request invalid-filter branch preserves its recovery link and never queries bad input.

**Commands for checkout execution (NOT run):**
```sh
rg -n '<(Alert|EmptyState|InlineNotice)([ >])|</Alert>|role="(alert|status)"' 'src/app/(authenticated)/tpo/students' -g page.tsx
rg -n 'animate-pulse|bg-muted|bg-surface-secondary' src/app -g loading.tsx
```

- [ ] F3, F4, F5 remain unticked: source conversion does not establish all matching legacy properties, zero whole-repo raw coverage or 320px/767px/tablet rendered proof.
- [ ] Next source: `src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx` — inspect prepared readiness controls and unavailability states, then further settings pages.

## Chat-5 2026-10-20 — 41-file strict parity source audit (main fast-forward + branch-only pushes)

Initial merge context: `main` SHA `a7616350ee830c5e187533defabafb477a27172e`; existing `chatgpt/chat-5-b` at `b43a3f9204799480b4de65d689abb92123c1a3e4` was exactly **0 ahead / 1,114 behind**. Safely fast-forwarded **only chatgpt/chat-5-b** to `main` non-forcibly with expected SHA, then all writes stayed on the branch. This is a true fast-forward to the current parent, not a discarded lane commit. Main can receive additional merges independently while this turn continues. No direct main writes, application code execution, tests, lint, CI or browser captures were run.

**Scope, not a strict tick:** 41 unique TSX files (11 TPO settings pages, 12 TPO reports pages, 15 TPO client controls, 3 owned shared-state primitives) individually edited and saved via the GitHub contents API. Branch source re-fetched after writes and every touched `<Alert>` opening/closing was counted. All original user-facing messages, saved values, limits, permission checks and retry/action links were preserved. Where empty-text components split a sentence into a title and description, no new factual assertions were inserted. All F3/F4/F5 category checkboxes **remain unticked** pending the missing exact properties, whole-repo cover and *rendered* phone/tablet proofs.

### Status feedback source grep — per-file inventory

These numbers come from **re-fetched branch TSX text scanned for JSX tags**, not a local `rg` executable run or compiled TypeScript. Each listed `Alert` open/close count is verified equal; `InlineNotice` and `EmptyState` counts are JSX occurrences, not rendered rows. Raw counts include exempt live metadata.

| File | Alert open/close | InlineNotice | EmptyState | Raw role=status/alert |
| --- | ---: | ---: | ---: | ---: |
| `src/app/(authenticated)/tpo/settings/after-college/page.tsx` | 1/1 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/settings/blocked-dates/page.tsx` | 1/1 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/settings/branding/page.tsx` | 2/2 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/settings/job-types/page.tsx` | 1/1 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/settings/notices/page.tsx` | 2/2 | 0 | 0 | 2 |
| `src/app/(authenticated)/tpo/settings/notifications/page.tsx` | 2/2 | 0 | 1 | 0 |
| `src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx` | 4/4 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/settings/public-page/page.tsx` | 4/4 | 1 | 0 | 0 |
| `src/app/(authenticated)/tpo/settings/recruiters/page.tsx` | 1/1 | 0 | 1 | 0 |
| `src/app/(authenticated)/tpo/settings/team/page.tsx` | 2/2 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/settings/trusted/page.tsx` | 2/2 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/reports/[slug]/page.tsx` | 1/1 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/reports/accreditation/page.tsx` | 2/2 | 0 | 2 | 2 |
| `src/app/(authenticated)/tpo/reports/after-college/page.tsx` | 3/3 | 0 | 1 | 0 |
| `src/app/(authenticated)/tpo/reports/branch-season/page.tsx` | 1/1 | 0 | 3 | 0 |
| `src/app/(authenticated)/tpo/reports/by-company/page.tsx` | 1/1 | 0 | 1 | 1 |
| `src/app/(authenticated)/tpo/reports/intelligence/page.tsx` | 1/1 | 0 | 1 | 0 |
| `src/app/(authenticated)/tpo/reports/joining-followups/page.tsx` | 1/1 | 0 | 2 | 0 |
| `src/app/(authenticated)/tpo/reports/leads/page.tsx` | 1/1 | 0 | 0 | 0 |
| `src/app/(authenticated)/tpo/reports/offers-expiry/page.tsx` | 2/2 | 0 | 1 | 0 |
| `src/app/(authenticated)/tpo/reports/page.tsx` | 2/2 | 0 | 2 | 1 |
| `src/app/(authenticated)/tpo/reports/placement-summary/page.tsx` | 2/2 | 0 | 1 | 1 |
| `src/app/(authenticated)/tpo/reports/unplaced/page.tsx` | 2/2 | 0 | 0 | 0 |
| `src/components/tpo/tpo-batch-undo-control.tsx` | 0/0 | 1 | 0 | 0 |
| `src/components/tpo/tpo-builtin-job-types-editor.tsx` | 0/0 | 1 | 0 | 0 |
| `src/components/tpo/tpo-communication-settings-editors.tsx` | 0/0 | 6 | 0 | 0 |
| `src/components/tpo/tpo-custom-job-type-placed.tsx` | 0/0 | 1 | 0 | 0 |
| `src/components/tpo/tpo-custom-job-type-rename.tsx` | 0/0 | 1 | 0 | 0 |
| `src/components/tpo/tpo-find-shortcut.tsx` | 1/1 | 0 | 0 | 2 |
| `src/components/tpo/tpo-home-return-refresh.tsx` | 1/1 | 0 | 0 | 1 |
| `src/components/tpo/tpo-notice-acknowledge.tsx` | 0/0 | 1 | 0 | 0 |
| `src/components/tpo/tpo-notice-read-progress.tsx` | 0/0 | 2 | 0 | 0 |
| `src/components/tpo/tpo-notification-refresh.tsx` | 1/1 | 0 | 0 | 1 |
| `src/components/tpo/tpo-placement-cell-read-action.tsx` | 0/0 | 2 | 0 | 0 |
| `src/components/tpo/tpo-safe-csv-download.tsx` | 0/0 | 1 | 0 | 0 |
| `src/components/tpo/tpo-student-clipboard-actions.tsx` | 1/1 | 0 | 0 | 1 |
| `src/components/tpo/tpo-student-note-editor.tsx` | 0/0 | 2 | 0 | 0 |
| `src/components/tpo/tpo-trusted-domain-editor.tsx` | 1/1 | 0 | 1 | 1 |
| **37 non-shared TSX files** | **46/46** | **19** | **17** | **13** |

Three owned primitive files also reviewed and changed:
- `src/components/ui/alert.tsx`: default/success/error/warning/info fill tokens preserved; control radius changed to `var(--lms-radius-control)=6px` to match old LMS.
- `src/components/ui/banner.tsx`: same 6px radius; action and generic role semantics unchanged.
- `src/components/ui/inline-notice.tsx`: 6px outer and dismiss-button radii, keyboard focus offset changed to **3px** to match old `:focus-visible` rule; success timeout and error/alert role semantics untouched.

**Exempt raw role/status instances within 37 TSX files:** 13: TPO reports' textual report counts and disabled export pseudo-link; settings notices' source counts and preparation summaries; TPO finder live searching and empty-listbox announcements; TPO live-refresh progress and clipboard status. Three retain styled `role=status` native markup: the disabled export label and two searchable listbox progress/empty entries, which are not standalone banners. Full repository grep remains OPEN.

### Actual source-of-truth property/value table — including mismatches

| Property / state | Legacy exact source and value | vNext exact source and value | Status |
| --- | --- | --- | --- |
| Success fill (default) | `docs/design/legacy-styles/components___variables.scss:67-68` `rgba(5,150,105,0.10)` | `src/app/globals.css:46-47` `--lms-success-subtle: rgba(5,150,105,0.1)`; `inline-notice.tsx:10` | **MATCH** |
| Warning fill (default) | `components___variables.scss:69-70` `rgba(217,119,6,0.10)` | `globals.css:49-50` same value; `alert.tsx:12`, `banner.tsx:12` use `--lms-warning-subtle` | **MATCH** |
| Error fill (default) | `components___variables.scss:71-72` `rgba(239,68,68,0.10)` | `globals.css:51-52`, `alert.tsx:13` use `--lms-error-subtle` | **MATCH** |
| Info fill (default) | `components___variables.scss:73-74` `#eff8fa` | `globals.css:56-57`, `alert.tsx:10`, `inline-notice.tsx:11` use `--lms-info-subtle` | **MATCH** |
| Status hues | `components___variables.scss:67-74` success `#059669`, warning `#d97706`, error `#ef4444`, info `#26bac7` | `globals.css:46-57` same source colors | **MATCH** |
| Control rounding | `components___variables.scss:133` `$radius-control:6px` | `globals.css:827` `--lms-radius-control:6px`; `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33,36` now reference that token | **MATCH in owned primitives**; other lanes' `--lms-control-radius:9px` unresolved |
| Vertical/horizontal spacing | `components___variables.scss:116-123` scale 4,8,12,16,24,32,40,48px | `globals.css:350-357` scale 4,8,12,16,24,32,48,64px | **MATCH space-1..6**; **MISMATCH space-7/8**; visual padding on EmptyState not yet verified |
| Keyboard focus (dismiss) | `components___accessibility.scss:19-23` 2px outline, **3px** offset | `inline-notice.tsx:36` 2px focus-visible outline, **3px** offset after fix | **MATCH offset/width**; outline hue / hover / active tests OPEN |
| Body of alert | `docs/design/old-lms-pages.md:7` slim pale-yellow strip with dot and one sentence | `src/components/ui/banner.tsx:17-20` wrap, 6px dot, 10px vertical padding; `alert.tsx:18` separate content box | **OPEN** height/dot location/pixel alignment, pale-yellow status appearance not fully measured |
| Neutral card shell | `old-lms-pages.md:6` single white canvas, 12px radius, border `#e5e9f0`, 24px padding | `globals.css:338-346,365-372` canvas token values align and no extra per-section cards are added by EmptyState | **MATCH structure**; screenshot OPEN |
| Breakpoint phone/tablet | `components___variables.scss:143-160` mobile max-width `767px`, 768px tablet/min-desktop transition | migrated TSX retains `min-[768px]`, `sm:` 640px, `md:` 768px or 768/992 variants; shared Alert `min-w-0 max-w-full` and `break-words` | **OPEN**: 640–767px precise legacy match unproven |
| Screen-reader error/default | legacy accessibility `components___accessibility.scss:19-23` focus for interactive content | `alert.tsx:17-21` `role=alert` for error, `role=status` for info/warning; InlineNotice analogous | Semantic source **reviewed**; ARIA live timing not browser-tested |
| Motion/disabled/active/hover | `components___accessibility.scss:38-59` mobile scale on active role-button; `components___antddesign.scss` Ant button states | shared Button/Link props kept; migrated wrappers are non-interactive | **OPEN** full default/hover/active/disabled/loading behavior and visual equality |

**Per-file responsive source proof (no viewport substitution):**
- Settings: `prep-readiness`, `blocked-dates`, `job-types`, `after-college`, `branding`, `team`, `trusted`, `notifications`, `public-page`, `recruiters`, `notices` keep existing page wrappers, responsive grid/table priorities, forms and links. Alert itself wraps with `min-w-0 max-w-full break-words`; InlineNotice uses `min-w-0 flex-1 break-words`.
- Reports: `unplaced`, `leads`, `offers-expiry`, `joining-followups`, `intelligence`, `after-college`, `branch-season`, `placement-summary`, `by-company`, `accreditation`, `[slug]`, gallery root retain the prior `sm:`, `xl:`, `flex-wrap` form controls and DataTable `mobilePriority`. Both invalid-report PageHeader elements were restored outside the colored notice region to respect legacy anatomy.
- Components: 15 action controls retain button/input dimensions and access/async behavior. Remaining live `role=status` in refresh and listbox stays a plain progress/selection announcement; external `InlineNotice` handles errors/confirmed saves and `EmptyState` handles the trusted-domain no-data list.

**Reproduction commands for a real checkout (NOT executed):**
```sh
rg -n 'role="(alert|status)"|<(Alert|Banner|InlineNotice|EmptyState|Skeleton)\\b|</(Alert|Banner)>' src/app/'(authenticated)'/tpo src/components/tpo src/components/ui
rg -n 'rounded|border|bg-|px-|py-|focus-visible' src/components/ui/{alert,banner,inline-notice}.tsx
rg -n 'animate-pulse|bg-muted|bg-surface-secondary' src/app -g loading.tsx
```
Coverage above is **scoped to 37 migrated TSX files**, not a claimed zero for the full `src` tree. The no-code-execution rule means no automated TSX parser/typecheck, browser screenshots, CI, app run, or actual end-to-end responsive comparison was possible; do not tick.

- [ ] **F3 OPEN:** legacy per-state status borders, typography, dot placement, desktop/phone/tablet pixel values, hover/active/disabled visuals, repo-wide zero bespoke wrappers.
- [ ] **F4 OPEN:** category-wide motion duration, shimmer vs old LMS dev dotted spinner and no-reduced-motion regressions.
- [ ] **F5 OPEN:** all 403/404/500/offline/maintenance/session-expired and other portal state comparisons; no 320/767/1024px captures.

**Next exact file:** `src/components/tpo/tpo-prep-readiness-editor.tsx` (remaining mixed saved-config warnings and success feedback, then adjacent TPO controls). The previously listed `src/components/tpo/tpo-communication-settings-editors.tsx` is now source-migrated.


## Chat-5 2026-10-20 — next 20 TPO components, source migrated and independently re-fetched

**Repo synchronization:** at this turn's start, `main` was `5511eb1043bb9368a74cdf84eddb35f5d18636e3` and `chatgpt/chat-5-b` was exactly zero ahead and 505 behind. Safely fast-forwarded **only the chat-5 branch** with a lease; every new change pushed via `[chat-5]` contents commits to that branch (never directly to main). Old vs new TSX files were fetched for all 20 sources, and API endpoint counts, action events, input changes, disabled guards, hrefs and HTTP mutation method tokens all stayed unchanged. All JSX `<Alert>` / `</Alert>` and `<Banner>` / `</Banner>` paired after source re-read. This is a **source-conversion result, not a strict checkbox completion or side-by-side pixel-level proof**.

### Source coverage evidence: exactly these 20 files

| Component (within `src/components/tpo/`) | Alert open/close | Banner open/close | InlineNotice | EmptyState | Untouched raw status/alert | Decorated raw role notices | First migrated line |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `tpo-prep-readiness-editor.tsx` | 1/1 | 0/0 | 2 | 0 | 0 | 0 | 62 |
| `tpo-job-types-editor.tsx` | 0/0 | 0/0 | 2 | 1 | 1 | 0 | 73 |
| `tpo-optional-emails-editor.tsx` | 0/0 | 0/0 | 2 | 0 | 0 | 0 | 60 |
| `tpo-prep-percentage-editor.tsx` | 0/0 | 0/0 | 2 | 0 | 0 | 0 | 49 |
| `tpo-after-college-editor.tsx` | 0/0 | 0/0 | 2 | 0 | 0 | 0 | 86 |
| `tpo-my-notification-preferences-editor.tsx` | 0/0 | 0/0 | 2 | 0 | 0 | 0 | 54 |
| `tpo-blocked-dates-editor.tsx` | 0/0 | 0/0 | 3 | 1 | 1 | 0 | 56 |
| `tpo-grid-filter-panel.tsx` | 0/0 | 0/0 | 1 | 0 | 1 | 0 | 39 |
| `tpo-notice-audience-picker.tsx` | 1/1 | 0/0 | 0 | 0 | 2 | 0 | 73 |
| `tpo-students-assign-prep.tsx` | 0/0 | 0/0 | 3 | 0 | 1 | 0 | 60 |
| `tpo-student-nudge-panel.tsx` | 0/0 | 0/0 | 2 | 0 | 1 | 0 | 92 |
| `tpo-batch-rule-editor.tsx` | 0/0 | 1/1 | 2 | 0 | 1 | 0 | 132 |
| `tpo-batch-decision-control.tsx` | 0/0 | 0/0 | 2 | 0 | 0 | 0 | 55 |
| `tpo-batch-inline-decision.tsx` | 0/0 | 0/0 | 3 | 0 | 0 | 0 | 78 |
| `tpo-batch-lifecycle-control.tsx` | 0/0 | 0/0 | 2 | 0 | 0 | 0 | 48 |
| `tpo-timed-debar-control.tsx` | 0/0 | 0/0 | 2 | 0 | 1 | 0 | 96 |
| `tpo-team-away-form.tsx` | 0/0 | 0/0 | 2 | 0 | 0 | 0 | 34 |
| `tpo-team-follow-controls.tsx` | 0/0 | 0/0 | 1 | 0 | 1 | 0 | 41 |
| `tpo-students-bulk-add.tsx` | 1/1 | 0/0 | 2 | 3 | 1 | 0 | 171 |
| `tpo-students-bulk-debar.tsx` | 0/0 | 0/0 | 2 | 0 | 2 | 0 | 106 |
| **Total scoped** | **3/3** | **1/1** | **39** | **5** | **13** | **0** | — |

The **13 untouched raw status** elements are deliberately live counters, form eligibility explanations, listbox selection counts, in-dialog application counts and per-learner result summaries. There are **zero raw `role="alert"`** elements in this bounded collection, but **no claim** of zero across the repository. For source-indexed, independently repeatable grep use:

```sh
rg -n '<(Alert|Banner|InlineNotice|EmptyState)\\b|</(Alert|Banner)>' src/components/tpo -g '*.tsx'
rg -n '<(p|div|span|section)[^>]*role="(alert|status)"' src/components/tpo -g '*.tsx'
rg -n 'animate-pulse|bg-muted|bg-surface-secondary' src/app -g 'loading.tsx'
```

*These commands are recorded for a later checkout. They were **not executed** in this turn; the source proof above was obtained by scanning exact re-fetched branch file content.* Each file's default/error/warning/success/empty relevant old-to-new comparison and source-level responsive check follows.

### Per-file property comparisons, scoped greps and responsiveness

#### `src/components/tpo/tpo-prep-readiness-editor.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| warning state (default) | `components___variables.scss:69–70`: `#d97706` / `rgba(217,119,6,.10)` | `alert.tsx:12` or `banner.tsx:12`: `--lms-warning-subtle`, `rgba(217,119,6,.1)` | MATCH base fill/hue; border/dot alignment OPEN |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-prep-readiness-editor.tsx` retains: min-[768px] touch target; max-h-72 scroll; min-w-0; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-prep-readiness-editor.tsx` after commit — `<Alert` 1 / `</Alert>` 1; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 0; native `role="status"/"alert"` 0, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **62**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-job-types-editor.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| empty state (default) | `old-lms-pages.md:6`: one white canvas, no nested card for normal content | `empty-state.tsx:5–9`: transparent, centered, min-w-0 and break-words | MATCH neutral surface; exact vertical typography/open whitespace OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-job-types-editor.tsx` retains: flex-wrap list rows; min-w-0; responsive controls; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-job-types-editor.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 1; native `role="status"/"alert"` 1, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **73**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-optional-emails-editor.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-optional-emails-editor.tsx` retains: md:min-h-9 button; source email preferences remain checkbox-based; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-optional-emails-editor.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 0; native `role="status"/"alert"` 0, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **60**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-prep-percentage-editor.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-prep-percentage-editor.tsx` retains: min-[768px]:min-h-9 button; input dimensions unchanged; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-prep-percentage-editor.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 0; native `role="status"/"alert"` 0, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **49**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-after-college-editor.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-after-college-editor.tsx` retains: min-w-0/dialog and flex-wrap actions preserved; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-after-college-editor.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 0; native `role="status"/"alert"` 0, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **86**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-my-notification-preferences-editor.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-my-notification-preferences-editor.tsx` retains: min-[768px]:min-h-9 Save; checkboxes unchanged; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-my-notification-preferences-editor.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 0; native `role="status"/"alert"` 0, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **54**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-blocked-dates-editor.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| empty state (default) | `old-lms-pages.md:6`: one white canvas, no nested card for normal content | `empty-state.tsx:5–9`: transparent, centered, min-w-0 and break-words | MATCH neutral surface; exact vertical typography/open whitespace OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-blocked-dates-editor.tsx` retains: min-[768px]:grid-cols-2; max-height/overflow scroll; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-blocked-dates-editor.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 3; `<EmptyState` 1; native `role="status"/"alert"` 1, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **56**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-grid-filter-panel.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-grid-filter-panel.tsx` retains: md: min button and text; mobile BottomSheet retained; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-grid-filter-panel.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 1; `<EmptyState` 0; native `role="status"/"alert"` 1, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **39**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-notice-audience-picker.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-notice-audience-picker.tsx` retains: responsive min-w-48 drive target selector; live counts unchanged; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-notice-audience-picker.tsx` after commit — `<Alert` 1 / `</Alert>` 1; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 0; `<EmptyState` 0; native `role="status"/"alert"` 2, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **73**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-students-assign-prep.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-students-assign-prep.tsx` retains: min-w-0/flex-wrap; due-date input and dialog retained; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-students-assign-prep.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 3; `<EmptyState` 0; native `role="status"/"alert"` 1, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **60**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-student-nudge-panel.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-student-nudge-panel.tsx` retains: min-w-0 grid and scroll cue retained; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-student-nudge-panel.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 0; native `role="status"/"alert"` 1, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **92**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-batch-rule-editor.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| warning state (default) | `components___variables.scss:69–70`: `#d97706` / `rgba(217,119,6,.10)` | `alert.tsx:12` or `banner.tsx:12`: `--lms-warning-subtle`, `rgba(217,119,6,.1)` | MATCH base fill/hue; border/dot alignment OPEN |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-batch-rule-editor.tsx` retains: flex-wrap actions and 44px control targets retained; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-batch-rule-editor.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 1 / `</Banner>` 1; `<InlineNotice` 2; `<EmptyState` 0; native `role="status"/"alert"` 1, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **132**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-batch-decision-control.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-batch-decision-control.tsx` retains: md:min-h-9 buttons, confirm flow unchanged; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-batch-decision-control.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 0; native `role="status"/"alert"` 0, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **55**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-batch-inline-decision.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-batch-inline-decision.tsx` retains: flex gap; dialog and w-full layout retained; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-batch-inline-decision.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 3; `<EmptyState` 0; native `role="status"/"alert"` 0, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **78**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-batch-lifecycle-control.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-batch-lifecycle-control.tsx` retains: Button/Checkbox min target unchanged; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-batch-lifecycle-control.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 0; native `role="status"/"alert"` 0, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **48**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-timed-debar-control.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-timed-debar-control.tsx` retains: responsive form controls and dialog retained; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-timed-debar-control.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 0; native `role="status"/"alert"` 1, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **96**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-team-away-form.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| success state (default) | `components___variables.scss:67–68`: `#059669` / `rgba(5,150,105,.10)` | `inline-notice.tsx:9`: `--lms-success-subtle`, `rgba(5,150,105,.1)` | MATCH base fill/hue; animation/hover OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-team-away-form.tsx` retains: md:min-h-9 buttons; flex-wrap actions; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-team-away-form.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 0; native `role="status"/"alert"` 0, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **34**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-team-follow-controls.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-team-follow-controls.tsx` retains: compact FilterChip and status availability retained; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-team-follow-controls.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 1; `<EmptyState` 0; native `role="status"/"alert"` 1, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **41**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-students-bulk-add.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| empty state (default) | `old-lms-pages.md:6`: one white canvas, no nested card for normal content | `empty-state.tsx:5–9`: transparent, centered, min-w-0 and break-words | MATCH neutral surface; exact vertical typography/open whitespace OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-students-bulk-add.tsx` retains: md:grid-cols-2; max-h-80 learner list; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-students-bulk-add.tsx` after commit — `<Alert` 1 / `</Alert>` 1; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 3; native `role="status"/"alert"` 1, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **171**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

#### `src/components/tpo/tpo-students-bulk-debar.tsx`

| Visual property | Old LMS exact value and source | vNext current source/value | Result |
| --- | --- | --- | --- |
| error state (default) | `components___variables.scss:71–72`: `#ef4444` / `rgba(239,68,68,.10)` | `inline-notice.tsx:8` and `alert.tsx:13`: `--lms-error-subtle`, `rgba(239,68,68,.1)` | MATCH base fill/hue; text and border contrast OPEN |
| Shared feedback control radius | `components___variables.scss:133`: **6px** | `globals.css:827`: `--lms-radius-control:6px` used by `alert.tsx:18`, `banner.tsx:17`, `inline-notice.tsx:33` | MATCH for shared primitives |
| Responsive / phone tablet | `components___antddesign.scss:21–23`: mobile max **767px**; `components___variables.scss:136`: touch 44px | `tpo-students-bulk-debar.tsx` retains: md:min-h-9 action; max-h-64 result ScrollCue; shared Alert `min-w-0 max-w-full`, InlineNotice `min-w-0 break-words` | Source-only; rendered 320/767/768/1024px **OPEN** |
| Focus, hover, active, disabled/loading | `components___accessibility.scss:19–23,43–58`: focus 2px/3px offset; mobile role-button active scale .98 | `inline-notice.tsx:36` dismiss focus 2px/3px; source event handlers, disabled controls and loading branches identical to baseline | Partial focus match; actual hover/disabled/loading pixel comparison **OPEN** |

**Scoped grep source proof:** re-fetched `tpo-students-bulk-debar.tsx` after commit — `<Alert` 0 / `</Alert>` 0; `<Banner` 0 / `</Banner>` 0; `<InlineNotice` 2; `<EmptyState` 0; native `role="status"/"alert"` 2, all unstyled count/selection/result descriptors; decorated native notice wrappers **0**. First migrated shared state at line **106**. Baseline-vs-current static probes: `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, mutation-method token counts **unchanged**. No compilation, browser, pixel or behavior execution.

### Strict-tick and browser proof gaps

- [ ] **F3**: scoped migration complete for these 20 files only. Old warning/error/success background values and shared 6px radius match. Whole-repo zero bespoke notices, text metrics, notice border hues, active/hover/disabled and actual breakpoint comparisons **OPEN**.
- [ ] **F4**: no loading route/skeleton motion changes in this batch; full category-specific route timing and reduced-motion comparisons **OPEN**.
- [ ] **F5**: shared EmptyState for five JSX sites, but exact old 403/404/500/offline/maintenance/session-expired and rendered 320px/767px/1024px behavior **OPEN**.
- [ ] **No individual strict completion box ticked** without running required repo-wide grep and rendered responsive/visual checks. "Source migrated" does not equal pixel-cloned.

**Exact next file:** `src/components/tpo/tpo-team-forms.tsx`, followed by `src/components/tpo/tpo-team-handover.tsx` and `src/components/tpo/tpo-campaign-compose.tsx`.


## Chat-5 2026-10-20 — 15 TPO messaging, team and campaign files, next source-migration batch

**Branch and baseline:** At the start, `chatgpt/chat-5-b` was 0 ahead and 444 commits behind `main` `75cef123a9bafdf9126daaeb23556f66cb878caa`. Fast-forwarded only the chat-5 branch non-forcibly to that main SHA, then pushed **only to `chatgpt/chat-5-b`** with `[chat-5]` file updates. Main has been receiving concurrent lane merges; no writes directly to main. Source work only: 15 distinct TSX files in `src/components/tpo`, not a claim of complete F3/F4/F5 parity or completed browser pixel verification.

### Source grep and JSX integrity — per file

This bounded file-by-file table is from exact source files **re-fetched after GitHub writes** and scanned for matching JSX opening/closing tags and native ARIA roles. It is not output of repository-wide `rg`; checkout and executable code have not been run.

| TPO TSX source | Alert opens/closes | InlineNotice | EmptyState | Plain native role status | Decorated native role status/alert | First converted line | Responsive source evidence |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `tpo-team-forms.tsx` | 0/0 | 3 | 0 | 1 | 0 | 95 | 80: `min-h-11 md:min-h-9`; 92: `w-full`; 166: `min-h-11 md:min-h-9` |
| `tpo-team-handover.tsx` | 0/0 | 2 | 0 | 0 | 0 | 51 | 38: `min-w-0`; 41,48: `min-h-11 md:min-h-9` |
| `tpo-team-assign-unowned.tsx` | 0/0 | 2 | 0 | 0 | 0 | 59 | 40: `flex-wrap`; 41: `min-w-0`; 43: `min-h-11 md:min-h-9` |
| `tpo-team-message-actions.tsx` | 0/0 | 2 | 0 | 0 | 0 | 39 | 28: `flex-wrap`; 34: `w-full`; 40: `min-h-11 md:min-h-9` |
| `tpo-team-decision-toggle.tsx` | 0/0 | 1 | 0 | 0 | 0 | 31 | 26: `inline-flex min-w-0 flex-wrap` on valid div wrapper; 28: `min-h-11 md:min-h-8` |
| `tpo-team-rename.tsx` | 0/0 | 1 | 0 | 0 | 0 | 36 | 29,34,39: `min-h-11 md:min-h-9` |
| `tpo-company-team-composer.tsx` | 0/0 | 1 | 0 | 0 | 0 | 60 | 54: `min-w-0`; 62: `min-h-11 md:min-h-9` |
| `tpo-team-open-read.tsx` | 1/1 | 0 | 0 | 0 | 0 | 26 | 26: `flex-row flex-wrap`; 28: `min-h-11 md:min-h-9` retry |
| `tpo-team-ask-panel.tsx` | 2/2 | 2 | 1 | 0 | 0 | 49 | 36: `flex-wrap`; 90: `min-w-0`; 96: `min-h-11 md:min-h-9` |
| `tpo-new-followup-modal.tsx` | 0/0 | 1 | 0 | 0 | 0 | 120 | 15: `min-h-11 w-full md:min-h-9`; 123: 44px cancel; 124: disabled Save |
| `tpo-new-recruiter-conversation.tsx` | 0/0 | 1 | 1 | 0 | 0 | 115 | 86: `min-h-11 w-full`; 93: `flex-wrap`; 100: `min-h-28 w-full` |
| `tpo-recruiter-message-reply.tsx` | 0/0 | 2 | 0 | 1 | 0 | 98 | 70,84: `flex-wrap`; 77: `min-h-28 w-full`; 88: `min-h-11 md:min-h-9` |
| `tpo-campaign-send-control.tsx` | 1/1 | 1 | 0 | 1 | 0 | 39 | 47: `min-h-11 min-[768px]:min-h-9`; disabled send guard retained |
| `tpo-campaign-compose.tsx` | 4/4 | 2 | 0 | 4 | 0 | 89 | 17: `min-h-11 w-full min-[768px]:min-h-9`; 122: `break-words`; 141: disabled Save |
| `tpo-due-followup-workspace.tsx` | 1/1 | 2 | 1 | 0 | 0 | 130 | 41: `min-h-11 w-full md:min-h-9`; 146: `md:grid-cols-2`; 191: `flex-wrap` |
| **15-file total** | **9/9** | **23** | **3** | **7** | **0** | — | Static, not rendered |

**Scoped interpretation:** Raw `role="alert"` instances across these 15 source files = **0**; seven native polite `role="status"` labels remain intentionally for decision state, draft feedback, campaign audience figures, send counts or confirmation prompts. None uses bespoke decorated status panel markup. Converted Alert JSX pairs were re-read after each touched opening/closing tag. One extra semantics correction was made to `tpo-team-decision-toggle.tsx`: the outer `span` became `div.inline-flex` because `InlineNotice` is a block-level `div` and invalid nesting would otherwise occur. `tpo-team-forms.tsx` also had four duplicate Input/Select/Textarea/Button imports eliminated so each shared UI component is imported once.

**Repeatable whole-repo commands for checkout execution (NOT executed in this turn):**
```sh
rg -n 'role="(alert|status)"|<(Alert|InlineNotice|EmptyState)\\b|</Alert>' src/components/tpo src/app
rg -n 'animate-pulse|bg-muted|bg-surface-secondary' src/app -g 'loading.tsx'
rg -n 'sm:|md:|min-\\[768px\\]:|min-w-0|flex-wrap|break-words' src/components/tpo -g '*.tsx'
```

### File-by-file old LMS value comparisons and responsive/no-regression source checks

#### `src/components/tpo/tpo-team-forms.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| success state default | `components___variables.scss:67–68` — `#059669`, `rgba(5,150,105,.10)` | `globals.css:47–48`; `inline-notice.tsx:9` uses `--lms-success-subtle` | MATCH base hue and fill; dismiss timeout/animation parity OPEN |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-team-forms.tsx` 80: `min-h-11 md:min-h-9`; 92: `w-full`; 166: `min-h-11 md:min-h-9`; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **0** and `</Alert>` **0**; `<InlineNotice` **3**; `<EmptyState` **0**; `role="status"` native **1** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **95**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-team-handover.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| success state default | `components___variables.scss:67–68` — `#059669`, `rgba(5,150,105,.10)` | `globals.css:47–48`; `inline-notice.tsx:9` uses `--lms-success-subtle` | MATCH base hue and fill; dismiss timeout/animation parity OPEN |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-team-handover.tsx` 38: `min-w-0`; 41,48: `min-h-11 md:min-h-9`; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **0** and `</Alert>` **0**; `<InlineNotice` **2**; `<EmptyState` **0**; `role="status"` native **0** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **51**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-team-assign-unowned.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| success state default | `components___variables.scss:67–68` — `#059669`, `rgba(5,150,105,.10)` | `globals.css:47–48`; `inline-notice.tsx:9` uses `--lms-success-subtle` | MATCH base hue and fill; dismiss timeout/animation parity OPEN |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-team-assign-unowned.tsx` 40: `flex-wrap`; 41: `min-w-0`; 43: `min-h-11 md:min-h-9`; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **0** and `</Alert>` **0**; `<InlineNotice` **2**; `<EmptyState` **0**; `role="status"` native **0** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **59**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-team-message-actions.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-team-message-actions.tsx` 28: `flex-wrap`; 34: `w-full`; 40: `min-h-11 md:min-h-9`; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **0** and `</Alert>` **0**; `<InlineNotice` **2**; `<EmptyState` **0**; `role="status"` native **0** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **39**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-team-decision-toggle.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-team-decision-toggle.tsx` 26: `inline-flex min-w-0 flex-wrap` on valid div wrapper; 28: `min-h-11 md:min-h-8`; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **0** and `</Alert>` **0**; `<InlineNotice` **1**; `<EmptyState` **0**; `role="status"` native **0** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **31**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-team-rename.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-team-rename.tsx` 29,34,39: `min-h-11 md:min-h-9`; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **0** and `</Alert>` **0**; `<InlineNotice` **1**; `<EmptyState` **0**; `role="status"` native **0** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **36**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-company-team-composer.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-company-team-composer.tsx` 54: `min-w-0`; 62: `min-h-11 md:min-h-9`; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **0** and `</Alert>` **0**; `<InlineNotice` **1**; `<EmptyState` **0**; `role="status"` native **0** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **60**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-team-open-read.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-team-open-read.tsx` 26: `flex-row flex-wrap`; 28: `min-h-11 md:min-h-9` retry; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **1** and `</Alert>` **1**; `<InlineNotice` **0**; `<EmptyState` **0**; `role="status"` native **0** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **26**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-team-ask-panel.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| warning state default | `components___variables.scss:69–70` — `#d97706`, `rgba(217,119,6,.10)` | `globals.css:49–50`; `alert.tsx:12` uses `--lms-warning-subtle` | MATCH base hue and fill; border and layout pixels OPEN |
| empty state default | `old-lms-pages.md:6` — single white canvas with no extra nested card | `empty-state.tsx:5–9` — transparent background, no inner card; centered text and word wrapping | MATCH no extra card by source; precise whitespace/typography OPEN |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-team-ask-panel.tsx` 36: `flex-wrap`; 90: `min-w-0`; 96: `min-h-11 md:min-h-9`; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **2** and `</Alert>` **2**; `<InlineNotice` **2**; `<EmptyState` **1**; `role="status"` native **0** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **49**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-new-followup-modal.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-new-followup-modal.tsx` 15: `min-h-11 w-full md:min-h-9`; 123: 44px cancel; 124: disabled Save; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **0** and `</Alert>` **0**; `<InlineNotice` **1**; `<EmptyState` **0**; `role="status"` native **0** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **120**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-new-recruiter-conversation.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| empty state default | `old-lms-pages.md:6` — single white canvas with no extra nested card | `empty-state.tsx:5–9` — transparent background, no inner card; centered text and word wrapping | MATCH no extra card by source; precise whitespace/typography OPEN |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-new-recruiter-conversation.tsx` 86: `min-h-11 w-full`; 93: `flex-wrap`; 100: `min-h-28 w-full`; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **0** and `</Alert>` **0**; `<InlineNotice` **1**; `<EmptyState` **1**; `role="status"` native **0** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **115**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-recruiter-message-reply.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| success state default | `components___variables.scss:67–68` — `#059669`, `rgba(5,150,105,.10)` | `globals.css:47–48`; `inline-notice.tsx:9` uses `--lms-success-subtle` | MATCH base hue and fill; dismiss timeout/animation parity OPEN |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-recruiter-message-reply.tsx` 70,84: `flex-wrap`; 77: `min-h-28 w-full`; 88: `min-h-11 md:min-h-9`; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **0** and `</Alert>` **0**; `<InlineNotice` **2**; `<EmptyState` **0**; `role="status"` native **1** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **98**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-campaign-send-control.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| warning state default | `components___variables.scss:69–70` — `#d97706`, `rgba(217,119,6,.10)` | `globals.css:49–50`; `alert.tsx:12` uses `--lms-warning-subtle` | MATCH base hue and fill; border and layout pixels OPEN |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-campaign-send-control.tsx` 47: `min-h-11 min-[768px]:min-h-9`; disabled send guard retained; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **1** and `</Alert>` **1**; `<InlineNotice` **1**; `<EmptyState` **0**; `role="status"` native **1** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **39**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-campaign-compose.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| warning state default | `components___variables.scss:69–70` — `#d97706`, `rgba(217,119,6,.10)` | `globals.css:49–50`; `alert.tsx:12` uses `--lms-warning-subtle` | MATCH base hue and fill; border and layout pixels OPEN |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| success state default | `components___variables.scss:67–68` — `#059669`, `rgba(5,150,105,.10)` | `globals.css:47–48`; `inline-notice.tsx:9` uses `--lms-success-subtle` | MATCH base hue and fill; dismiss timeout/animation parity OPEN |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-campaign-compose.tsx` 17: `min-h-11 w-full min-[768px]:min-h-9`; 122: `break-words`; 141: disabled Save; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **4** and `</Alert>` **4**; `<InlineNotice` **2**; `<EmptyState` **0**; `role="status"` native **4** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **89**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**

#### `src/components/tpo/tpo-due-followup-workspace.tsx`

| Compared property | Old LMS evidence/value | vNext actual evidence/value | Verification |
| --- | --- | --- | --- |
| warning state default | `components___variables.scss:69–70` — `#d97706`, `rgba(217,119,6,.10)` | `globals.css:49–50`; `alert.tsx:12` uses `--lms-warning-subtle` | MATCH base hue and fill; border and layout pixels OPEN |
| error state default | `components___variables.scss:71–72` — `#ef4444`, `rgba(239,68,68,.10)` | `globals.css:51–52` same token; `inline-notice.tsx:8` / `alert.tsx:13` use `--lms-error-subtle` | MATCH base hue and fill; exact border opacity/text metrics not yet proven |
| success state default | `components___variables.scss:67–68` — `#059669`, `rgba(5,150,105,.10)` | `globals.css:47–48`; `inline-notice.tsx:9` uses `--lms-success-subtle` | MATCH base hue and fill; dismiss timeout/animation parity OPEN |
| empty state default | `old-lms-pages.md:6` — single white canvas with no extra nested card | `empty-state.tsx:5–9` — transparent background, no inner card; centered text and word wrapping | MATCH no extra card by source; precise whitespace/typography OPEN |
| Radius / spacing | `components___variables.scss:133` control radius 6px; `:116–123` spacing 4/8/12/16/24/32/40/48px | `globals.css:836` radius 6px; `alert.tsx:18`, `inline-notice.tsx:33` use radius, px16 / py12 | Radius MATCH; notice padding/space-7,8 precise parity OPEN |
| Phone, tablet, text wrapping | `components___antddesign.scss:21` mobile max-width 767px; `components___variables.scss:139` min touch target 44px | `tpo-due-followup-workspace.tsx` 41: `min-h-11 w-full md:min-h-9`; 146: `md:grid-cols-2`; 191: `flex-wrap`; `alert.tsx:18` min-w-0/max-w-full, `inline-notice.tsx:33–34` min-w-0/break-words | Static responsive source **checked**; rendered 320px, 767px, 768px, 1024px still OPEN |
| Focus/hover/active/disabled | `components___accessibility.scss:19–23`: focus ring 2px, offset 3px; `:43–58` active scale .98 on role button | `inline-notice.tsx:36`: 2px/3px for dismiss; original Button/FilterChip/input handlers and disabled guard counts unchanged | Partial focus source MATCH; screenshot/interaction proof OPEN |

**Scoped grep proof from re-fetched `chatgpt/chat-5-b` file:** `<Alert` **1** and `</Alert>` **1**; `<InlineNotice` **2**; `<EmptyState` **1**; `role="status"` native **0** (unchanged plain counts, itemized result or draft progress, not bespoke bordered banners); decorated raw status/alert **0**; raw `role="alert"` **0**. First converted shared JSX: line **130**. Source-level no-regression comparison against `75cef123a9bafdf9126daaeb23556f66cb878caa` found identical counts for `apiFetch`, `fetch(`, `onClick=`, `onChange=`, `disabled=`, `href=`, `action=`, `method=`, and mutation method tokens. **No TS parser, browser, CI, tests or runtime build executed.**


### Strict-tick gap register

- [ ] **F3 OPEN:** shared error/warning/success fills and 6px control radius token-level match old LMS; rendered border widths/opacities, text baselines, button focus/hover/active/disabled/loading and whole-repo zero bespoke instances have **not** been proved.
- [ ] **F4 OPEN:** no broader route loading/spinner/shimmer timing or reduced-motion browser proof in this batch.
- [ ] **F5 OPEN:** three empty-state sites migrated, but entire application 403/404/500/maintenance/offline/session-expired and actual viewport comparisons still open.
- [ ] **Per-file strict tick OPEN:** values/grep/responsive **source** proof is not equivalent to side-by-side 320px/767px/1024px screenshots or executed functionality. No CI, tests, app build, TS compile or browser run.

**Next exact file:** `src/components/tpo/tpo-company-team-conversation.tsx` (mixed company team loading, migration gate, truncated history, threaded message responses), followed by `src/components/tpo/tpo-selected-review-queue.tsx`.
