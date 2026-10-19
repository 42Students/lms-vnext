# Learner portal UI clone audit — chat-1

Base: `42Students/lms-vnext` `main` at `1fae38d2c433f5b5b0a90a22be12754ab28796e0` (2026-10-19). Branch: `chatgpt/chat-1-b`.

Scope: `src/app/(authenticated)/learn/**` except `courses/**` (chat-7), learner projects and `src/components/placements/learner-*`, `src/components/attendance/learner-*`. No shared UI, `legacy-skin.css`, shell or non-learner components edited.

## Work queue (GitHub directory inventory and targeted JSX inspection; exhaustive grep is pending)
- [ ] LRN-01: **source fix delivered** in `my-placements/{applications,jobs,placement,schedule}/page.tsx`: four `PageHeader`s, two preserved destination/action links and schedule shared `Tabs` (4 file commits, 2026-10-19). Existing `scripts/codemods/chat1-learner-page-headings.cjs` authored for repeatable 4-file migration; GitHub edits applied its planned JSX transformations without running Node. Strict tick blocked by computed title values, full markup grep and phone/tablet screenshot proof.
- [ ] LRN-02: **partial**: Announcements (8) and My offers (5) filter link instances now share exact learner SCSS pill dimensions, active/hover/focus selectors and 767px horizontal scroll rules; applied on 2026-10-19. Dynamic route checks, actual computed values and other placement routes remain. Remaining placement pages `my-placements/{announcements,assessments,calendar,interviews,notification-preferences,offers,preparation,rules,schedule,support}/page.tsx`, main `my-placements/page.tsx`: titles, tab order, filters, links, notices, single canvas.
- [ ] LRN-03: `src/components/placements/learner-{applications,jobs}-browse.tsx`: **partial**: removed hand-rolled `aria-pressed` controls in these two files; shared `SegmentedControl` uses native radio states with 44px min mobile target and `Tabs` supplies underline for application views. Verify keyboard, routing and remaining components before tick.
- [ ] LRN-04: `src/components/placements/learner-placements-tabs.tsx`, `learner-placements-dashboard.tsx`, `learner-placement-{jobs,offers,alerts}.tsx` and other `learner-*.tsx`: UI states and card-in-card / spacing / token pass.
- [ ] LRN-05: **partial**: `learn/attendance/page.tsx` and `learn/calendar/page.tsx` now put their existing action link in the same `PageHeader` row (2026-10-19); learner project detail already renders `PageHeader` for audit and invalid-board-filter states, while regular project workspace keeps its own header. `learn/{attendance,calendar,profile,projects,notifications,placements}/page.tsx` plus nested pages, `src/components/attendance/learner-attendance-workspace.tsx`: PageHeader, responsive titles and controls.
- [ ] LRN-06: `loading.tsx`/`error.tsx`/`not-found.tsx` in learner trees: shared UI, retry, mobile and tablet states.
- [ ] LRN-07: `allAssignments`, `allQuizzes`, `assignments`, `quizzes` potentially overlap chat-7's COURSES ownership. No edits before ownership check.

## Preliminary value evidence (all OPEN; no strict-tick claim)
| Property | Old LMS | vNext | Status |
|---|---|---|---|
| Listing title | `docs/design/legacy-styles/components___listing-page-header.scss:52-60`: 28px, weight 600, 1.3 line-height | `src/components/ui/page-header.tsx:28-37`: desktop 30px, weight 600 | Open: legacy TPO page header vs learner listing reference differ; do not edit shared component |
| Mobile title | `docs/design/legacy-styles/components___listing-page-header.scss:131-143`: 20px title and stacked layout | `src/components/ui/page-header.tsx:21-29`: stacked mobile with 20px | Open: visual + computed-value comparison missing |
| Learner mobile spacing | `docs/design/legacy-styles/components___learn-layout.scss:152-163`: 16px mobile / 24px desktop content inset | `src/components/ui/page-canvas.tsx`: global owner; not yet inspected | Open: avoid double padding |
| Notice filter touch height | `docs/design/legacy-styles/components___learn-notifications.scss:82-109`: min-height 44px, teal active state | `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:119-139`: filter links use min-height 36px | Open: candidate mismatch pending per-state comparison |

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
- Updated: `learn/my-placements/{applications,jobs,placement,schedule,announcements,offers}/page.tsx` and `learn/{attendance,calendar}/page.tsx` (8 files). No shared UI or shell or `legacy-skin.css` edited. No course files edited.
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

**Next file:** `src/components/placements/learner-placements-tabs.tsx`, then `src/components/placements/learner-placements-dashboard.tsx` (LRN-04).
