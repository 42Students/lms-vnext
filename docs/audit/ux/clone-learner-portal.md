# Learner portal UI clone audit — chat-1

Base: `42Students/lms-vnext` `main` at `1fae38d2c433f5b5b0a90a22be12754ab28796e0` (2026-10-19). Branch: `chatgpt/chat-1-b`.

Scope: `src/app/(authenticated)/learn/**` except `courses/**` (chat-7), learner projects and `src/components/placements/learner-*`, `src/components/attendance/learner-*`. No shared UI, `legacy-skin.css`, shell or non-learner components edited.

## Work queue (GitHub directory inventory and targeted JSX inspection; exhaustive grep is pending)
- [ ] LRN-01: **source fix delivered** in `my-placements/{applications,jobs,placement,schedule}/page.tsx`: four `PageHeader`s, two preserved destination/action links and schedule shared `Tabs` (4 file commits, 2026-10-19). Existing `scripts/codemods/chat1-learner-page-headings.cjs` authored for repeatable 4-file migration; GitHub edits applied its planned JSX transformations without running Node. Strict tick blocked by computed title values, full markup grep and phone/tablet screenshot proof.
- [ ] LRN-02: **partial**: Announcements (8) and My offers (5) filter link instances now share exact learner SCSS pill dimensions, active/hover/focus selectors and 767px horizontal scroll rules; applied on 2026-10-19. Dynamic route checks, actual computed values and other placement routes remain. Remaining placement pages `my-placements/{announcements,assessments,calendar,interviews,notification-preferences,offers,preparation,rules,schedule,support}/page.tsx`, main `my-placements/page.tsx`: titles, tab order, filters, links, notices, single canvas.
- [ ] LRN-03: **source pass completed** in `src/components/placements/learner-{applications,jobs}-browse.tsx`: shared Tabs (application views), SegmentedControl (saved drives, availability, screening), native shared Input/Select, zero raw controls, 767px responsive filters, 44px phone targets and legacy empty states; value/coverage table below. Remains open until rendered phone/tablet, keyboard, dynamic URL and all related learner components are verified.
- [ ] LRN-04: **source form pass completed** in `learner-placement-academic-evidence.tsx` and `learner-placement-requests.tsx`: 3 number inputs + 1 checkbox + 2 request textareas migrated to shared controls; 3 selects and 4 Buttons retained and mobile heights corrected. `learner-career-calendar.tsx` event details now uses shared Button; its per-day grid button is an explicit layout exception. Prior learner component fixes and additional remaining learners detailed below. Missing: all-files coverage, computed value/interaction proof, side-by-side screenshots.
- [ ] LRN-05: **partial**: `learn/attendance/page.tsx` and `learn/calendar/page.tsx` now put their existing action link in the same `PageHeader` row (2026-10-19); learner project detail already renders `PageHeader` for audit and invalid-board-filter states, while regular project workspace keeps its own header. `learn/{attendance,calendar,profile,projects,notifications,placements}/page.tsx` plus nested pages, `src/components/attendance/learner-attendance-workspace.tsx`: PageHeader, responsive titles and controls.
- [ ] LRN-06: **source pass** for six learner route error files (attendance, calendar, profile, projects, notifications, my-placements): single-canvas left alignment, preserved retry action, 44px phone targets, no raw controls. Generic parent and nested states already use shared graceful loading/error components. Remains open: exhaustive nested state inventory, rendered loading/retry and phone/tablet proof.
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

**Next file after this sweep:** `src/components/placements/learner-placement-academic-evidence.tsx` (raw dynamic fields requiring a codemod), then `src/components/placements/learner-placement-requests.tsx`.

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

**Exact next file:** `src/components/placements/learner-placement-academic-evidence.tsx`, then `src/components/placements/learner-placement-requests.tsx`.

### Post-batch branch synchronization

Branch `chatgpt/chat-1-b` was reapplied onto `main` at `2808e32a641e1e35f513755b840b6ef892c61163` using a force-with-lease update followed by individual source-file commits (GitHub connector equivalent of replaying own changes). At verification: **5 ahead, 0 behind**; only this audit, the lane-owned breakpoint codemod, and the three learner placement components differ from main. The previous learner page/header sweep was already integrated on main by the orchestrator, so it was deliberately not rewritten.

The three new components remain **source-complete, not screenshot-verified**; LRN-04 global remains unticked. No application, tests, parser, browser or CI executed by chat-1.

## Replacement chat-1 learner sweep — source proof ledger (2026-10-19)

**File-level source pass:** 29 assigned learner files inspected and updated; 28 have zero raw controls in the measured files. **NOT a strict checked/ticked LRN-02/04/05 completion.** The two source-preserved calendar grid/event detail `<button>` instances use dynamic CSS-module classes and require a judgement-case codemod (shared-control owner must approve), so the calendar is explicitly partial. Dynamic academic evidence and placement-requests controls are still queued. No pages from `learn/courses/**`, no global skin, shell or `src/components/ui/**` were changed.

### Cross-file value table (source-exact where noted)

| Visual dimension | Legacy value and citation | vNext source and comparison | Status |
|---|---|---|---|
| Learner mobile cutoff | `components___learn-notifications.scss:9-10`: $learn-mobile-bp = 767px | `md:` / `max-md:` applied to the audited layouts; phone widths 320–767px remain mobile; 768px+ tablet/desktop switches | Source match |
| Controls hit height | `components___learn-notifications.scss:10,82-98`: 44px minimum on phone | `min-h-11` or `max-md:min-h-11`; actions move to 36px via `md:min-h-9` when appropriate. Shared Button keeps existing props/behaviour | Source match for controls explicitly touched; other controls await full audit |
| Continuous canvas | `old-lms-pages.md:5-13`: one white canvas, hairline dividers, no per-section cards for ordinary content | `learner-placement-job-detail.tsx`, `learner-recent-placement-activity.tsx`, `learner-attendance-workspace.tsx`: content sections now have `border-b border-border` rather than redundant outer cards; true stat tiles remain separate | Source match structurally |
| Neutral borders | `components___variables.scss:34-40` $neutral-200 = #e5e9f0; `old-lms-shell-spec.md:27` 1px border | `border border-border` for genuinely separate cards, `border-b border-border` for sections | Source token match, computed CSS not inspected |
| Card corners | `components___learn-notifications.scss:22,184-189`: radius 12px | `rounded-xl` on independently bordered job, offer, application cards; ordinary content sections flattened | Source token match |
| Card inside padding | `components___learn-notifications.scss:210-221`: mobile 16px, wider 24px | job and offer articles `p-4 md:p-6`, journey article `p-4 md:p-6`; detail cards flattened | Source match |
| Text wrapping | `components___learn-notifications.scss:241-275`: flex content min-width 0, text wraps, mobile titles 14px/desktop 16px | `learner-placement-journey.tsx`, job detail/alerts and recent activity apply `min-w-0` and `break-words`; alert title retains `text-[14px] md:text-[16px]` | Source match where applied |
| Horizontal layout | `components___learn-notifications.scss:50-74`: wrap desktop, 767px mobile horizontal scrolling for pills | Announcements and Offers `placementFilterNavClass`: `flex-nowrap overflow-x-auto` mobile, `md:flex-wrap md:overflow-visible` tablet/desktop | Source match |
| Focus | `components___accessibility.scss:19-38`: 2px teal ring, 2-3px offset | Dynamic action switches use shared `Button`; journey link explicitly has 2px teal focus-visible outline + 2px offset; status labels retain semantics | Source-level; keyboard flow not exercised |
| Alerts empty state | `components___learn-notifications.scss:304-330`: centered, 180px minimum, 48px block/24px inline padding | `learner-placement-alerts.tsx` previously changed to `min-h-[180px] px-6 py-12`; calendar agenda likewise `min-h-[180px] px-6 py-12` | Source match |
| Alert/snippet typography | `components___learn-notifications.scss:258-287`: 14/16px responsive title, 13/14px responsive text, 1.5 line-height | `learner-placement-alerts.tsx`: `text-[14px] md:text-[16px]` title and `text-[13px] md:text-[14px]` snippet | Source match |
| Motion sensitivity | `components___learn-layout.scss:85-128` + `components___accessibility.scss:113+`: transform only genuine cards and reduced-motion disables transition | Journey link hover transition `motion-reduce:transition-none`; shared components own focus/motion; no extra page-level animations introduced | Partial; live reduced-motion unverified |
| Save / confirm / retry interactions | Existing learner service actions and toast/dialog/disabled states, no legacy-specific change to records | `learner-save-drive-button.tsx`, `learner-round-confirm-attendance.tsx`, `learner-placement-partial-alert.tsx` gain mobile height only; original API actions preserved | Source-level no-regression only |

