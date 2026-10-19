# Learner portal UI clone audit — chat-1

Base: `42Students/lms-vnext` `main` at `1fae38d2c433f5b5b0a90a22be12754ab28796e0` (2026-10-19). Branch: `chatgpt/chat-1-b`.

Scope: `src/app/(authenticated)/learn/**` except `courses/**` (chat-7), learner projects and `src/components/placements/learner-*`, `src/components/attendance/learner-*`. No shared UI, `legacy-skin.css`, shell or non-learner components edited.

## Work queue (GitHub directory inventory and targeted JSX inspection; exhaustive grep is pending)
- [ ] LRN-01: `my-placements/applications/page.tsx`, `jobs/page.tsx`, `placement/page.tsx` missing shared `PageHeader`. Script `scripts/codemods/chat1-learner-page-headings.cjs` handles all **3** while preserving the two existing top-row links as actions. Run `node scripts/codemods/chat1-learner-page-headings.cjs --apply` after reviewing dry-run. Script authored but **not run**; no tick.
- [ ] LRN-02: Remaining placement pages `my-placements/{announcements,assessments,calendar,interviews,notification-preferences,offers,preparation,rules,schedule,support}/page.tsx`, main `my-placements/page.tsx`: titles, tab order, filters, links, notices, single canvas.
- [ ] LRN-03: `src/components/placements/learner-{applications,jobs}-browse.tsx`: examine dynamic class and aria-pressed filter pills, keyboard focus, 44px mobile touch target and horizontal overflow.
- [ ] LRN-04: `src/components/placements/learner-placements-tabs.tsx`, `learner-placements-dashboard.tsx`, `learner-placement-{jobs,offers,alerts}.tsx` and other `learner-*.tsx`: UI states and card-in-card / spacing / token pass.
- [ ] LRN-05: `learn/{attendance,calendar,profile,projects,notifications,placements}/page.tsx` plus nested pages, `src/components/attendance/learner-attendance-workspace.tsx`: PageHeader, responsive titles and controls.
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
