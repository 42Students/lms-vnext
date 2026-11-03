# Pixel parity — baseline verification and first execution audit (2026-11-03)

**Authority:** `PIXEL_PARITY_MASTER_PLAN.md`.  
**Reference:** independent-history `parity-baseline` root screenshot commit `b4f9bdd5767f484169d6da14f615aa9b65a5f265`.  
**vNext capture:** recorded as `7acef7ec` (short SHA) in this branch's README.  
**Main checked before implementation:** `ae67d92b528ee517c1fd68f1a252cbd01a0ef3ec`.  
**This audit is read-only for image references.** All screenshot visual closure remains UNVERIFIED until new candidate captures, diff artifacts and browser tests execute.

## 1. Structural verification performed

Performed directly against the complete GitHub recursive tree of the original screenshot commit and against `summary.json` and `packages/QUEUE.md`.

| Check | Result |
| --- | --- |
| Git tree complete | Yes; 3,972 blob files, GitHub tree not truncated |
| PNG images | **3,169** |
| Screenshot total bytes | **409,006,893 B** |
| Work package documents | **783** |
| Queue entries | **783** |
| Queued packages missing files | **0** |
| Package files missing from queue | **0** |
| Zero-byte PNG files | **0** |
| Role-level summary image counts | **All six match** |
| Role-level summary package counts | **All six match** |
| Image bytes validated as PNG / image dimensions checked | Not yet across full tree; executable auditor adds these checks in detached local checkout |
| Every image referenced by exactly one package | Not yet proved across all 783 Markdown contents |
| Semantic old-vNext state matching | Only pilot examples inspected, not exhaustive |

Do not equate structural inventory validation with screenshot pixel parity.

### Exact source counts

| Role | Old PNG | vNext PNG | Total | Packages |
| --- | ---: | ---: | ---: | ---: |
| Learner | 168 | 171 | 339 | 71 |
| Faculty | 72 | 134 | 206 | 55 |
| Mentor | 18 | 32 | 50 | 22 |
| TPO | 378 | 318 | 696 | 200 |
| College Admin | 1,384 | 286 | 1,670 | 384 |
| Course Coordinator | 208 | 0 | 208 | 51 |
| **Total** | **2,228** | **941** | **3,169** | **783** |

## 2. Coverage captured (these are not full-role pass rates)

The `coverage.json` files show only route capture reachability, not feature parity. An attempted route may load-fail, redirect or use different data.

| Role | Old reached / source | vNext reached / source | Old not reached | vNext not reached |
| --- | --- | --- | ---: | ---: |
| Admin | 55/60 | 84/99 | 5 | 15 |
| TPO | 24/27 | 107/137 | 3 | 30 |
| Learner | 18/24 | 33/48 | 6 | 15 |
| Faculty | 10/14 | 27/40 | 4 | 13 |
| Mentor | 4/13 | 18/36 | 9 | 18 |
| Course Coordinator | 19/23 | no counterpart captured | 4 | — |

Known vNext `loadFailedShots` counts by coverage: Admin 9, TPO 12, Learner 4, Faculty 2, Mentor 2. Old capture reported 0 load-failed shots for those roles, but may contain other capture limitations. Capture write blocking means some post-save screenshots are absent; do not infer save success from rendered toast text.

### Unpaired route classifications

- 68 old-only classifications, 208 vNext-only classifications from `summary.json`.
- These need alias/route/role-guard reconciliation; they are **not** 276 confirmed missing or extra product features.
- Course Coordinator is legacy-only in the snapshot; Recruiter and Super Admin require new dedicated baseline coverage.
- Unvisited old Mentor routes include course, contacts, profile and project-related routes; the old Mentor snapshot is especially incomplete.

## 3. First five package decisions

### `learner-001` — `/learn/allAssignments`

**Old:** white canvas, compact “All Assignments” title, course dropdown at top-right, one assignment count chip and a short assignment row with due/status and “View →”.

**Captured vNext:** top metrics, expandable assessment totals, quick-view chips, two filtering rows, a large assignment card, extra descriptive/footer text and large action styling. Search/topbar geometry differs.

- Classification: shared typography/topbar/canvas + page-level composition, filtering and density.
- Required action: preserve legitimate filtering capability while reproducing legacy's default visible composition and exact label/placement.
- Status: **AUDITED / GAP**, not fixed.

### `faculty-001` — `/quiz`

**Old:** base flagged blank plus a preview interaction. **vNext:** base flagged `load-failed`.

- Classification: CAPTURE / FUNCTIONAL PRECONDITION.
- Required action: inspect live quiz route/data/provider, recover valid comparable state, then compare UI.
- Status: **BLOCKED FOR VISUAL COMPARISON**; not a legitimate image-to-image acceptance pair.

### `mentor-001` — `/mentor/calendar`

**Old:** compact “Meetings” canvas, “Upcoming (1)” and “Past & Cancelled (1)” headings with meeting rows, status labels and “Open project” links.

**Captured vNext:** expanded meeting dashboard with week strip, filters, meeting selector, right-side details, many additional sections and an extraordinarily tall screenshot. Text in the meeting detail panel appears one character per line.