### Full-file static regex inventory for this batch

Each file was fetched in full from `chatgpt/chat-1-b` after edits and inspected using source-text regex counts. This is **equivalent to a per-file grep, not a claim to have run shell grep or an app**.

| Owned file (prefix `src/components/` for placements, attendance; otherwise `src/app/(authenticated)/`) | Raw controls | Six-digit hex | Old 640px `sm:` target usages | 44px target tokens | `md:` tokens | Shared Button tag balance |
|---|---:|---:|---:|---:|---:|---|
| `placements/learner-placement-journey.tsx` | 0 | 0 | 0 | 9 | 18 | 0/0 |
| `placements/learner-placement-job-detail.tsx` | 0 | 0 | 0 | 8 | 22 | 0/0 |
| `placements/learner-placement-alert-action.tsx` | 0 | 0 | 0 | 2 | 2 | 1/1 |
| `placements/learner-schedule-reschedule.tsx` | 0 | 0 | 0 | 6 | 6 | 2/2 |
| `placements/learner-recent-placement-activity.tsx` | 0 | 0 | 0 | 2 | 7 | 0/0 |
| `placements/learner-placement-partial-alert.tsx` | 0 | 0 | 0 | 1 | 2 | 1/1 |
| `placements/learner-round-confirm-attendance.tsx` | 0 | 0 | 0 | 1 | 1 | 1/1 |
| `placements/learner-save-drive-button.tsx` | 0 | 0 | 0 | 1 | 1 | 1/1 |
| `placements/learner-placement-registration.tsx` | 0 | 0 | 0 | 3 | 1 | 1/1 |
| `placements/learner-placement-preferences.tsx` | 0 | 0 | 0 | 5 | 2 | 1/1 |
| `attendance/learner-attendance-workspace.tsx` | 0 | 0 | 0 | 9 | 18 | 5/5 |
| `placements/learner-career-calendar.tsx` | 2 | 0 | 0 | 10 | 14 | 7/7 |
| `learn/attendance/calendar/page.tsx` | 0 | 0 | 0 | 8 | 16 | 1/1 |
| `learn/my-placements/support/page.tsx` | 0 | 0 | 0 | 5 | 7 | 0/0 |
| `learn/my-placements/preparation/page.tsx` | 0 | 0 | 0 | 2 | 3 | 0/0 |
| `learn/my-placements/assessments/page.tsx` | 0 | 0 | 0 | 1 | 1 | 0/0 |
| `learn/my-placements/rules/page.tsx` | 0 | 0 | 0 | 5 | 9 | 0/0 |
| `learn/my-placements/placement/page.tsx` | 0 | 0 | 0 | 5 | 5 | 0/0 |
| `learn/my-placements/schedule/page.tsx` | 0 | 0 | 0 | 1 | 1 | 0/0 |
| `learn/my-placements/offers/page.tsx` | 0 | 0 | 0 | 15 | 17 | 2/2 |
| `learn/my-placements/announcements/page.tsx` | 0 | 0 | 0 | 17 | 18 | 3/3 |
| `learn/my-placements/jobs/page.tsx` | 0 | 0 | 0 | 1 | 1 | 0/0 |
| `learn/my-placements/applications/page.tsx` | 0 | 0 | 0 | 1 | 1 | 0/0 |
| `learn/profile/page.tsx` | 0 | 0 | 0 | 6 | 2 | 0/0 |
| `learn/attendance/page.tsx` | 0 | 0 | 0 | 1 | 1 | 0/0 |
| `learn/calendar/page.tsx` | 0 | 0 | 0 | 1 | 1 | 0/0 |
| `learn/projects/page.tsx` | 0 | 0 | 0 | 1 | 2 | 0/0 |
| `learn/profile/academic-record/page.tsx` | 0 | 0 | 0 | 1 | 1 | 0/0 |
| `learn/profile/completeness/page.tsx` | 0 | 0 | 0 | 2 | 1 | 0/0 |

Source scan patterns: raw `/<(button|input|select|textarea)(?=\\s|>)/g`; hex `/#[0-9a-f]{6}\\b/gi`; old breakpoint `/\\bsm:(min-h-9|grid-cols-2|grid-cols-3|p-5|p-6|flex-row|items-start)\\b/g`; shared Button opening `/<Button(?=\\s|>)/g` versus `/<\\/Button>/g`. Re-run locally for full-tree coverage (NOT run):
```bash
grep -RInE '<(button|input|select|textarea)([ >])|#[[:xdigit:]]{6}|sm:(min-h-9|grid-cols-2|p-6)' \
  'src/app/(authenticated)/learn' src/components/placements/learner-* src/components/attendance/learner-* --include='*.tsx'
```
**Known exceptions:** `learner-career-calendar.tsx:238,344` has two legacy raw buttons (dynamic calendar cells and event details; left intact, not accidentally broken); `learner-placement-academic-evidence.tsx:260,279,297,316` has four raw inputs/checkbox, not edited in this sweep; `learner-placement-requests.tsx` requires its separate judgement-case audit. Do not declare full-tree zero instances.

### Responsive proof (source rules, no browser assertions)

- **Phone (320–639px)**: `max-md:min-h-11` on learner shared action buttons, 44px target links, single-column data sections, horizontally scrollable selected filters, 16px card padding, wrapped strings.
- **Small tablet / large phone (640–767px)**: intentionally **same mobile state**, correcting previous Tailwind `sm:` misuse; user can still reach filters via overflow scroll. Calendar grid keeps its explicitly authored mobile/desktop division.
- **Tablet (768–1023px)**: `md:grid-cols-2`, wrapped pills, 24px card padding, buttons follow desktop control heights; true split-detail panes remain `lg:` at 1024px.
- **Desktop (1024px+)**: `lg:` and `xl:` multi-column content, continuous main canvas, separate actual record cards.

The source-level comparison is documented; **no browser, computed style, screenshots, TypeScript checker, codemod runner or CI was executed**. Page-by-page pixel comparison, live keyboard focus, dynamic dropdown positioning, loading/error interactions and global zero-instance checks remain a blocker to checking LRN-02/04/05. Per strict tick rule, keep all seven high-level queue checkboxes unticked until the separate verification evidence exists.

### Repeating-pattern codemod (not executed here)

`scripts/codemods/chat1-learner-page-responsive.cjs`: dry-run by default; explicitly scoped to 11 chat-1 learner pages, parses generated TSX, normalizes 767px cutoff, deduplicates `md:min-h-9` and protects courses. Source edits were applied directly to those pages through GitHub file commits; the script documents the repeated transformation for orchestrator replay.

**Next file in LRN-04:** `src/components/placements/learner-placement-academic-evidence.tsx`; then `src/components/placements/learner-placement-requests.tsx` and `src/components/attendance/learner-attendance-workspace.tsx` remaining interactive refinements.

### Post-sweep branch replay verified

On 2026-10-19, replayed only the **29 paths in this lane's source diff** onto current `main` commit `68d52934a61acdeeda3b4c68804550b86607a5ea` with a force-with-lease ref update followed by scoped [chat-1] file commits. Immediately afterward, GitHub compare reported **29 ahead, 0 behind, 29 changed paths**; no updates to `main`, courses, shared UI, global skin, or shell. Source-level proof only; strict LRN checkboxes remain open.

## Learner dynamic forms and error states — additional chat-1 source audit (2026-10-19)

