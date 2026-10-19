# Learner portal UI clone audit — chat-1

Base: `42Students/lms-vnext` `main` at `1fae38d2c433f5b5b0a90a22be12754ab28796e0` (2026-10-19). Branch: `chatgpt/chat-1-b`.

Scope: `src/app/(authenticated)/learn/**` except `courses/**` (chat-7), learner projects and `src/components/placements/learner-*`, `src/components/attendance/learner-*`. No shared UI, `legacy-skin.css`, shell or non-learner components edited.

## Work queue (GitHub directory inventory and targeted JSX inspection; exhaustive grep is pending)
- [ ] LRN-01: **source fix delivered** in `my-placements/{applications,jobs,placement,schedule}/page.tsx`: four `PageHeader`s, two preserved destination/action links and schedule shared `Tabs` (4 file commits, 2026-10-19). Existing `scripts/codemods/chat1-learner-page-headings.cjs` authored for repeatable 4-file migration; GitHub edits applied its planned JSX transformations without running Node. Strict tick blocked by computed title values, full markup grep and phone/tablet screenshot proof.
- [ ] LRN-02: **partial**: Announcements (8) and My offers (5) filter link instances now share exact learner SCSS pill dimensions, active/hover/focus selectors and 767px horizontal scroll rules; applied on 2026-10-19. Dynamic route checks, actual computed values and other placement routes remain. Remaining placement pages `my-placements/{announcements,assessments,calendar,interviews,notification-preferences,offers,preparation,rules,schedule,support}/page.tsx`, main `my-placements/page.tsx`: titles, tab order, filters, links, notices, single canvas.
- [ ] LRN-03: `src/components/placements/learner-{applications,jobs}-browse.tsx`: **partial**: removed hand-rolled `aria-pressed` controls in these two files; shared `SegmentedControl` uses native radio states with 44px min mobile target and `Tabs` supplies underline for application views. Verify keyboard, routing and remaining components before tick.
- [ ] LRN-04: **9 learner source files swept in total; three more components source-complete this batch** (`learner-placement-{jobs,offers,alerts}.tsx`), plus `learner-placements-dashboard.tsx` and shared `learner-placements-tabs.tsx` inspection. New batch removes the remaining two raw buttons, fixes three card/empty layouts and matches <=767px responsive rules. The other `learner-*` components, full visual/proof checks, and parity of real interactions remain OPEN; see the value table and exact source counts below.
- [ ] LRN-05: **partial**: `learn/attendance/page.tsx` and `learn/calendar/page.tsx` now put their existing action link in the same `PageHeader` row (2026-10-19); learner project detail already renders `PageHeader` for audit and invalid-board-filter states, while regular project workspace keeps its own header. `learn/{attendance,calendar,profile,projects,notifications,placements}/page.tsx` plus nested pages, `src/components/attendance/learner-attendance-workspace.tsx`: PageHeader, responsive titles and controls.
- [ ] LRN-06: `loading.tsx`/`error.tsx`/`not-found.tsx` in learner trees: shared UI, retry, mobile and tablet states.
- [ ] LRN-07: `allAssignments`, `allQuizzes`, `assignments`, `quizzes` potentially overlap chat-7's COURSES ownership. No edits before ownership check.

## Preliminary value evidence (all OPEN; no strict-tick claim)
| Property | Old LMS | vNext | Status |
|---|---|---|---|
| Listing title | `docs/design/legacy-styles/components___listing-page-header.scss:52-60`: 28px, weight 600, 1.3 line-height | `src/components/ui/page-header.tsx:28-37`: desktop 30px, weight 600 | Open: legacy TPO page header vs learner listing reference differ; do not edit shared component |
| Mobile title | `docs/design/legacy-styles/components___listing-page-header.scss:131-143`: 20px title and stacked layout | `src/components/ui/page-header.tsx:21-29`: stacked mobile with 20px | Open: visual + computed-value comparison missing |
| Learner mobile spacing | `docs/design/legacy-styles/components___learn-layout.scss:152-163`: 16px mobile / 24px desktop content inset | `src/components/ui/page-canvas.tsx`: global owner; not yet inspected | Open: avoid double padding |
| Notice filter touch height | `docs/design/legacy-styles/components___learn-notifications.scss:82-109`: min-height 44px, teal active state | `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:119-139`: `min-h-11` (44px) | Source-corrected in prior batch; rendered states remain open |