**Source cause verified:** `src/components/projects/mentor-meetings-calendar.module.css` `.row` had `grid-template-columns: minmax(0, 1fr) auto`; multiple recorded-details/form/notes children occupy implicit grid slots without a full-span definition, allowing the auto track to collapse. The visible screenshot matches this failure mode.

- Code correction proposed: single `minmax(0,1fr)` grid track while keeping all functionality, permission checks and links untouched.
- Code commit: `e23f5a71fd7e38eda9bc9ffaf471693c1a88696c` on `visual-parity-mentor-calendar-20261103`.
- Regression source test: `3970d29d7592422314cfabbb82ecf0f4c3be5bf1`, draft PR [#217](https://github.com/42Students/lms-vnext/pull/217).
- Verification: static structure guard checked; **Node test and browser/pixel comparison NOT EXECUTED yet**.
- Status: **P0 OVERFLOW DEFECT PATCHED ON DRAFT BRANCH; NOT VISUALLY CLOSED**.
- Remaining larger mismatch: old legacy list versus modern two-column dashboard still needs structure/appearance work. Do not call mentor-001 complete.

### `tpo-001` — `/tpo/announcements`

**Old:** base plus “From 42”, Add, button/link, and New Announcement expansions.

**Captured vNext:** one base image only.

- Classification: missing comparable interaction-state captures. Page may have additional controls, but it is not proved by that sole image.
- Status: **AUDITED / CAPTURE GAP**.

### `admin-001` — `/college-admin/assignments` vs `/college/assignments`

**Old:** “Courses & Content”, rounded navigation pills, “Assignments” section, course/scope controls, compact table with title/course/scope/action grouping.

**Captured vNext:** different breadcrumb/heading layout, underline tabs, more filters, more columns, taller rows and changed action wording/placement.

- Classification: shared table/tabs/canvas/typography + account page-level actions and columns.
- Status: **AUDITED / GAP**, not fixed.

## 4. First executable tooling work

Two isolated source branches have been created from main so the independent-history screenshot branch is not merged:

1. **Inventory auditor:** `visual-parity-inventory-20261103`, draft [PR #216](https://github.com/42Students/lms-vnext/pull/216). Adds a read-only Node tool to check package/queue references, screenshot location, IHDR width, role totals, duplicate references, coverage and unmatched counts; adds fixture-based unit tests.
2. **Mentor overflow fix:** `visual-parity-mentor-calendar-20261103`, draft [PR #217](https://github.com/42Students/lms-vnext/pull/217). Removes the compressed second grid track and adds a source-level regression guard.

**Important test status:** The local full repository checkout and authenticated browser test environment were not available within this GitHub-only tool session. No Node unit tests, lint, build, full Playwright screenshot comparisons or CI executions have been claimed for those draft branches. The PRs are intentionally drafts.

## 5. Immediate runnable verification

With a local application checkout and a detached reference worktree:

1. `git fetch origin main parity-baseline`
2. `git worktree add --detach ../lms-parity-baseline origin/parity-baseline` (use an unused directory; do not edit the image files)
3. From a checkout containing PR #216, run `node --test tests/visual-baseline-inventory.test.mjs`
4. Run `node scripts/audit/visual-baseline-inventory.mjs --root ../lms-parity-baseline --json /tmp/visual-baseline-audit.json`
5. Investigate any referenced-image, PNG-width, count or unmatched-route inconsistencies; do not auto-correct reference images.
6. From a checkout containing PR #217, run `node --test tests/mentor-meetings-calendar-grid-layout.test.mjs`, then the focused app tests, typecheck, lint and 1280 × 800 browser recapture of `/mentor/calendar` with matched fixtures.
7. Produce new image/overlay/diff proof for mentor-001; compare old list arrangement as well as overflow. Only then consider its first verified visual state.
8. Record exact tested SHAs and results in the existing parity family verification and page ledgers on main as required.

## 6. Open blockers and next high-impact work

| Priority | Finding | Next action | Closure status |
| --- | --- | --- | --- |
| P0 | Mentor meeting detail text collapsed | Execute tests and recapture draft fix, then legacy layout conversion | OPEN |
| P0 | Invalid old-vNext matched quiz screenshot | Recover faculty route and capture valid state | OPEN |
| P1 | No deterministic old-vNext pixel comparator yet | Add capture, image overlay/diff and geometry report to existing Playwright workflow | OPEN |
| P1 | Shared prototype shell conflicts with legacy appearance | Measure shell per role, change shared source with cross-role regression gate | OPEN |
| P1 | Unpaired route classifications | Reconcile 68 old-only + 208 vNext-only classes against source | OPEN |
| P1 | Baseline lacks Recruiter/Super Admin | Add role-specific route census and safe screenshot captures | OPEN |
| P2 | Screenshot package parity beyond initial pilots | Systematic batch-by-batch execution after pilot and comparator | OPEN |

**Next acceptance objective:** Execute PR #216 inventory test/audit and PR #217 mentor regression/visual capture; then make the first full old-vNext pixel comparison repeatable. Nothing in this report asserts a green screenshot or finished account.