### Source-completed files
- `src/components/placements/learner-placement-academic-evidence.tsx`: preserved `FormData` keys, numeric min/max/step, default values, lateral-entry conditional field, `VERIFIED` disabled state, pending guard and success/error toast; native dynamic inputs moved to 3 shared `Input` instances and one shared `Checkbox`. Sources: vNext lines 7-12, 27, 175-345 after replacement; legacy `components___form.scss:111-144` and `components___learn-notifications.scss:9-10`.
- `src/components/placements/learner-placement-requests.tsx`: request modes, 3 selects, 3 Inputs, 2 controlled reason Textareas, 3 Buttons, pending/cancel flow and in-app toast preserved. Source: lines 1-14, 369-600, 610-690; legacy `components___form.scss:117-143`.
- `src/components/placements/learner-career-calendar.tsx`: detail event action uses shared `Button variant="link"`. One per-day calendar grid button intentionally remains raw; CSS module `learner-career-calendar.module.css:187-206` defines critical 116px square/day flow, right-aligned date and 2px inset focus; changing to shared inline-flex defaults without rendered verification could break grid. This is a **documented exception, not a strict tick**.
- Learner errors: `learn/{attendance,calendar,profile,projects,notifications,my-placements}/error.tsx` each uses one PageHeader, retry Button and natural left-aligned spacing within the authenticated shell. Unchanged message semantics, error/empty separation and route reset handling.

### Value proof: legacy SCSS versus vNext (static)

| Property | Legacy source value | Current scoped source value | Match classification |
|---|---|---|---|
| Form body font | `components___form.scss:117-143`: 14px/400/20px, tracking .2px, #0a0517 | `src/components/ui/input.tsx:16-25` and `textarea.tsx:16-25` already own typography; learner academic uses `Input`, requests uses `Textarea` | Shared source implementation |
| Input bg | `components___form.scss:119-121`: $grayCFD #fbfcfd | Shared `Input` uses `--lms-form-bg`; local surface override removed | Token comparison; computed CSS unverified |
| Focus state | `components___form.scss:128-133`: 2px teal 15% shadow; `components___accessibility.scss:19-38`: 2px teal outline | Shared Input/Textarea and Checkbox focus-visible halo, outline and tokens. No local `outline-none` override | Source-level alignment, keyboard visual proof outstanding |
| Disabled/verified | `components___variables.scss:34-43`: muted neutral-400 and 50 backdrop; checkbox disabled state | Academic `disabled={locked}` preserved; `Checkbox` own disabled, input disabled palette from shared UI | Source match; screenshot outstanding |
| Default controls | `components___variables.scss` + `components___learn-notifications.scss:9-10`: <=767px 44px tap target | Academic input class `min-h-11 md:min-h-9`; requests 3 Inputs + 3 Selects `min-h-11 md:min-h-9`, 3 Buttons `max-md:min-h-11` | 44px mobile / 36px 768+ source proof |
| Reason multiline | `components___form.scss:117-143`: rounded 10px, pale input bg, focus halo, multiline height governed by form | Requests shared Textarea `min-h-[112px]` with `min-h-28`; preserves controlled reason | Source match for field chrome; exact legacy per-field height not specified |
| Form grid | `components___learn-notifications.scss:9-10,214-221`: <=767px mobile, 768+ width breakpoint | Academic `md:grid-cols-2 lg:grid-cols-4`; request `md:grid-cols-2` ; 1 column until 767px | Source match |
| Alert/error shell | `old-lms-pages.md:5-13`: one white page canvas, hairline spacing, title left with body/actions | Six route errors: `min-w-0 space-y-4`, one `PageHeader`, left body, `flex-wrap items-center gap-3`; calendar no longer adds centered 40px vertical inset | Structural source match |
| Retry actions | `components___learn-notifications.scss:9-10,88-90`: 44px phone; shared Button desktop 36px | 6 route errors retain `reset` callback with `max-md:min-h-11` or `min-h-11`, normal desktop skin | Source match, click not executed |
| Motion | `components___accessibility.scss:113-129`: motion reduced per user pref | Shared controls already use `motion-reduce:transition-none`, no new motion in these pages | Source support, visual check open |

### Per-file source grep-style proof (fetched full text after writes, not shell execution)

| File | Raw HTML controls | 6-digit hex literals | Old `sm:` form/layout classes | Shared controls / PageHeader | Balanced JSX evidence |
|---|---:|---:|---:|---|---|
| `learner-placement-academic-evidence.tsx` | 0 | 0 | 0 | 3 Input / 1 Checkbox / 1 Button | 1 section pair, 1 Button pair |
| `learner-placement-requests.tsx` | 0 | 0 | 0 | 3 Input / 3 Select / 2 Textarea / 3 Button | 1 section pair, 3 Button pairs |
| `learner-career-calendar.tsx` | **1 exempt day button** | 0 | 0 | 1 Input / 8 Button | 6 section pairs, 8 Button pairs |
| `learn/attendance/error.tsx` | 0 | 0 | 0 | 1 PageHeader / 1 Button | 1 section pair, 1 Button pair |
| `learn/calendar/error.tsx` | 0 | 0 | 0 | 1 PageHeader / 1 Button | 1 section pair, 1 Button pair |
| `learn/profile/error.tsx` | 0 | 0 | 0 | 1 PageHeader / 1 Button | 1 section pair, 1 Button pair |
| `learn/projects/error.tsx` | 0 | 0 | 0 | 1 PageHeader / 1 Button | 1 section pair, 1 Button pair |
| `learn/notifications/error.tsx` | 0 | 0 | 0 | 1 PageHeader / 1 Button | 1 section pair, 1 Button pair |
| `learn/my-placements/error.tsx` | 0 | 0 | 0 | 1 PageHeader / 1 Button | 1 section pair, 1 Button pair |

Regex used on full GitHub-file content (not local executable output): `/<(button|input|select|textarea)(?=\\s|>)/g`, `/#[0-9a-f]{6}\\b/gi`, `/\\bsm:(min-h-9|grid-cols-2|flex-row|p-5|p-6|items-start|justify-between)\\b/g`, `/<Button(?=\\s|>)/g`, `/<\\/Button>/g`. Text control counts include only actual TSX markup, not underlying shared components.

Repro commands for workstation/orchestrator (not run by this lane):
```bash
grep -nE '<(button|input|select|textarea)([[:space:]>])' \
  src/components/placements/learner-placement-{academic-evidence,requests,career-calendar}.tsx
grep -nE 'sm:(min-h-9|grid-cols-2|flex-row|p-6)' \
  src/components/placements/learner-placement-{academic-evidence,requests,career-calendar}.tsx
```

Responsive proof from class rules: at **375px** academic fields and request controls stack, hit targets >=44px, reason textareas span full width; at **700px** same mobile layout because `md:` activates only at 768px; at **768px** academic evidence changes to two columns and form controls may use 36px desktop height; at **1024px** academic evidence becomes four columns and request columns retain the `xl:` two-panel layout until >=1280px. Error screens remain one column, action rows wrap and no extra centered content-box inside the existing LMS page canvas. No browser screenshots/real DOM measurements, keyboard traversal, route reset clicks, or CI have been run.

### Repeatable migration scripts

`scripts/codemods/chat1-learner-dynamic-form-controls.cjs` guards source transitions for the two exceptional forms. `scripts/codemods/chat1-learner-error-shell.cjs` scopes the six error states; both dry-run by default and parse TSX before applying. Neither executed (build lane dev-only, no run). Existing scripts for other modules remain untouched.

**Strict-tick status:** LRN-04 and LRN-06 still **OPEN**, despite completed source-level files, because complete coverage and rendered/state verification have not been established. Do not tick only based on source-scoped regex.

**Exact next:** `src/components/placements/learner-jobs-browse.tsx`, then `src/components/placements/learner-applications-browse.tsx` (LRN-03).

## LRN-03 — learner jobs and applications browse source parity (2026-10-19)

Changed: `src/components/placements/learner-jobs-browse.tsx` and `learner-applications-browse.tsx`. No changes to model, URL serialization, API requests, CSV, dialog, toast, pagination, or shared UI. Route links and all filter values preserved.