## Strict tick rule
No items ticked. Value tables, full zero-instance greps, responsive phone/tablet proof, no-regression review and side-by-side screenshots have not been completed. Never treat merely writing a codemod as migrating pages.

Pending orchestrator greps:
```bash
find 'src/app/(authenticated)/learn' -name '*.tsx' -not -path '*/courses/*' -print
grep -RInE '<h1|aria-pressed|role="tab"|#[[:xdigit:]]{6}|rounded-xl' 'src/app/(authenticated)/learn' --include='*.tsx'
grep -RIn 'PageHeader' 'src/app/(authenticated)/learn' --include='*.tsx'
```

## Source-level changes delivered on chat-1 branch (not a strict tick)
| Instance | Old LMS reference | vNext file:line and source change | Remaining |
|---|---|---|---|
| Drive bookmark / availability choice pills | `docs/design/legacy-styles/components___learn-notifications.scss:90-119` (44px touch, hover / focus / active state) | `src/components/placements/learner-jobs-browse.tsx:103-168`: shared `SegmentedControl`, checked radio state, labels and count preserved | Compare computed teal colours and mobile wrap |
| Application stage underline tabs and screening chips | `docs/design/legacy-styles/components___listing-page-header.scss:45-60`; `components___learn-notifications.scss:90-119` | `src/components/placements/learner-applications-browse.tsx:249-273`: shared `Tabs` + `SegmentedControl`, labels, counts, query writes retained | Keyboard, selected line and zero raw controls elsewhere not proven |
| Notice filters | `docs/design/legacy-styles/components___learn-notifications.scss:90-116` (min-height 44px, border / hover / focus) | `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:119-139,222-225`: eight source link instances use 44px min, focus and `aria-current` selected styling | Teal selected value and tablet proof not yet verified |
| Offer filters | `docs/design/legacy-styles/components___learn-notifications.scss:90-119` | `src/app/(authenticated)/learn/my-placements/offers/page.tsx:163-197`: five source link instances display selected `aria-current` styling and 44px min | Active hover computed styles unverified |
| Learner project audit/error route headers | `docs/design/legacy-styles/components___listing-page-header.scss:26-60` | `src/app/(authenticated)/learn/projects/[projectId]/page.tsx:80-84,135-140`: `PageHeader` on two otherwise titleless conditional branches | Responsive and live proof missing |

Source reread: after write, checked placement filter components' tag boundaries (2 `SegmentedControl`, 1 `Tabs`), no leftover `aria-pressed` raw buttons in those two files; removed eight accidentally orphaned `sm:` class fragments from notice link styles; fixed heading codemod to use exact action link boundaries rather than a brittle regex. **No TypeScript checker, codemod, runtime, CI or UI screenshot was run.**

## Replacement lane chat-1 batch (2026-10-19, branch reset onto current main)

- Branch force-with-lease reset onto origin/main commit `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0` because prior chat-1 branch was **0 ahead / 1679 behind**; all previous [chat-1] commits already merged into main. Changes below are new commits on top of main.
- Updated: `learn/my-placements/{applications,jobs,placement,schedule,announcements,offers}/page.tsx`, `learn/{attendance,calendar}/page.tsx`, and `src/components/placements/learner-placements-dashboard.tsx` (9 files). No shared UI or shell or `legacy-skin.css` edited. No course files edited.
- Legacy headers: `docs/design/old-lms-pages.md:5-13` (one canvas, one heading/action row); `docs/design/legacy-styles/components___listing-page-header.scss:40-81,131-145` (title-row wrapping, mobile heading); PageHeader implementation `src/components/ui/page-header.tsx:17-56`. Source comparison: four placement headings + two general learner action rows now use shared page header. Title-size conflict remains (`listing-page-header.scss:52` 28px versus `page-header.tsx` desktop 30px), owned by chat-9/17. Do not tick.
- Legacy learner filters: `docs/design/legacy-styles/components___learn-notifications.scss:58-74,82-124`. Value table:

