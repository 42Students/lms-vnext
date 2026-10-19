# Learner portal UI clone audit — chat-1

Base: `42Students/lms-vnext` `main` at `1fae38d2c433f5b5b0a90a22be12754ab28796e0` (2026-10-19). Branch: `chatgpt/chat-1-b`.

Scope: `src/app/(authenticated)/learn/**` except `courses/**` (chat-7), learner projects and `src/components/placements/learner-*`, `src/components/attendance/learner-*`. No shared UI, `legacy-skin.css`, shell or non-learner components edited.

## Work queue (GitHub directory inventory and targeted JSX inspection; exhaustive grep is pending)
- [ ] LRN-01: `my-placements/applications/page.tsx`, `jobs/page.tsx`, `placement/page.tsx`, `schedule/page.tsx` missing shared `PageHeader`. Script `scripts/codemods/chat1-learner-page-headings.cjs` handles all **4** while preserving the two existing top-row links as actions. Run `node scripts/codemods/chat1-learner-page-headings.cjs --apply` after reviewing dry-run. Script authored but **not run**; no tick.
- [ ] LRN-02: **partial**: filter link states and min-height changed in Announcements / My offers; source-level comparison and other routes remain. Remaining placement pages `my-placements/{announcements,assessments,calendar,interviews,notification-preferences,offers,preparation,rules,schedule,support}/page.tsx`, main `my-placements/page.tsx`: titles, tab order, filters, links, notices, single canvas.
- [ ] LRN-03: `src/components/placements/learner-{applications,jobs}-browse.tsx`: **partial**: removed hand-rolled `aria-pressed` controls in these two files; shared `SegmentedControl` uses native radio states with 44px min mobile target and `Tabs` supplies underline for application views. Verify keyboard, routing and remaining components before tick.
- [ ] LRN-04: `src/components/placements/learner-placements-tabs.tsx`, `learner-placements-dashboard.tsx`, `learner-placement-{jobs,offers,alerts}.tsx` and other `learner-*.tsx`: UI states and card-in-card / spacing / token pass.
- [ ] LRN-05: **partial**: learner project detail now renders `PageHeader` for audit and invalid-board-filter states, while regular project workspace keeps its own header. `learn/{attendance,calendar,profile,projects,notifications,placements}/page.tsx` plus nested pages, `src/components/attendance/learner-attendance-workspace.tsx`: PageHeader, responsive titles and controls.
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