| Value | Legacy reference | vNext evidence | Result |
|---|---|---|---|
| Filter dimensions | `components___learn-notifications.scss:88-99` 14px / 500, 44px minimum touch | Existing shared `SegmentedControl` and `Tabs` used; touched clear/reset and mobile controls `min-h-11` | Source component/height match; computed styles unverified |
| Mobile breakpoint | `components___learn-notifications.scss:9-10,56-74` <=767px mobile | Toggle `md:hidden`, filter body `md:block`, grids `md:grid-cols-2/3`; 640–767px remains mobile | Source breakpoint match |
| Form elements | `components___form.scss:117-143` 14px, 20px line-height, pale form bg and focus halo | Both components render shared `Input`, `Select`, and existing segmented/tabs components | Matches shared token implementation |
| Summary/empty cards | `components___learn-notifications.scss:304-330` rich empty min 180px, centered, 48px vertical, 24px horizontal | Jobs saved/filtered and Applications filtered empty: `min-h-[180px] px-6 py-12 text-center`; true summary strip has border-bottom not nested wrapper | Structural source match |
| Data and labels | Existing vNext content is authoritative (owner goal; no page-content clone) | Query filters, counts, CSV export, saved/open state, screening timeline, withdrawal and pagination unchanged | Source-level regression review only |
| Responsive links | `components___learn-notifications.scss:9-10,88-90` >=44px touch on mobile | Links and controls `min-h-11` phone, `md:min-h-9` when wider; no `min-h-10` in the audited files | Source match |
| Focus/disabled | `components___accessibility.scss:19-38`; shared component focus/disabled styles | All buttons and selection controls are shared; Drawer and Dialog retained for selected applications | Source component match; not keyboard tested |

Per-file **full-source regex counts** from a read of current GitHub branch:

| File | Raw button/input/select/textarea | Hardcoded 6-digit hex | Deprecated `sm:` mobile tokens | Shared Buttons (open/close) | Controls | Responsive markers |
|---|---:|---:|---:|---:|---|---|
| `learner-jobs-browse.tsx` (299 lines) | 0 | 0 | 0 | 5/5 | 2 SegmentedControl, 1 Input, 3 Select | 12 `min-h-11`, 13 `md:` |
| `learner-applications-browse.tsx` (571 lines) | 0 | 0 | 0 | 11/11 | 1 Tabs, 1 SegmentedControl, 1 Input, 2 Select | 18 `min-h-11`, 25 `md:` |

Source matching: `/<(button|input|select|textarea)(?=\\s|>)/g`, `/#[0-9a-f]{6}\\b/gi`, `/\\bsm:(min-h-9|hidden|block|grid-cols-2|grid-cols-3|w-auto|col-span-2)\\b/g`. Both filter toggles have one `md:hidden` and one `md:block`. Repro checkout grep (NOT run):
```bash
grep -En '<(button|input|select|textarea)([ >])|#[[:xdigit:]]{6}|sm:(min-h-9|hidden|block|grid-cols-2|grid-cols-3)' \
 src/components/placements/learner-{jobs,applications}-browse.tsx
```
At 375 and 700px, filter blocks start collapsed and can open with a 44px tap target; at 768px the toggle disappears, filter grid displays with 2/3 columns, controls may use 36px minimum. Large information remains in the one page canvas. These are source-class implications, **not screenshots/interaction tests**. LRN-03 remains open as strict requires live validation.

**Next file:** `src/components/placements/learner-placement-academic-evidence.tsx` is source-completed, then `src/components/placements/learner-placement-requests.tsx` source-completed; inspect `src/components/placements/learner-career-calendar.module.css` together with the exempt day button in `learner-career-calendar.tsx` for pixel-level calendar parity, then `learn/my-placements/jobs/[jobId]/page.tsx`.

## Nested application and support action parity — chat-1 (2026-10-19)

Updated the **five files** `learn/my-placements/applications/[applicationId]/{page.tsx,error.tsx,company/page.tsx}`, `components/placements/learner-application-detail-withdraw.tsx`, `learner-support-cancel.tsx`. Preserved server-only app/offer statuses, company disclosure boundaries, validation, optimistic token cancellation, controlled reason, all existing links/dialogs and action methods.

| Legacy dimension | Expected legacy value/reference | Audited vNext value | Static outcome |
|---|---|---|---|
| Nested page headings | `old-lms-pages.md:5-13` single canvas, one PageHeader, left title/action | Both pages and nested error each have exactly 1 shared PageHeader; no added page wrapper/card | Source match |
| Hairlines | `components___variables.scss:34-40` 1px neutral-200, white continuous body | Nested sections keep `border-b border-border` and existing data section order | Source token match |
| Mobile link heights | `components___learn-notifications.scss:9-10,82-98` 44px <=767px | Back, company and error actions `min-h-11 md:min-h-9` | Source match |
| Responsive vertical rhythm | `components___learn-layout.scss:152-163` phone padding/stack, 768px cutoff | Sections `py-4 md:py-6`, Company details `md:grid-cols-2`; error screen `min-w-0 space-y-4` | Source match |
| Withdrawal / cancellation controls | `components___variables.scss` and shared `Button` chrome 36px desktop / 44px mobile touch | Both action components: 3 `Button`s each with `max-md:min-h-11`; existing disabled/pending state preserved | Source match; behavior untested |
| Withdrawal reason input | `components___form.scss:117-143` 14px / 400 / 20px / pale input, radius10, 2px teal focus | `learner-application-detail-withdraw.tsx` now uses shared `Textarea` without local `bg-surface` / focus overrides, `min-h-28` | Source component match |

Static complete-file counts after writes:

| File | Raw HTML controls | Hex literals | Deprecated 640px utility | PageHeader | Shared Buttons | Touch 44px tokens |
|---|---:|---:|---:|---:|---:|---:|
| Application detail (71 lines) | 0 | 0 | 0 | 1 | 0/0 | 2 |
| Read-only company (95 lines) | 0 | 0 | 0 | 1 | 0/0 | 1 |
| Application error (16 lines) | 0 | 0 | 0 | 1 | 1/1 | 2 |
| Withdrawal dialog (57 lines) | 0 | 0 | 0 | — | 3/3 | 3 |
| Support cancellation dialog (54 lines) | 0 | 0 | 0 | — | 3/3 | 3 |

Source regex: raw `/<(button|input|select|textarea)(?=\\s|>)/g`; hex `/#[0-9a-f]{6}\\b/gi`; deprecated utility `/\\bsm:(min-h-9|grid-cols-2|py-6)\\b/g`; `<Button` and `</Button>` counts. This scan was performed on **full GitHub file contents**; no local grep, app execution or CI.

Responsive proof by source: at **375px and 700px**, all action targets are at least 44px and nested sections stack, without center-justified error text; at **768px**, 24px section padding, two-column public company facts and desktop link heights apply; at **1024px**, placement app keeps continuous LMS canvas. Rendered phone/tablet, focused/error/disabled screenshots and real withdrawal click flows not executed, so strict LRN-02/04/06 still open.

**Exact next file:** `src/components/placements/learner-career-calendar.module.css` (resolve source-exempt calendar-day button and palette/rhythm), then the remaining nested learner placement `loading.tsx` / `error.tsx` source inventory.

## Career calendar CSS token reconciliation — chat-1

`src/components/placements/learner-career-calendar.module.css` is now mapped to existing globally defined, exact-value legacy tokens for **53 occurrences** across canonical white, neutral, teal and success-text values (source changes only; no altered computed colours when `:root` variables are active). `learner-career-calendar.tsx` still retains the single intentional raw per-day calendar cell button with dynamic CSS-module classes and special `!important` focus/layout overrides; it is explicitly exempted pending rendered grid verification.

| Original literal | Legacy variable and value | vNext reference | Replacements |
|---|---|---|---:|
| `#fff` | `components___variables.scss:20-50` white | `var(--lms-white)` | 8 |
| `#e5e9f0` | `$neutral-200` 1px borders | `var(--lms-neutral-200)` | 9 |
| `#1a1d21` | `$neutral-900` text | `var(--lms-neutral-900)` | 3 |
| `#6b7280` | `$neutral-500` text | `var(--lms-neutral-500)` | 1 |
| `#26bac7` | `$clrThird` interactive teal | `var(--lms-primary)` | 6 |
| `#0e7c87` | global deep teal | `var(--lms-teal-deep)` | 6 |
| `#1e9aa8` | `$teal-dark` hover | `var(--lms-primary-hover)` | 2 |
| `#54505d` | `$neutral-700` body | `var(--lms-neutral-700)` | 4 |
| `#eff8fa` | `$teal-subtle` | `var(--lms-primary-subtle)` | 5 |
| `#1a95a1` | `$teal-text` | `var(--lms-primary-text)` | 2 |
| `#fafbfc` | `$neutral-50` | `var(--lms-neutral-50)` | 2 |
| `#d6dbe3` | `$neutral-300` | `var(--lms-neutral-300)` | 2 |
| `#f1f4f9` | `$neutral-100` | `var(--lms-neutral-100)` | 1 |
| `#065f46` | status success text | `var(--lms-success-text)` | 2 |