| Property | Legacy value (source) | New notice/offer value | Status |
|---|---|---|---|
| Minimum hit target | `min-height:44px` (line 89) | `min-h-11` (44px) | Source match |
| Pill geometry | `padding:8px 16px`, radius 8px (lines 88-94) | `py-2 px-4 rounded-lg` | Source match |
| Font | 14px / 500 / line-height 1.3 (lines 91-95) | `text-[14px] font-medium leading-[1.3]` | Source match |
| Neutral boundary | `1px solid $neutral-200` (line 97; variables.scss) | `border-[var(--lms-neutral-200)]` | Source match |
| Selected | `$clrThird` background/border, white text (lines 110-115) | `--lms-primary: #26bac7`, `--lms-on-primary` white | Source match |
| Hover | `rgba($primary,.4)` border / `rgba($primary,.05)` fill / 150ms (lines 101-107) | `rgba(38,186,199,.4/.05)`, `duration-150` | Source match |
| Focus | 2px primary, offset 2px (lines 108-111) | `focus-visible:outline-2 ...` | Source match |
| Mobile strip | <=767px, nowrap, horizontal scrolling, hidden scrollbar, 8px gap (lines 56-74) | `flex-nowrap overflow-x-auto ... sm:flex-wrap`, `gap-2`, scrollbars hidden | Source match pending rendered proof |

Static source proof on modified files (GitHub fetch inspection; **not** local exhaustive grep): four new `PageHeader` occurrences, one route using `Tabs`, and zero old `aria-[current=page]:hover:bg-[var(--lms-button-primary)]` filter link class blocks in the two filtered route files. `learn/attendance` and `learn/calendar` preserve one action link each. No TypeScript parser, application runtime, CI, or screenshot executed. The strict tick rule therefore keeps all queue items OPEN.

**Next file:** `src/components/placements/learner-placement-journey.tsx` (LRN-04), then `learner-placement-job-detail.tsx`.

### LRN-04 subsequent source inspection

- `src/components/placements/learner-placements-tabs.tsx:1-53`: vNext already uses shared `Tabs`, seven stable legacy labels/routes and unread notice count; no edit needed. `Tabs` uses its own horizontal `ScrollCue` to prevent mobile overflow; real-device swipe gesture remains unverified.
- `src/components/placements/learner-placements-dashboard.tsx`: four responsive fixes (44px mobile/36px desktop for two schedule action links, 44px target for pending-offers navigation, `min-w-0 flex-1` for flexible to-do text). Legacy touch minimum `components___learn-notifications.scss:10,88-90`; mobile breakpoint `components___learn-layout.scss:152-163`. No source-wide zero-instance or computed-style claim.

## Chat-1 replacement continuation — drive, offer and personal alert components (2026-10-19)

**Source-completed files** (not full pixel parity): 
`src/components/placements/learner-placement-jobs.tsx`,
`src/components/placements/learner-placement-offers.tsx`,
`src/components/placements/learner-placement-alerts.tsx`.
The two action components preserve fetch/confirmation, disabled-while-pending, toast, dialog, offer-decline/extension and download flows. The notices component retains its alert sort order, status, link and dates. No functionality/wording was removed.

### Value-by-value source comparison
Legacy references: `docs/design/legacy-styles/components___learn-notifications.scss:10-29,178-222,263-294,304-330`, `components___accessibility.scss:19-38`, `components___learn-layout.scss:151-192`, and `components___variables.scss:7-36`. When no precise placement-specific SCSS is present, the legacy row-card analogue is identified rather than asserting visual equivalence.