**Semantic exceptions (22 remaining literal occurrences):** `#047857`, `#1d4ed8`, `#1e40af`, `#334155`, `#475569`, `#e6f4ff`, `#ecfdf5`, `#f1f5f9`. These currently carry assessment/interview/other-round distinctions; changing them to unrelated brand tokens without the old LMS counterpart would be a visual regression. Grep on the full fetched CSS after replacement: `/#[0-9a-f]{3,8}\\b/gi` → 22; canonical literals listed above → 0. Do not tick colour coverage.

**Responsive source proof:** calendar module `@media(max-width:767px)` and `@media(min-width:768px)` are unchanged; 44px controls under 768px, 20px heading under 768px, 116px calendar-day grid cells, 2px deep-teal inset focus, 150/200ms transitions and `prefers-reduced-motion:reduce` remain. This is layout-rule inspection, not a phone screenshot. The per-day grid button is exempt only because shared inline-flex Button chrome would change its complex child flow; `learner-career-calendar.module.css:187-206` documents the dimension-sensitive native button.

**Next file:** `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx` (source inventory and missing nested loading/error parity), followed by `src/components/placements/learner-placement-job-detail.tsx` computed-style review. No builds, screenshot runner or CI were executed by this lane.

## Nested jobs, learner placement home, verification, and dashboard — 2026-10-20 source evidence

This batch makes targeted pixel-clone **source** updates to **nine** scoped files (two nested `loading.tsx` included; nested job error already existed). It does **not** change placement records, access checks, active jobs, learner project scopes, API calls or existing business decisions.

### Legacy value comparison

| Property / UI state | Legacy source and exact value | vNext file and source value | Status |
|---|---|---|---|
| Page head | `old-lms-pages.md:5-13` / `old-lms-shell-spec.md`: one white canvas; one page title + optional right actions, no extra eyebrow | `learner-placement-job-detail.tsx` removes `eyebrow="Published campus drive"`; historical-only `jobs/[jobId]/page.tsx` receives a conditional single `PageHeader`, but regular detail retains its existing PageHeader | Source structure match; rendered titles not measured |
| Drive action primary | `components___variables.scss:44+`: button solid #0a7c88, hover #086873, 36px desktop / 44px touch on mobile | `learner-placement-job-detail.tsx`: `--lms-button-primary`, `--lms-button-primary-hover`, `min-h-11 md:min-h-9` | Exact source tokens |
| Focus | `components___accessibility.scss:19-38`: teal 2px outline, 2px offset | Drive internal/external anchors `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]` | Exact outline source; keyboard visual unverified |
| Link hover & motion | `components___learn-notifications.scss:88-124`: teal hover, 150ms ease and focus treatment | Drive actions `transition-colors duration-150`, primary hover token, `motion-reduce:transition-none` | Source match |
| Mobile page breakpoint | `components___learn-notifications.scss:9-10`: 767px max mobile | Placement home, dashboard and verification page use `md:` rather than Tailwind `sm:`; 640–767px stays phone layout | Source match |
| Touch size | `components___learn-notifications.scss:88-99`: minimum 44px <=767px | Placement home: 11 `min-h-11` values; dashboard: 13; detail: 8; historical journey: 2; error: 2 | Source matches target sizes; parent constraints unmeasured |
| Section canvas | `old-lms-pages.md:5-13`: avoid card-inside-card; hairline separators, white canvas | Placement home verification/notices and dashboard functional sections use `border-b border-border` instead of redundant nested card wrappers | Structural source match |
| Block alerts | `components___learn-notifications.scss` warnings use slim pale tint rather than large white tile | Placement debar cue now `border-l-2 border-warning bg-warning-subtle p-4 md:p-5`; historic closed/cancelled notice uses pale status inset | Source match, computed shade unverified |
| Responsive card spacing | `components___learn-notifications.scss:210-221`: 16px mobile, 24px >=768px | Verification Education/Identity panels `p-4 md:p-6`; dashboard lead panel `p-4 md:p-6` | Source match |
| Error layout | `old-lms-pages.md:5-13`: no nested center-aligned page card, visible retry and back | `jobs/[jobId]/error.tsx` flattened to `min-w-0 space-y-4`; shared PageHeader, Button retry, 44px back link | Source match |
| Loading placeholder | `old-lms-pages.md`: one broad directory canvas, hairline content, no boxed dashboard per subsection | Nested job and application `loading.tsx` now use shared `GracefulPageLoading shape="directory"`, labels retained | Source-level; animation/presentation untested |
| History / archive | Preserve existing learner-only status and no inferred selection outcome | `learner-own-drive-journey.tsx` uses border-b sections with no extra cards and maintains direct own-application links with mobile 44px height | Source no-regression; live links unverified |

### Grep-style full-file proof

GitHub connector returned full content for each file after the changes. Counts below are **source regex counts, not local shell grep or a browser**.

| File | Raw HTML controls | Hex values | Deprecated `sm:` for audited properties | `min-h-11` targets | `md:` tokens | JSX section / Button open-close |
|---|---:|---:|---:|---:|---:|---|
| `jobs/[jobId]/page.tsx` | 0 | 0 | 0 | 1 | 1 | 0/0 sections |
| `jobs/[jobId]/loading.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 sections |
| `jobs/[jobId]/error.tsx` | 0 | 0 | 0 | 2 | 2 | 1/1 section, 1/1 Button |
| `applications/[applicationId]/loading.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 sections |
| `learner-own-drive-journey.tsx` | 0 | 0 | 0 | 2 | 5 | 2/2 sections |
| `learner-placement-job-detail.tsx` | 0 | 0 | 0 | 8 | 22 | 6/6 sections |
| `my-placements/page.tsx` | 0 | 0 | 0 | 11 | 14 | 5/5 sections |
| `profile/verification/page.tsx` | 0 | 0 | 0 | 3 | 4 | 3/3 sections |
| `learner-placements-dashboard.tsx` | 0 | 0 | 0 | 13 | 23 | 6/6 sections |

Source scans: raw `/<(button|input|select|textarea)(?=\\s|>)/g`; six-digit hex `/#[0-9a-f]{6}\\b/gi`; old breakpoints `/\\bsm:(min-h-9|grid-cols-2|grid-cols-3|p-4|p-5|p-6|flex-row|items-center|justify-between|text-2xl)\\b/g`; `<section` vs `</section>` and `<Button` vs `</Button>`. **All zero failures in this selected-file scan.**

Responsive source proof:
- **375px phone:** one-column grid/stacking, 44px touch links, section separator rather than nested cards; historical title and return link visible when no active job feed.
- **700px small tablet:** mobile layout continues; corrected `sm:` usages do not switch at 640px.
- **768px tablet:** `md:` grid, 24px inner card padding, 36px optional desktop links, placement source text wraps.
- **1024px desktop:** existing `lg:` role breakdown grid and independent placement stat objects retained.

**Strict tick remains open** for LRN-02/04/05/06. Full all-page zero-instance grep, render/computed colour, hover/disabled/loading/error states, phone/tablet screenshots, link/keyboard test, and TypeScript compile are not available in this turn. No code, codemod, tests, or CI executed, and no prior report of commit counts should be interpreted as visual pixel parity.

**Next file:** `src/app/(authenticated)/learn/my-placements/interviews/page.tsx`, then `src/app/(authenticated)/learn/my-placements/calendar/page.tsx`, as pending LRN-02 page-wise inventory. They may require no edits if the current shared components already meet the value table.

## Placement interviews and assessments — source pass (2026-10-20)

Completed source edits to `src/components/placements/learner-career-rounds-workspace.tsx`, `learner-career-rounds.tsx`, and `src/app/(authenticated)/learn/my-placements/assessments/results/page.tsx`. Both interviews and assessments use the shared round workspace. The parent interviews and career calendar pages were inspected and already use PageHeader, one canvas and shared learner components; no unnecessary changes were made there.