| Item / value | Legacy expected | vNext source and value | Source status |
|---|---|---|---|
| Jobs/Offers cards: neutral border | `$neutral-200: #e5e9f0`, 1px (variables:35; notifications:185) | `learner-placement-jobs.tsx:535`, `learner-placement-offers.tsx:282`: `border border-border` using global token | Matches variable definition; computed colour unverified |
| Jobs/Offers cards: background | `$white: #fff` (notifications:184) | Same lines: `bg-surface` = `--lms-surface: var(--lms-white)` (`globals.css:68-72`) | Source match |
| Jobs/Offers cards: corner radius | `$radius-lg: 12px` (notifications:22,186) | Same lines: `rounded-xl` (12px) | Source match |
| Jobs/Offers cards: body inset | `$s2:16px` at <=767px, `$s3:24px` above (notifications:214-221) | `p-4 md:p-6` on both articles | Source match; mobile/tablet static only |
| Jobs/Offers cards: hover | `rgba(#26bac7,.25)` border, `0 2px 6px rgba(0,0,0,.06)` shadow, `0.2s ease` (notifications:189-194) | Both articles: `hover:border-[rgba(38,186,199,0.25)]`, `hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)]`, `duration-200` | Source-level analogue; default shadow and ease still require rendered comparison |
| Jobs/Offers controls | Legacy learner minimum touch 44px <=767px (notifications:10,88-90) | `max-md:min-h-11` on 10 drive + 11 offer shared `Button`s; destinations `min-h-11 md:min-h-9` | Breakpoint + min size source match |
| Jobs/Offers keyboard focus | `2px` teal, offset 2-3px (accessibility:19-38) | Shared `Button` focus ring; link focus styling; raw toggles now `Button variant="link"` | Source-level; runtime focus order unverified |
| Jobs/Offers layouts at 640-767px | Legacy mobile until <=767px (notifications:10,219) | `md:grid-cols-2/3`, `md:flex-row`, `md:p-6` (not Tailwind `sm` at 640px) | Breakpoint proof via classes, not screenshots |
| Job data overflow | Legacy row `min-width:0` and word wrapping (notifications:243-267) | Job article and grid `min-w-0`; company, job role, descriptions and metadata `break-words` | Static source match |
| Offers data overflow | Legacy row `min-width:0`, wrap long content (notifications:243-267) | Offer article/header/grid `min-w-0`, title/company/job `break-words` | Static source match |
| Alert list | Legacy `16px` row separation and hairline list structure (notifications:166-177) | `learner-placement-alerts.tsx:33-51`: `divide-y`, `py-4`, single continuous canvas | Structural match; exact list padding not asserted |
| Alert title | 16px/600 desktop; 14px <=767px; line-height 1.35 (notifications:258-275) | `learner-placement-alerts.tsx:37` `text-[14px] font-semibold leading-[1.35] md:text-[16px]` | Source match |
| Alert snippet | 14px, 1.5 line-height desktop; 13px <=767px (notifications:276-288, mobile overrides) | `learner-placement-alerts.tsx:41` `text-[13px] leading-[1.5] md:text-[14px]`; keeps full body text | Source match |
| Alert empty content | `min-height:180px`, padding 48px vertical/24px horizontal; centered (notifications:310-330) | `learner-placement-alerts.tsx:27`: `min-h-[180px] px-6 py-12 text-center` | Source match |
| Alert history link | Learner mobile target min-height 44px, desktop controls 36px (notifications:10,89) | `learner-placement-alerts.tsx:18`: `min-h-11 md:min-h-9` | Source match |

### Coverage scan (actual full-file text inspection of GitHub branch; not local shell grep)

The entire text of each target was fetched after the changes, scanned using literal-equivalent regular expressions. Counts:

| File | Raw button / input / select / textarea | Hardcoded 6-digit hex | Shared Button opens/closes | Shared Dialog opens/closes | Old `sm:min-h-9` + `max-sm:min-h-11` | Responsive target tokens |
|---|---|---|---|---|---|---|
| `learner-placement-jobs.tsx` | 0 / 0 / 0 / 0 | 0 | 10 / 10 | 3 / 3 | 0 | 14 |
| `learner-placement-offers.tsx` | 0 / 0 / 0 / 0 | 0 | 11 / 11 | 3 / 3 | 0 | 16 |
| `learner-placement-alerts.tsx` | 0 / 0 / 0 / 0 | 0 | 0 / 0 | 0 / 0 | 0 | 1 |

Reproduction on checkout (not run in this connector-only turn):
```bash
for f in src/components/placements/learner-placement-{jobs,offers,alerts}.tsx; do
  printf '%s\n' "$f"
  grep -En '<(button|input|select|textarea)([ >])|#[[:xdigit:]]{6}|max-sm:min-h-11|sm:min-h-9' "$f" || true
done
```

Responsive source proof: from viewport widths 320–767px the `max-md:min-h-11` and `min-h-11` utilities enforce 44px minimum on actions, one-column grids, 16px article padding and vertically stacked offer/alert headers. From 768px the `md:` utilities switch to 24px article padding, 36px destination links and multi-column information. The exact breakpoint corresponds to legacy `$learn-mobile-bp:767px`; no running browser / computed styles / snapshots were inspected. Reduced-motion is explicitly excluded from card transitions via `motion-reduce:transition-none`.

**Repeating pattern codemod:** `scripts/codemods/chat1-learner-placement-breakpoints.cjs` documents/applies the three-file 640→768 responsive conversion and is dry-run by default. Target files already contain the conversions; the script itself was not executed.

**Strict-tick decision:** keep LRN-04 open: these **three files are source-complete for the targeted visual elements**, but one global LRN-04 checklist item encompasses other uninspected learner components. Real phone/tablet screenshots, computed interactions, keyboard navigation and full all-files grep are still required. Do not claim pixel-level completion from static evidence alone.

**Exact next file:** `src/components/placements/learner-placement-journey.tsx`, then `src/components/placements/learner-placement-job-detail.tsx`.