| State/value | Legacy source and value | Actual vNext value | Source result |
|---|---|---|---|
| Filter categories | `components___learn-notifications.scss:88-124`: teal pill states, 44px mobile target | Existing shared `FilterChip` controls remain; horizontal row `overflow-x-auto` phone, `md:flex-wrap` after 767px | Source parity for responsive geometry; active/focus rendered proof open |
| Text input/select | `components___form.scss:117-143`: 14px/20px, pale form bg, 2px teal focus halo | 1 shared `Input`, 2 shared `Select` in rounds workspace, `md:grid-cols-3` filters | Shared source tokens, no local handrolled controls |
| Card background/border | `components___learn-notifications.scss:184-195`: #fff + #e5e9f0 hairline, radius 12px | Round and official-result articles `rounded-xl border border-border bg-surface` | Source token match |
| Card padding | `components___learn-notifications.scss:210-221`: 16px phone, 24px desktop from 768px | Round cards and official results `p-4 md:p-6` | Source match |
| Text mobile overflow | `components___learn-notifications.scss:241-278`: `min-width:0`, wrap string | Round card grid `min-w-0`; heading already `break-words`, action links `break-words` | Source-level match |
| Row responsive | `components___learn-notifications.scss:9-10` mobile ends at 767px | All three: `md:flex-row`, `md:grid-cols-2`, `md:w-auto`, `md:grid-cols-3` where needed | Source breakpoint match |
| Phone hit target | `components___learn-notifications.scss:9-10,88-98`: >=44px | Workspace `min-h-11` (21 instances), rounds (4), official results (8) | Source match for targets |
| Empty state | `components___learn-notifications.scss:304-330`: min-height 180px; padding 48px vertical, 24px horizontal | Workspace filtered empty `min-h-[180px] px-6 py-12`; results empty `min-h-[180px] px-6 py-12` | Source match |
| Panel nesting | `old-lms-pages.md:5-13`: one canvas; no ordinary card-inside-card | Workspace status sections `border-b ... py-4 md:py-6`; published results candidate feedback `border-t border-border pt-3` | Structural source match |
| Links and buttons | `components___accessibility.scss:19-38`: visible 2px teal focus; shared Button defaults | Round card external/app links `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]`; existing Button semantics and disabled state preserved | Source implementation match; actual keyboard verification open |
| Result truth | Owner keeps existing vNext wording and behavior | Applied-results-only service and timezone IST display preserved, no inferred completion or provider submission | Source-level no-regression |

Full source scans after the commits:

| File | Raw HTML controls | 6-digit hex | Legacy `sm:` responsive utilities | 44px target tokens | `md:` responsive tokens | Matched opening/closing tags |
|---|---:|---:|---:|---:|---:|---|
| `learner-career-rounds-workspace.tsx` (643 lines) | 0 | 0 | 0 | 21 | 22 | 8/8 Buttons; 4/4 sections |
| `learner-career-rounds.tsx` (163 lines) | 0 | 0 | 0 | 4 | 10 | 1/1 Button; 1/1 article |
| `assessments/results/page.tsx` (165 lines) | 0 | 0 | 0 | 8 | 11 | 1/1 Button; 1/1 article; 3/3 sections |

Equivalent source regex for each full file: `/<(button|input|select|textarea)(?=\\s|>)/g`, `/#[0-9a-f]{6}\\b/gi`, `/\\bsm:(min-h-9|grid-cols-2|grid-cols-3|p-5|p-6|flex-row|items-start|justify-between|w-auto|hidden|flex-wrap)\\b/g`. This is **connector full-content inspection**, not a shell grep. Rerun checkout command:
```bash
grep -En '<(button|input|select|textarea)([ >])|#[[:xdigit:]]{6}|sm:(min-h-9|grid-cols-2|flex-row|w-auto)' \
 src/components/placements/learner-career-rounds{,-workspace}.tsx \
 'src/app/(authenticated)/learn/my-placements/assessments/results/page.tsx'
```

Responsive source implications: **375px phone** and **700px tablet** show one-column cards, full-width shared actions, scrollable filter chips and 44px links. **768px tablet** enables 2/3-column content and wrapped time filters; **1024px desktop** uses existing learner page canvas without an extra nested wrapper. Zero raw element matches in these three selected files. No DOM, screenshot, test, TypeScript parser or CI was executed; strict LRN-02/04/06 remain unticked.

**Exact next source file:** `src/app/(authenticated)/learn/my-placements/assessments/page.tsx` (was inspected, currently no raw controls/legacy mobile classes; compare its info banner state), then `src/app/(authenticated)/learn/my-placements/interviews/page.tsx` (already one shared PageHeader; no edits expected unless source proves a mismatch).

### Assessment landing and published-results action (2026-10-20)

`src/app/(authenticated)/learn/my-placements/assessments/page.tsx`: moved existing **View official assessment results** action from a separate block into shared `PageHeader.actions` without changing its destination. Changed assessment guidance from nested rounded card to slim info strip. Page still renders the identical `LearnerCareerRoundsWorkspace` and validation; nothing changed in application/round access.

| Property | Legacy value/reference | Source value | Proof |
|---|---|---|---|
| Title + right action | `old-lms-pages.md:5-13`: one PageHeader with title/action on one row where space permits | One `PageHeader` with existing results Link in `actions` prop | Static markup |
| Info strip | `docs/design/legacy-styles/components___learn-notifications.scss`: pale tinted notice, hairline accent | `border-l-2 border-[var(--lms-info)] bg-[var(--lms-info-subtle)] px-4 py-3 md:px-6` | Token and padding source |
| Mobile link | `components___learn-notifications.scss:9-10`: minimum 44px <=767px | `min-h-11 md:min-h-9` | Utility source |
| Focus | `components___accessibility.scss:19-38`: 2px teal, offset 2px | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]` | Static markup |
| Responsive placement | `components___learn-layout.scss:152-163`: 16px mobile horizontal padding, 768px breakpoint | `px-4 md:px-6` strip, shared PageHeader right action | Source match, no screenshot |

This file has 1 shared PageHeader, 1 results destination link, 0 raw button/input/select/textarea, 0 hex literals and 0 deprecated `sm:` utility instances. `assessments/page.tsx` and `interviews/page.tsx` retain the same learner-owned request/schedule services and the combined `learner-career-rounds-workspace.tsx`. Browser rendering, keyboard and mobile screenshots remain outstanding; LRN-02 still unticked.

**Next queued file:** `src/app/(authenticated)/learn/my-placements/notification-preferences/page.tsx`, then nested notification error/loading page inventory. Do not alter courses owned chat-7.

## Learner placement notification preferences — source parity (2026-10-20)

Source-completed `src/app/(authenticated)/learn/my-placements/notification-preferences/{page.tsx,loading.tsx}` and `src/components/placements/learner-placement-notification-settings.tsx`. Inspected existing `notification-preferences/error.tsx` and found its one PageHeader, retry Button, hairline error state already source-compatible; did not rewrite it unnecessarily.

| Property/state | Legacy SCSS / intended value | Current vNext source | Status |
|---|---|---|---|
| Page anatomy | `old-lms-pages.md:5-13`: back link, one PageHeader, white canvas | Return link placed before one shared PageHeader; page remains `min-w-0 space-y-6` | Source match |
| Checkbox affordance | `components___form.scss` / `components___accessibility.scss:19-38`: native input semantics, 2px teal focus, 44px minimum touch area | Two existing shared Checkbox controls inside labels `min-h-12`, `rounded-lg`, `focus-within:outline-2 outline-offset-2` and token focus colour | Source match |
| Checkbox states | Selected teal surface, neutral unselected, disabled when pending | Conditional `border-primary bg-primary-subtle` vs `border-border bg-surface hover:border-primary`, `disabled={pending}` preserved | Source check, rendered states pending |
| Selectable row padding | Legacy discrete option/row panels 16px inset with 8px radius | Both rows retain `p-4` and use `rounded-lg` 8px, `min-w-0` | Source match |
| Button mobile size | `components___learn-notifications.scss:9-10`: 44px through 767px | Review/reload/keep/save: four shared Buttons with `max-md:min-h-11`, normal desktop height | Source match |
| Motion sensitivity | `components___accessibility.scss`: reduced motion removes effects | Checkbox option transitions retain 150ms and gain `motion-reduce:transition-none` | Source match |
| Loading state | `old-lms-pages.md:5-13`: single directory canvas | Shared `GracefulPageLoading shape="directory"` rather than legacy-mismatched `shape="card"` | Source match |
| No-regression | Owner: preserve contents/API choices | Two preference names, optimistic `expected` match, PUT endpoint, pending disable, confirmation Dialog, toast and router refresh unchanged | Source logic review; runtime untested |

GitHub full-file scan, not shell grep:

| File | Raw controls | Hex values | Old `sm:` geometry classes | Header | Shared Button pairs | Checkbox | 44px tokens |
|---|---:|---:|---:|---:|---:|---:|---:|
| `notification-preferences/page.tsx` (23 lines) | 0 | 0 | 0 | 1 | 0/0 | 0 | 1 |
| `notification-preferences/loading.tsx` (6 lines) | 0 | 0 | 0 | 0 | 0/0 | 0 | 0 |
| `notification-preferences/error.tsx` (16 lines; inspected unchanged) | 0 | 0 | 0 | 1 | 1/1 | 0 | 1 |
| `learner-placement-notification-settings.tsx` (105 lines) | 0 | 0 | 0 | 0 | 4/4 | 2 | 4 |

Scan patterns: `/<(button|input|select|textarea)(?=\\s|>)/g`; `/#[0-9a-f]{6}\\b/gi`; `/\\bsm:(min-h-9|p-5|p-6|grid-cols-2)\\b/g`; opens `/<Button(?=\\s|>)/g`, closes `/<\\/Button>/g`.

Phone **375px** and small tablet **700px**: both selectable option rows stack, have at least 48px selectable height, four actions have >=44px target; 768px+: normal shared Button desktop sizing and preserved label layout. Layout derived from class rules only; computed visual values and manual interaction not measured. LRN-02/04/06 remain strictly unticked.

### Batch codemod note
`scripts/codemods/chat1-learner-rounds-responsive.cjs` added for the 4 previously source-migrated round/result files: idempotent source substitutions, dry-run default, TypeScript TSX parse guard. The Node codemod was **not run**, as per user dev-only/no-code-execution instruction.

**Next exact file for continuation:** `src/app/(authenticated)/learn/my-placements/preparation/page.tsx` (remaining LRN-02 page type; inspect against existing proof before making any changes); after that `src/app/(authenticated)/learn/my-placements/support/page.tsx`. Full runtime screenshot/keyboard parity and whole-lane grep remain the reason all strict checklist items are open.

## Learner support filters and preparation recovery — source pass (2026-10-20)

`src/app/(authenticated)/learn/my-placements/support/page.tsx` now uses the existing **legacy 44px filter-pill geometry** for two filter navs (status/category), with selected teal background/white text, 14px medium/1.3 type, 8px radius, 16px horizontal inset, 150ms hover, 2px teal focus and horizontal scrolling through viewport 767px. The PageHeader extra eyebrow was removed and nested decision note is a hairline subsection, not another card.

`src/app/(authenticated)/learn/my-placements/preparation/page.tsx` invalid-query recovery now uses the one-canvas `min-w-0` alert and a 44px tappable Clear filters link; its valid branch keeps existing shared Tabs, EmptyState, PageHeader and membership-scoped service.

| Value/state | Legacy SCSS reference | vNext exact property | Source check |
|---|---|---|---|
| Support pill height | `components___learn-notifications.scss:88-98`: >=44px | `supportFilterPillClass`: `min-h-11` both phone and desktop | Match |
| Pill dimensions | Same: 14px, 500, 1.3 line, 8px radius, 16px left/right pad | `text-[14px] font-medium leading-[1.3] rounded-lg px-4` | Match |
| Selected pill | `components___learn-notifications.scss:117-125`: teal #26bac7 fill, white text | `aria-[current=page]:bg-[var(--lms-primary)]` + `text-[var(--lms-on-primary)]` + border | Match |
| Pill hover/focus | `components___learn-notifications.scss:101-116`: 0.4-alpha teal border, 0.05 teal bg, 2px focus outline offset2px | `hover:border-[rgba(38,186,199,0.4)]`, `hover:bg-[rgba(38,186,199,0.05)]`, focus teal 2px/offset2px | Source match |
| Mobile nav | `components___learn-notifications.scss:56-74`: <=767px horizontal overflow, >=768px wrap | `flex-nowrap overflow-x-auto`, `md:flex-wrap md:overflow-visible` | Match |
| Preparations invalid route | `old-lms-pages.md:5-13`: one canvas, left state, 44px tap target | `role=alert`, `min-w-0 space-y-4`, `Clear filters` `min-h-11 md:min-h-9` | Match |

**Full-file static inventory:** Support 85 lines, raw controls **0**, 6-digit hex **0**, deprecated small-breakpoint **0**, **1** PageHeader, **2** shared pill uses, **2** nav uses, **2/2** section tags; Preparation 79 lines, raw controls **0**, 6-digit hex **0**, deprecated small-breakpoint **0**, **2 conditional PageHeader source occurrences** (exactly one per rendered branch), **2/2** section tags.

Source scans: `/<(button|input|select|textarea)(?=\\s|>)/g`, `/#[0-9a-f]{6}\\b/gi`, `/\\bsm:(min-h-9|grid-cols-2|grid-cols-3|p-5|p-6|flex-wrap)\\b/g`, open/close `<section>` and `</section>`. This is full GitHub-file text inspection, not execution of shell grep.

Responsive source implications: **375px** and **700px** use one horizontal swipeable filter nav row, visible focus/44px targets; **768px+** wraps filter links within the available page width. The preparation error back link reaches 44px on phone and can use desktop height after 768px. No app rendering, screenshots, tests, TypeScript checking or CI in this turn; all 7 owner strict checklist items intentionally remain **unticked** pending executable proof.

**Next exact file:** `src/app/(authenticated)/learn/my-placements/rules/page.tsx`, then `src/app/(authenticated)/learn/my-placements/placement/page.tsx` for remaining LRN-02 value/state verification. Other concurrent lanes may have modified main; sync with main before editing.

## Learner rules, notices, offers and profile — source sweep 2026-10-20

**North star:** all learner content continues to live inside the ONE authenticated white LMS page canvas; no replacement for vNext business text, data order, APIs, role gates, or status rules. Source-only edits were pushed to chatgpt/chat-1-b after first replaying this lane's earlier unmerged files onto `main` `fcabc6227301cac80742706822599d209309a1fb` (conflict-free at that comparison). A separate local pixel-diff and executable responsive proof has not been run, so no strict queue item is checked.

### Value-by-value ledger — legacy values not approximations

| Component/property/state | Old LMS exact source and value | Current learner source | Source result / remaining gap |
|---|---|---|---|
| Canvas and section structure | `docs/design/old-lms-pages.md:5-13`: one white 12px radius canvas, 1px #e5e9f0 border, 24px outer padding; ordinary sections only hairline separators | `my-placements/rules/page.tsx`, `profile/page.tsx`, `my-placements/offers/page.tsx`: redundant nested section wrappers replaced with `border-b border-border` and no second canvas | Source structural match; visual canvas supplied by shell owner |
| Heading | `docs/design/old-lms-pages.md:6`: h1 ~30px/600, no small eyebrow above; shared PageHeader | `rules/page.tsx` removed `eyebrow="My Placements"`; `placement/page.tsx`, announcements, offers, profile use one PageHeader in their valid branch | Source match, actual h1 computed by shared UI owner |
| Primary colour | `components___variables.scss:9-13`: #26bac7, hover #1e9aa8, text #1a95a1, pale #eff8fa | `--lms-primary`, `--lms-primary-hover`, `--lms-primary-text`, `--lms-primary-subtle` in learner links/chips/cards | Source token values verified in `src/app/globals.css:25-31`; computed/hover not rendered |
| White and border | `components___variables.scss:21-45`: white #fff, border neutral-200 #e5e9f0, neutral-50 #fafbfc | `bg-surface`, `border-border`, `bg-[var(--lms-neutral-50)]` | Token match from `src/app/globals.css:32-45` |
| Learner responsive cutoff | `components___learn-notifications.scss:9`: 767px last mobile pixel; >767px desktop tablet | All 10 audited files: no `sm:` or `min-[768px]:`; `md:` begins at 768px | Source match for breakpoint; browser layout/screenshot unverified |
| Filter pill dimensions | `components___learn-notifications.scss:87-99`: 44px min height, 8px radius, 8px+16px padding, 14px font, 500 weight, 1.3 line-height | `profile/completeness/page.tsx`: `min-h-11 rounded-lg px-4 py-2 text-[14px] font-medium leading-[1.3]` and 44px even on desktop | Source match |
| Filter default/hover | `components___learn-notifications.scss:100-116`: transparent/#6b7280, hover #26bac7, rgba teal .4 border/.05 background, transition .15s | `profile/completeness/page.tsx` default `bg-transparent text-[var(--lms-neutral-500)]`; hover exact rgba literal; 150ms transitions | Source match; real hover untested |
| Filter active/focus | `components___learn-notifications.scss:117-125`: #26bac7 fill, white text, hover #1e9aa8; focus 2px teal outline/2px offset | Completion checklist selected item uses `bg-[var(--lms-primary)] text-[var(--lms-on-primary)] hover:bg-[var(--lms-primary-hover)]`, explicit `focus-visible:outline-2 outline-offset-2` | Source match |
| Filter mobile scroll | `components___learn-notifications.scss:55-74`: max-width calc(100vw - 48px), flex nowrap, scrollbar hidden, overflow auto, desktop wrap | `profile/completeness/page.tsx`: `flex overflow-x-auto pb-2`, `md:flex-wrap md:overflow-visible md:pb-0` (no local max-width; parent constrains width) | Partial; exact max-width/scrollbar hiding not matched here |
| Notice card geometry | `components___learn-notifications.scss:181-225`: border #e5e9f0 radius12, shadow 0 1px 2px rgba(0,0,0,.04), mobile padding16 desktop24 | `my-placements/announcements/page.tsx`: `rounded-xl border border-border bg-surface p-4 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]` | Source match |
| Notice hover and focus | `components___learn-notifications.scss:188-203`: shadow 0 2px 6px rgba(0,0,0,.06), border rgba(teal,.25), 200ms, focus 2px teal offset 2px | Announcements list item hover/shadow/transition/focus-within match properties, with `motion-reduce:transition-none` | Source match; focus-within isn't identical to element focus-visible, keyboard screenshot outstanding |
| Empty UI | `components___learn-notifications.scss:314-348`: min-height180, 48px vertical/24px horizontal, 14px body, centred rich states | `my-placements/announcements/page.tsx` and offers: `min-h-[180px] bg-[var(--lms-neutral-50)] px-6 py-12` states | Source dimension match; existing EmptyState shared styles may differ |
| Warning/error strip | `docs/design/old-lms-pages.md:7` and `components___variables.scss:75-85`: warning #d97706, subtle rgba(217,119,6,.1), thin left accent | `my-placements/placement/page.tsx`, offers: `border-l-2 border-warning bg-warning-subtle px-4 py-3` | Source token match, 2px vertical accent; full real computed style not measured |
| Informational strip | `components___variables.scss:82-86`: info #26bac7 and subtle #eff8fa | `rules/page.tsx`, `profile/data-access/page.tsx`: `border-l-2 border-[var(--lms-info)] bg-[var(--lms-info-subtle)] px-4 py-3` | Source token match |
| Link touch target | `components___learn-notifications.scss:9-11`: >=44px on phone | `rules`, `placement`, `profile`, `data-access`, `academic-record` links use `min-h-11 md:min-h-9`; alerts snippets switch typography only at `md:` | Source match for inspected links |
| Notification body typography | `components___learn-notifications.scss:258-287`: 13px phone, 14px >=768px, line-height1.5 | `learner-placement-alerts.tsx`: `text-[13px] leading-[1.5] md:text-[14px]` | Exact source size/line-height |
| Profile sections | `docs/design/old-lms-pages.md:5-13`: no card-in-card, only genuinely separate object cards | `profile/page.tsx`: verification summary/status use `border-b`; `profile/data-access/page.tsx` notice slim info strip; academic record remains read-only | Source structure match, page contents unchanged |

### Full-file grep-like inventory (read current GitHub source after writes)

| File | Lines | Raw button/input/select/textarea | Hard-coded hex | `sm:` | Shared PageHeader occurrences | `min-h-11` tokens | `md:` utility tokens |
|---|---:|---:|---:|---:|---:|---:|---:|
| `my-placements/rules/page.tsx` | 135 | 0 | 0 | 0 | 1 | 8 | 14 |
| `my-placements/placement/page.tsx` | 96 | 0 | 0 | 0 | 1 | 9 | 9 |
| `my-placements/announcements/page.tsx` | 266 | 0 | 0 | 0 | 1 | 18 | 20 |
| `my-placements/offers/page.tsx` | 299 | 0 | 0 | 0 | 1 | 17 | 19 |
| `placements/learner-general-requests.tsx` | 100 | 0 | 0 | 0 | — | 3 | 2 |
| `placements/learner-placement-alerts.tsx` | 54 | 0 | 0 | 0 | — | 1 | 6 |
| `profile/page.tsx` | 166 | 0 | 0 | 0 | 1 | 6 | 11 |
| `profile/data-access/page.tsx` | 47 | 0 | 0 | 0 | 1 | 2 | 2 |
| `profile/academic-record/page.tsx` | 35 | 0 | 0 | 0 | 1 | 1 | 2 |
| `profile/completeness/page.tsx` | 79 | 0 | 0 | 0 | 1 | 2 | 5 |

Scopes in table: `src/app/(authenticated)/learn/` for pages, `src/components/placements/` for components. Scans performed against **whole-file source text from GitHub**, not by running terminal grep, TSX parser or browser:
- `/<(button|input|select|textarea)(?=\\s|>)/g` => 0 in each selected file.
- `/#[0-9a-f]{6}\\b/gi` => 0 in each selected file.
- `/\\bsm:/g` => 0 in each selected file.
- `/min-\\[768px\\]:/g` => 0 in the three profile pages that formerly used this arbitrary breakpoint.
- Parent section tags were counted and balanced in rules (6/6), placement (6/6), profile (4/4), data-access (3/3), academic-record (1/1), completeness (2/2); `announcements` 3/3 shared Buttons, `offers` 2/2.

Suggested local exhaustive command **not executed**:
```bash
grep -RInE '<(button|input|select|textarea)([[:space:]>])|#[[:xdigit:]]{6}|sm:|min-\\[768px\\]:' \
  'src/app/(authenticated)/learn' src/components/placements/learner-* \
  src/components/attendance/learner-* --include='*.tsx'
```

### Source responsive proof (no screenshot or computed DOM)

- **375px phone:** link touch targets >=44px; placement and profile facts single-column; options swipe where scrollable; notice cards get 16px padding and no additional page canvas.
- **700px small tablet:** continues mobile design through old LMS's 767px boundary, not Tailwind's 640px default. Reusable tab/pill components remain single source of behaviour.
- **768px tablet:** `md:` activates two-column academic facts and 24px notice/card padding; most standalone links can become 36px. Completion filters wrap but stay 44px like old legacy pills.
- **1024px desktop:** third-column facts where relevant, page head remains shared PageHeader inside existing canvas, side-by-side status/figure cards only for discrete objects.

**Still missing before strict ticks:** browser-side screenshot comparisons of default, active, hover, focus, disabled, loading, error and empty, full-tree grep beyond this set, TypeScript compile, and global computed skin parity. `LRN-01..LRN-07` remain **all OPEN**. Do not claim pixel-perfect achievement without these.

Repeatable `scripts/codemods/chat1-learner-page-breakpoints.cjs` covers 8 learner-owned pages, dry-run by default and checks TSX syntax before optional apply; written, not executed.

**Next file:** `src/app/(authenticated)/learn/my-placements/schedule/page.tsx`, followed by `src/app/(authenticated)/learn/my-placements/jobs/page.tsx` remaining source-level state and action-value checks.
