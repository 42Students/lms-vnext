# Page anatomy clone audit — lane chat-9

Owner: chat-9 · 2026-10-19 · branch: `chatgpt/chat-9-b`
Checklist: B5 (canvas, head, breadcrumbs, back links), B6 (responsive), E6 (card boundaries).
Reference priority: measured legacy TPO `docs/design/old-lms-shell-spec.md`, extracted `docs/design/old-lms-pages.md`, then `docs/design/legacy-styles/` exact SCSS values. Page contents and behavior are not clone targets.

## STRICT TICK RULE — source findings, not final approval

- [ ] B5 — page canvas (missing: repository-wide shell/card wrapper grep and side-by-side phone/tablet/desktop verification; some existing page-level overrides still bypass the shared canvas)
- [ ] B5 — page head (missing: all dynamic imported headings migrated, legacy stylesheet heading differences reconciled, all header states and responsive callers verified)
- [ ] B5 — breadcrumbs/back links (missing: shared breadcrumb migration across every route and evidence for every hover/focus/disabled/error state; currently only selected pages converted)
- [ ] B6 — responsive collapse (missing: full 320–390px phone and 768–1199px tablet comparisons for tables/filters/actions across every portal; several independent screens still use 640px Tailwind collapse rules)
- [ ] E6 — only genuine cards (missing: repository-wide nested-card audit proving zero presentation-only nested cards; real object cards still need exemptions individually recorded)

**No item is ticked.** User forbids running the app, tests and CI. The GitHub connector has no recursive repository checkout or authoritative ripgrep output, so global grep counts below are **not run**, not fabricated; GitHub code-search counts are incomplete/index-dependent. Browser pixel comparison is reserved for checklist J and has not occurred. TypeScript syntax has been source-inspected, not compiler-certified.

## B5. Canvas value-by-value

| Property/state | Old LMS value and file:line | vNext value and file:line | Result |
| --- | --- | --- | --- |
| Shell/page background, default | `legacy-styles/components___variables.scss:31,52` `#f1f4f9` | `src/app/globals.css:63,319-328` `--lms-page-background` / canvas definitions | Token present; shell full-path evidence pending |
| Canvas background | `old-lms-shell-spec.md:19` `#ffffff`; `legacy-styles/components___variables.scss:41` `$white: #ffffff` | `src/components/ui/page-canvas.tsx:17` `bg-white`; `src/app/globals.css:346-347` `#fff` | Matches |
| Hairline border | `old-lms-shell-spec.md:19` `1px solid #e5e9f0`; `legacy-styles/components___variables.scss:30` | `src/components/ui/page-canvas.tsx:17`; `src/app/globals.css:322,349` `1px` / `#e5e9f0` | Matches |
| Border radius | `old-lms-shell-spec.md:19` `12px`; `legacy-styles/components___variables.scss:134` `$radius-card:12px` | `src/app/globals.css:327,350`; `src/components/ui/page-canvas.tsx:17` | Matches |
| Inner padding | `old-lms-shell-spec.md:19` `24px`; `legacy-styles/components___listing-page-header.scss:20` `$s3:24px` | `src/app/globals.css:328,351`; `src/components/ui/page-canvas.tsx:22` inline `padding:var(--lms-canvas-padding)` | Matches global canvas |
| Surface shadow | `old-lms-shell-spec.md:19` none | `src/components/ui/page-canvas.tsx:17` `shadow-none`; `src/app/globals.css:352` `box-shadow:none` | Matches |
| Single authenticated canvas | `old-lms-pages.md:5` one continuous page; `old-lms-shell-spec.md:20` thin separators, not section cards | `src/app/(authenticated)/layout.tsx:137-149` one `PageCanvas`; `src/components/ui/page-canvas.tsx:5-8` | Shared architecture matches; individual descendants not fully audited |
| Loading/error/empty shell | `old-lms-pages.md:5,7` inherited uninterrupted canvas | `src/app/(authenticated)/layout.tsx` encloses children and notices | Layout inherited; all error boundaries not reviewed |
| Mobile padding | `legacy-styles/components___learn-layout.scss:397-405,419-421` learner inner header padding 16px phone, 24px desktop; measured TPO canvas 24px in `old-lms-shell-spec.md:19` | `src/app/globals.css:601-603,1008-1012` mobile overrides 16px; `page-canvas.tsx:20-22` inline rule enforces 24px | **Unresolved legacy-module contradiction**, not tickable |
| Canvas max width/offset | `old-lms-shell-spec.md:19` at 1280px canvas x280 width976 right16 | `src/components/shell/app-shell.tsx:119` main max1600, shell offsets via CSS | Runtime geometry not verified |

## B5. Page head and responsive values

| Property/state | Old LMS file:line / exact value | vNext file:line / value | Result |
| --- | --- | --- | --- |
| Desktop heading font | `old-lms-shell-spec.md:27` 30px / 600 / `#172033` | `src/components/ui/page-header.tsx:26-35`; `src/app/globals.css:320,355-362`: 30px /600 / heading token | Matches measured TPO |
| Legacy listing heading alternative | `legacy-styles/components___listing-page-header.scss:52-60` 28px / 600 / line-height1.3 / `$text` | `page-header.tsx:30-32` 30px /600/1.35 | **Differs** by module; measured TPO spec is chosen, acceptance pending |
| Default layout | `legacy-styles/components___listing-page-header.scss:26-35` flex row, items-start, justify-between, gap24 | `page-header.tsx:25-28` md:flex-row, md:items-start, md:justify-between, md:gap-6=24 | Matches desktop placement |
| Title/subtitle alignment | `legacy-styles/components___listing-page-header.scss:45-49` baseline, gap16 | `page-header.tsx:28` md:items-baseline md:gap-4=16 | Matches desktop |
| Title tracking | `legacy-styles/components___listing-page-header.scss:57` -0.02em | `page-header.tsx:30` tracking -0.02em | Matches |
| Head bottom spacing | `legacy-styles/components___listing-page-header.scss:33-35` margin-bottom16 padding-bottom16 border-bottom1px neutral200 | `page-header.tsx:26` padding-bottom16; no own border or margin-bottom | **Differs**, layout ownership and double separators unresolved |
| Eyebrow placement | `old-lms-pages.md:6` inline one-line subtitle, no eyebrow block | `page-header.tsx:20-21,36-43` old eyebrow and description joined into inline subtitle | Matches target anatomy, copy preserved |
| Actions desktop | `legacy-styles/components___listing-page-header.scss:80-85` inline-flex, gap16, padding-top8 | `page-header.tsx:45-49` wrapped flex, gap8, no top padding, width capped60% | **Differs**: action padding/gap need visual acceptance |
| Phone breakpoint | `legacy-styles/components___variables.scss:148,155`; `listing-page-header.scss:130-131` max767 | `page-header.tsx:26,28,46` md=768 boundary | Matches |
| Phone title size | `legacy-styles/components___listing-page-header.scss:137` 20px | `page-header.tsx:26,30-32` header-scoped CSS variable 20px | Matches; CSS specificity factored in |
| Phone title/subtitle stacking | `legacy-styles/components___listing-page-header.scss:139-143` column, gap2px | `page-header.tsx:28` flex-col gap-0.5 (2px) | Matches |
| Phone head stack and gap | `legacy-styles/components___listing-page-header.scss:132-135` column gap8px | `page-header.tsx:26` flex-col gap2 (8px) | Matches |
| Phone right actions stack | `legacy-styles/components___listing-page-header.scss:149-154` full-width column | `page-header.tsx:46` w-full flex-col; md:flex-row | Matches container; individual child widths need review |
| Tablet breakpoint | `legacy-styles/components___variables.scss:149-151` 991px / 1024px / 1199px | `page-header.tsx:26` switches at768px; `app-shell.tsx:119` uses sm=640 / lg=1024 | **Incomplete** tablet per-component behavior |
| Disabled, loading, empty/error heading states | No dedicated matching page-head transitions documented in listing SCSS | Same `PageHeader` across page success/error flows | Source behavior inherited, not all states proven |

## B5. Breadcrumb/back-link values

| Property/state | Old LMS source value | vNext source value | Result |
| --- | --- | --- | --- |
| Back click target | `legacy-styles/components___learn-layout.scss:362-370` min44px x44px inline flex center, horizontal padding8px | `src/components/ui/page-back-link.tsx:18-28` min-h-11/min-w-11, px-2, centered | Matches |
| Back label on phone | `legacy-styles/components___learn-layout.scss:378-382` visually hidden max767, aria-label retained | `src/components/ui/page-back-link.tsx:20,28` aria-label, md:inline label | Matches |
| Default back text | `legacy-styles/components___learn-layout.scss:371` neutral500 | `src/components/ui/page-back-link.tsx:23` muted text token | Token mapping must be validated |
| Hover back text | `legacy-styles/components___learn-layout.scss:18,361-376` `$learn-accent-color=$clrThird=#26bac7`, duration .15s ease | `src/components/ui/page-back-link.tsx:23`; `src/app/globals.css:17` `hover:--lms-primary=#26bac7`, 150ms | Exact source-level token/timing match; global coverage still open |
| Breadcrumb separators and wrap | No universal breadcrumb reference verified in legacy SCSS | `src/components/ui/breadcrumbs.tsx:11-25` slash separator, flex-wrap, aria-current | Missing legacy value proof |
| Link safety | Security invariant, not legacy aesthetic | `src/components/ui/page-back-link.tsx:19`, `breadcrumbs.tsx` safe internal href | Preserved |
| Converted back links | Existing bespoke header actions | `admin/projects/templates/new`, `workspaces/new`, `templates/[templateId]`, `versions/[versionId]`, `admin/tenants/create`, `tenants/setup`, `admin/settings/auth`, `project-workspace-readiness` | 8 caller sites converted; not all |

## E6. Card-only-for-distinct-objects

| Legacy policy | Current example | Result |
| --- | --- | --- |
| `old-lms-pages.md:5,13`: continuous ordinary content, cards only real objects/report tiles, row hairlines | `src/components/projects/project-admin-at-risk-page.tsx:86-109` independent risk bucket links remain selectable cards, workspace rows use `divide-y` / `border-b` | Correct exception for interactive bucket tiles |
| `old-lms-shell-spec.md:20`: no stacked page-level card borders | `src/components/projects/project-admin-missing-college.tsx:5-13` nested main removed | Corrected one shell duplication |
| Same rule | `src/components/courses/college-course-missing-scope.tsx:3-7` nested bordered main replaced with alert div | Corrected one shell duplication |
| Distinct project/workspace objects may remain cards | `src/components/projects/project-list.tsx:81` interactive `Link` cards; `project-admin-workspace-list.tsx:112` individual workspace tiles | Explicit interactive-object exception, browser check pending |
| Arbitrary wrapper duplicates forbidden | `src/components/projects/project-workspace.tsx` numerous independently bordered inner sections; `src/app/(authenticated)/learn/my-placements/**` wrapper variants | **Outstanding:** classify each border and flatten presentation-only cards safely |

## Inventory and reproducible grep plan

Actual connector-backed source inspection: **37 of 37** numbered last-third Super Admin route files (entries 75–111 of `docs/orchestrator/ui-ux/pages-admin.md`) inspected at current-main baseline using `fetch_file`. Direct literal `<h1` in these **page.tsx files: 0**; direct `<PageCanvas` in those pages: 0; direct extra `<main` in those pages: 0. Several routes delegate to imported components — no claim that delegated titles are covered. The first-party `PageHeader` also remains in the single shared `src/components/ui/page-header.tsx`. Existing `docs/audit/ux/north-star-sweep-chat-9.md` describes an earlier upstream sweep of 37 routes and 61 Projects components; it is not a certification for this pass.

GitHub index, **not** a whole-tree grep: `<h1 path:src/app/(authenticated)/admin` returned **2** matching admin error boundary files outside the normal page list. `<h1 path:src/components` returned **20** source files at search time, including public/auth pages (intentional exemptions) and several authenticated imported workspace components; several have since been converted. Search for `PageCanvas` returned **2 production implementation files** (shared canvas and authenticated layout; documents were also in results). Indexed search for `rounded-xl border bg-surface p-5` returned **50 results**, including distinct project cards and ordinary list surfaces, with no complete repo coverage guarantee.

**Commands to run in a real checked-out worktree — NOT EXECUTED, counts UNAVAILABLE:**

```bash
grep -RnlE '<h1([[:space:]>])' src/app --include='*.tsx' | tee /tmp/page-h1.txt | wc -l
grep -RnlE '<h1([[:space:]>])' src/components --include='*.tsx' | tee /tmp/component-h1.txt | wc -l
grep -RnlE '<PageCanvas([[:space:]>])' src/app --include='*.tsx' | wc -l
grep -RnlE '<main([[:space:]>])' src/components --include='*.tsx' | wc -l
grep -RnlE 'rounded-(xl|2xl|lg).*border|border.*rounded-(xl|2xl|lg)' src/app src/components --include='*.tsx' | tee /tmp/nested-card-suspects.txt | wc -l
grep -RnlE 'Breadcrumbs|PageBackLink' 'src/app/(authenticated)' src/components --include='*.tsx' | wc -l
grep -RnlE 'max-w-|mx-auto|bg-white.*rounded|p-6.*border' 'src/app/(authenticated)' --include='*.tsx' | wc -l
```

Run these plus an import/delegate walk and capture actual file lists, exemptions and before/after counts before ticking B5/B6/E6. Validate widths at 320px, 390px, 767px, 768px, 991px, 1024px and 1199px. Review hover/active/focus/disabled/loading/error/empty where applicable. Recheck JSX opening/closing names and the `as` casts once TS checks are permitted.

## New changes in this lane

Shared `PageHeader` now supports responsive phone title/subtitle and stacked actions, and an optional `id` for existing aria-labelledby. New shared `PageBackLink` is consumed by eight Super Admin/Projects pages. One authenticated course notice and a Projects missing-scope state no longer nest a second main landmark. The learner drive detail now reuses `PageHeader` and `Breadcrumbs`. Imported Verification, TPO report errors, TPO recruiter leads and mentor board/allocation titles have been migrated onto `PageHeader` without intentionally changing their controls/data. Existing legacy wording is retained.

## Next files and blockers

Continue `src/components/tpo/tpo-company-memory-workspace.tsx` header, `src/components/tpo/recruiter-lead-detail-workspace.tsx`, `src/components/profile/learner-profile-workspace.tsx`, `src/components/attendance/faculty-attendance-workspace.tsx`, then `src/components/courses/learner-quiz-attempt.tsx` and remaining genuine authenticated page h1 imports. Follow with full grep-driven card wrapper classification and per-screen responsive checks. Reintegrate upstream `main` when it stops moving rapidly; do not reset branch or overwrite other lane files. No test/CI/runtime/visual verification performed as directed.

## Work queue — bounded turn, 2026-10-19 (chat-9)

**Branch integration:** commit `02d01f48` integrated `main` at `d915bd67` into `chatgpt/chat-9-b` using a two-parent merge, preserving the lane's 29 pre-existing commits. This was **not** a literal git rebase: the connected GitHub interface did not expose a checked-out worktree. Non-overlapping files inherited main; six overlaps were replayed onto current-main file contents, with the TPO company header reconciled separately. No edits were pushed to `main`.

**Shared header:** `src/components/ui/page-header.tsx:26-50` now matches the legacy listing header separator, mobile/desktop bottom spacing, desktop action gap and top inset:

| State/property | Legacy source:line | vNext source:line | Source-level result |
| --- | --- | --- | --- |
| Desktop full-width row | `legacy-styles/components___listing-page-header.scss:26-32` flex/width 100%/gap 24px | `page-header.tsx:26-30` flex/md gap-6/w-full | Match |
| Divider | `legacy-styles/components___listing-page-header.scss:33-35` border-bottom 1px solid `#e5e9f0` | `page-header.tsx:28` border-b with `--lms-canvas-border` | Match in source |
| Desktop bottom spacing | `legacy-styles/components___listing-page-header.scss:33-35` margin-bottom 16px/padding-bottom 16px | `page-header.tsx:28` md:mb-4/pb-4 | Match |
| Phone bottom spacing | `legacy-styles/components___listing-page-header.scss:131-135` margin-bottom 8px/padding-bottom 16px | `page-header.tsx:28` mb-2/pb-4 | Match |
| Desktop right actions | `legacy-styles/components___listing-page-header.scss:80-85` flex/gap16px/padding-top8px | `page-header.tsx:49` md:flex-row/md:gap-4/md:pt-2 | Match for shared action container |
| Phone actions | `legacy-styles/components___listing-page-header.scss:149-154` width100%, column, top inset zero, top margin4px | `page-header.tsx:49` w-full/flex-col/mt-1; md:pt-2 | Match |
| Desktop title/subtitle | `old-lms-shell-spec.md:26-28` h1 30px/600/`#172033`; `legacy-styles/components___listing-page-header.scss:45-49` baseline gap16 | `page-header.tsx:30-45` h1 scoped 30px/600, inline muted subtitle/gap-4 | Match measured TPO on source values |

**Remaining discrepancy:** legacy listing SCSS specifies 28px/1.3 headings while measured TPO shell specifies 30px/1.35; the measured TPO value is used. The full visual/interaction contract is **not** certified. No app, tests, typecheck, screenshots or CI were run.

### Converted from literal `<h1>` into shared `PageHeader` (27 files)

The following are individually fetched and updated on the lane branch, with their original error/loading copy and control handlers left intact. They are *coverage progress*, not a completed global grep:

- [x] `src/app/(authenticated)/admin/settings/error.tsx`
- [x] `src/app/(authenticated)/hr/profile/error.tsx`
- [x] `src/app/(authenticated)/tpo/students/error.tsx`
- [x] `src/app/(authenticated)/mentor/reports/error.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/error.tsx`
- [x] `src/app/(authenticated)/hr/messages/error.tsx`
- [x] `src/app/(authenticated)/hr/activity/error.tsx`
- [x] `src/app/(authenticated)/tpo/requests/error.tsx`
- [x] `src/app/(authenticated)/learn/profile/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/error.tsx`
- [x] `src/app/(authenticated)/learn/calendar/error.tsx`
- [x] `src/app/(authenticated)/mentor/reviews/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/error.tsx`
- [x] `src/app/(authenticated)/teacher/profile/error.tsx`
- [x] `src/app/(authenticated)/teacher/results/error.tsx`
- [x] `src/app/(authenticated)/admin/attendance/error.tsx`
- [x] `src/app/(authenticated)/tpo/verification/error.tsx`
- [x] `src/app/(authenticated)/learn/attendance/error.tsx`
- [x] `src/app/(authenticated)/mentor/activity/error.tsx`
- [x] `src/app/(authenticated)/college/attendance/error.tsx`
- [x] `src/app/(authenticated)/teacher/live-classes/error.tsx`
- [x] `src/app/(authenticated)/mentor/task-reviews/error.tsx`
- [x] `src/app/(authenticated)/activity/loading.tsx`
- [x] `src/app/(authenticated)/college/verification/loading.tsx`
- [x] `src/app/(authenticated)/tpo/settings/see/error.tsx`
- [x] `src/app/(authenticated)/tpo/settings/team/error.tsx`
- [x] `src/app/(authenticated)/learn/allQuizzes/error.tsx`

### Open proof and next work

- [ ] **B5 global coverage**: GitHub indexed code query `<h1 path:src/app` returned 50 items at the search limit, *not* a whole-repository count. Exempt public/auth routes separately; inventory any remaining dynamic titles by following imported components. Worktree command still needed: `grep -RnlE '<h1([[:space:]>])' src/app --include='*.tsx'`.
- [ ] **B5 breadcrumbs/back links**: full caller and interactive-state audit pending.
- [ ] **B6 responsive**: check 320, 390, 767, 768, 991, 1024, 1199px; no browser verification or whole-repo grep was performed.
- [ ] **E6 nested cards**: classify every remaining container. Existing interactive project tiles remain exempt until specifically evidenced.
- [ ] **Last-third Super Admin + Projects delegated components**: the earlier 37/37 route inventory had zero direct ordinary `page.tsx` h1, but imported components, error boundaries and individual cards remain open.
- [ ] **Skipped** `src/app/(authenticated)/learn/courses/error.tsx` from automatic plain-text heading replacement because it did not match the safe literal-heading rule. Review manually.

**Next exact file:** `src/components/projects/project-admin-workspace-list.tsx` — classify project workspace cards against E6, then resume remaining admin error-page `<h1>` migration and source-only grep inventory. B5/B6/E6 category ticks remain **open** under the strict rule.

## Work queue — follow-up bounded turn, 2026-10-19 (chat-9)

- **Upstream first:** Current `main` `46cd0161a0e289e7da68e615359589b03ee463e9` contained the entire prior lane branch `de9bdd6`; fast-forwarded `chatgpt/chat-9-b` to it before edits. No commits made to `main`.
- **Batch:** 39 individual `[chat-9]` code commits on the lane branch: 36 authenticated recovery-page title migrations (shown below), 1 TPO Everyone page-head/back-link migration, 2 Projects admin workspace-list changes. One separate audit commit records the work, bringing this bounded turn to 40 commits total.
- **No verification overclaims:** no runtime application, CI, test suite, TypeScript compiler, browser screenshot or recursive worktree grep executed. A GitHub code index is insufficient to certify zero remaining `<h1>` sites.

### Value-by-value checks (source inspection; category still open)

| Element and state | Old LMS value (file:line) | vNext result (file:line) | Finding |
| --- | --- | --- | --- |
| Canvas background/border/radius/padding | `docs/design/old-lms-shell-spec.md:18-20`, white, 1px `#e5e9f0`, 12px, 24px | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/layout.tsx:147-156` | Shared single canvas retained unchanged; descendant audit still open |
| Page title/subtitle/actions | `docs/design/old-lms-pages.md:5-6`: title and subtitle inline, actions right; `legacy-styles/components___listing-page-header.scss:26-35,45-49,80-85` | `src/components/ui/page-header.tsx:26-53`; `src/app/(authenticated)/tpo/team/everyone/page.tsx:23-25` | TPO Everyone hand-built header removed, keeping constant title/description |
| Back link, desktop/mobile | `legacy-styles/components___learn-layout.scss:362-383`: 44px target, muted hover, hide label max 767px | `src/components/ui/page-back-link.tsx:18-29`; `tpo/team/everyone/page.tsx:23-25` | Shared back affordance, destination retained; complete color proof remains open |
| Workspace grid, phone/tablet/desktop | `legacy-styles/components___variables.scss:148-159`: legacy thresholds 767px, 991px/992px and 1365px/1366px | `src/components/projects/project-admin-workspace-list.tsx:107`: 1 column below 992px, 2 at 992px, 3 at 1366px | Static breakpoint alignment; actual layout screenshots missing |
| Ordinary inner metric presentation | `docs/design/old-lms-pages.md:5,13`; `old-lms-shell-spec.md:19-20`: hairlines within one surface, only real object tiles remain cards | `project-admin-workspace-list.tsx:134`: removed nested rounded muted metric block, now thin top/bottom and between-column lines | Presentation-only subcard flattened; real independent workspace article card retained |
| Error title/recovery actions | `old-lms-pages.md:5-6`: title typography follows shared page head | `src/components/ui/page-header.tsx:30-51`, 36 route-specific `error.tsx` callers | Original route-specific copy and retry handlers retained; cross-route visual acceptance unverified |

### Title migration file ledger — 36 further authenticated error routes

**TPO reports/settings/student/drive (18):**
- `src/app/(authenticated)/tpo/reports/leads/error.tsx`
- `src/app/(authenticated)/tpo/settings/rules/error.tsx`
- `src/app/(authenticated)/tpo/settings/season/error.tsx`
- `src/app/(authenticated)/tpo/settings/trusted/error.tsx`
- `src/app/(authenticated)/tpo/reports/unplaced/error.tsx`
- `src/app/(authenticated)/tpo/students/requests/error.tsx`
- `src/app/(authenticated)/tpo/settings/branding/error.tsx`
- `src/app/(authenticated)/tpo/settings/recruiters/error.tsx`
- `src/app/(authenticated)/tpo/reports/offers-expiry/error.tsx`
- `src/app/(authenticated)/tpo/reports/placed-branch/error.tsx`
- `src/app/(authenticated)/tpo/settings/notifications/error.tsx`
- `src/app/(authenticated)/tpo/reports/joining-status/error.tsx`
- `src/app/(authenticated)/tpo/reports/season-pipeline/error.tsx`
- `src/app/(authenticated)/tpo/reports/placement-summary/error.tsx`
- `src/app/(authenticated)/tpo/reports/offers-acceptance/error.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/error.tsx`
- `src/app/(authenticated)/tpo/students/[membershipId]/history/error.tsx`
- `src/app/(authenticated)/tpo/students/[membershipId]/participation/error.tsx`

**HR/college/learner (18):**
- `src/app/(authenticated)/hr/company/reports/error.tsx`
- `src/app/(authenticated)/learn/projects/error.tsx`
- `src/app/(authenticated)/learn/notifications/error.tsx`
- `src/app/(authenticated)/learn/allAssignments/error.tsx`
- `src/app/(authenticated)/learn/attendance/calendar/error.tsx`
- `src/app/(authenticated)/learn/allQuizzes/[quizId]/error.tsx`
- `src/app/(authenticated)/learn/projects/[projectId]/error.tsx`
- `src/app/(authenticated)/learn/profile/completeness/error.tsx`
- `src/app/(authenticated)/learn/my-placements/preparation/error.tsx`
- `src/app/(authenticated)/learn/profile/verification/error.tsx`
- `src/app/(authenticated)/learn/my-placements/support/error.tsx`
- `src/app/(authenticated)/learn/my-placements/interviews/error.tsx`
- `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/error.tsx`
- `src/app/(authenticated)/learn/my-placements/announcements/error.tsx`
- `src/app/(authenticated)/learn/allAssignments/[assignmentId]/error.tsx`
- `src/app/(authenticated)/learn/my-placements/notification-preferences/error.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/error.tsx`
- `src/app/(authenticated)/college/assignments/error.tsx`

Note: three connector read timeouts occurred on the first attempt for the learner verification/support/interviews pages; each succeeded on the second read and was committed. Source-level spot checks on `tpo/reports/leads/error.tsx`, `learn/allQuizzes/[quizId]/error.tsx`, `tpo/team/everyone/page.tsx`, and the Projects workspace list confirmed expected imports and `<PageHeader />` call sites; there was no executed syntax/type check.

### Strict tick rule — remains unfulfilled

- [ ] **B5 page head, canvas, back links:** static values compared; **missing** exhaustive page/delegated-component coverage grep, breadcrumb value source for all routes, focus/hover proof, no-regression/runtime rendering proof.
- [ ] **B6 responsive:** desktop/phone breakpoint token alignment on workspace objects; **missing** actual 320/390/767/768/991/1024/1199px visual comparisons for every portal and overflow controls.
- [ ] **E6 cards:** project workspace card is a valid independent object exception; nested metric panel flattened; **missing** all-portal card-wrapper inventory and exemption review.
- [ ] **Page-head grep:** indexed `<h1 path:src/app/(authenticated)` returns at most search-limit results, including stale recently converted files. Do **not** report a zero count. Run the full reproducible grep commands in this document when a checkout is available.
- [ ] **Next exact file:** `src/app/(authenticated)/learn/courses/error.tsx` — replace conditional dynamic `<h1>` with `PageHeader` safely, then audit its title-dependent error state; after that, inventory other JSX expression headings and breadcrumbs in the Super Admin last-third and Projects admin delegated components.

**Category summary:** no top-level B5/B6/E6 ticks added; the ledger is a record of bounded work, not full pixel-level certification.

## SMARTER PLAN codemod delegation

- [ ] **SMARTER PLAN codemod (chat-9, orchestration pending):** `scripts/codemods/chat9-page-header.cjs` scans authenticated `src/app/(authenticated)/**/*.tsx` plus authenticated workspace `src/components/{activity,admin,announcements,attendance,college,courses,hr,learn,learner,mentor,messaging,placements,profile,projects,tpo,verification}/**/*.tsx`; converts safe own `<h1>` title blocks to shared `PageHeader` with expression/ID preservation and simple inline subtitles, skips complex/action headers and public/overlay markup; dry-run `node scripts/codemods/chat9-page-header.cjs`, apply `node scripts/codemods/chat9-page-header.cjs --apply` (or `--scope=app|components --only=projects`); orchestrator must run locally, review skipped headings, typecheck, and commit transformed pages; B5/B6/E6 and breadcrumbs/responsive proof remain unticked.

- [ ] **Breadcrumbs / B6 responsive follow-up (source review, 2026-10-19):** `src/components/ui/breadcrumbs.tsx:13,17` now constrains each breadcrumb item/link to available width and switches from 44px phone touch targets to 36px control height at `md` (768px) rather than `sm` (640px); old breakpoint from `docs/design/legacy-styles/components___variables.scss:148,155` (767/768px) and source control height from `src/app/globals.css:328`. `src/components/ui/page-back-link.tsx:23,28` keeps min44px on phone, label hidden until 768px, and now uses exact hover accent `#26bac7` from `legacy-styles/components___learn-layout.scss:361-383` / `components___variables.scss:10`. No universal legacy breadcrumb separator rule has been found; do not tick B5/B6 without runtime and full caller proof.

## chat-9 larger bounded PageHeader sweep — 2026-10-19

**Work completed on branch:** 58 distinct authenticated TSX routes changed from a native, hand-styled opening/closing `<h1>...</h1>` into a self-closing shared `<PageHeader title={...} />`, plus one shared `page-header.tsx` responsive change (59 code commits). This audit update makes **60 commits in the turn**, each tagged `[chat-9]` and pushed only to `chatgpt/chat-9-b`. No CI, TypeScript execution, application run, or browser verification was performed.

**Re-read evidence:** all 58 changed route source files were fetched back from the branch individually after their commits. Each had zero literal `<h1>` occurrences, at least one `<PageHeader` caller and a matching `PageHeader` import. Opening and closing `h1` tags were replaced together. This is source review rather than compiler or pixel verification.

**Inventory by area (source-read paths):**
- 16 Mentor collection/detail `page.tsx` invalid-filter routes: reviews, calendar, reports, activity, projects, review-history, task-reviews, team-coverage, sprint-progress, task-review-history; and project timeline, team-history, risk-readiness, review-overview, board-review, team-meetings.
- 17 Mentor recovery `error.tsx` routes: project closeout, timeline, team-history, board-review, team-meetings, risk-readiness, review-overview, activity-history, review-completeness, resources-directory, task feedback, meeting notes, delivery review; plus task-review-history, review-history, sprint-progress, team-coverage.
- 12 Faculty recovery routes: profile contacts/teaching; notifications, response-followups, quiz report, delivery reports, assignment report, delivery students, quiz attempts, session coverage, assignment submissions, individual student.
- 2 College recovery routes: placements calendar and course-offering detail; 1 HR recruiter job detail error route.
- 1 Learner conditional heading: `learn/courses/error.tsx`, preserving the conditional `isList` copy.
- 9 restored shared titles that appeared in current-main source as raw `h1`: HR profile, messages, activity; TPO requests and students; learner profile and calendar; activity loading; Super Admin settings error.
- Shared header `src/components/ui/page-header.tsx:30-43`: desktop `md:flex-wrap`, title/subtitle no `md:truncate`, matching `docs/design/legacy-styles/components___listing-page-header.scss:45-49` flex-wrap instead of hiding long labels.

**Important orchestrator dependency:** `scripts/codemods/chat9-page-header.cjs` was already committed in the prior turn and is present on current `main`; its default operation is a dry-run inventory, and the orchestrator must run `node scripts/codemods/chat9-page-header.cjs --apply`, inspect skips, typecheck and commit generated changes. This lane has not executed the codemod. The indexed query `<h1 path:src/app/(authenticated)` previously returned 96 paths, but that index was stale: source re-read found many remaining raw h1 routes. Do not claim 100-page closure or zero raw headings.

**Strict tick status:** B5 title/canvas/breadcrumb and E6 card-in-card are still **[ ]**: automated coverage + exceptions and responsive/browser proof outstanding. B6 is still **[ ]**: breakpoint-source alignment on the header was improved but phone/tablet geometry has not been exercised. Independent project/workspace object cards are still exemptions, not general card-in-card wrappers.

**Next exact file:** `src/app/(authenticated)/mentor/reports/error.tsx` (confirmed raw h1 remains). Then `src/app/(authenticated)/learn/projects/error.tsx` and `src/app/(authenticated)/teacher/courses/error.tsx`; after codemod execution, handle complex/action-bearing titles from the skip report and classify nested card wrappers.

## B5/B6/E6 file-completion batch — 2026-10-19, chat-9

This batch migrates and source-verifies **18 recovery/error route files**. The authenticated layout already owns the sole `PageCanvas` (`src/app/(authenticated)/layout.tsx:140-156`). We removed nested decorative rounded/bordered error cards, redundant wrapper separators, and arbitrary local horizontal padding while keeping section content and `reset` handlers. Two faculty pages now retain `role="alert"`; a malformed ordering of `"use client"` on live classes was corrected. Two faculty course-error links now use responsive `PageBackLink`.

### File-level source inventory (18/18 source-verified)

| File under `src/app/(authenticated)/` | PageHeader line | Section line | Shared back link | Source checks |
| --- | ---: | ---: | ---: | --- |
| `mentor/reports/error.tsx` | 6 | 5 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `learn/projects/error.tsx` | 13 | 12 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `teacher/courses/error.tsx` | 8 | 7 | 12 | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `mentor/reviews/error.tsx` | 8 | 7 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `teacher/profile/error.tsx` | 13 | 12 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `tpo/reports/leads/error.tsx` | 14 | 13 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `hr/company/reports/error.tsx` | 17 | 13 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `teacher/results/error.tsx` | 10 | 9 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `teacher/live-classes/error.tsx` | 5 | 5 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `learn/my-placements/error.tsx` | 15 | 14 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `tpo/settings/season/error.tsx` | 14 | 13 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `tpo/settings/rules/error.tsx` | 14 | 13 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `tpo/settings/branding/error.tsx` | 17 | 13 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `mentor/activity/error.tsx` | 8 | 7 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `college/attendance/error.tsx` | 14 | 13 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `teacher/notifications/error.tsx` | 13 | 12 | 19 | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `mentor/team-coverage/error.tsx` | 10 | 9 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |
| `tpo/settings/notifications/error.tsx` | 17 | 13 | — | [x] 1 header; 0 raw h1; alert; no nested canvas card; client-first |

Each file above was fetched **after** its final change from `chatgpt/chat-9-b`. The connector-backed source scan evaluated `/<h1(?:\\s|>)/g` and `/<PageHeader\\b/g` against the exact file content: **18 files read, 0 native h1, 18 shared headers, 0 decorative outer card wrappers, 18 alert sections, 18 correctly placed client directives, 0 suspicious backslash-entity or stray quote markers**. This is scoped grep-equivalent source proof, *not* a claim that a checked-out repository-wide `git grep` was executed. No CI, tests, app, Playwright, or compiler run.

### Value comparison against old LMS sources

| Property | Legacy source:value | Shared/current implementation | Source result |
| --- | --- | --- | --- |
| One large canvas, white background, 1px neutral-200 border, 12px radius, 24px padding, no shadow | `docs/design/old-lms-shell-spec.md:18-20` | `src/components/ui/page-canvas.tsx:13-23`, authenticated `layout.tsx:147-156` | [x] Every scoped route inherits one canvas; the 18 root error sections add no presentation card |
| Page title 30px, weight 600, color #172033 | `old-lms-shell-spec.md:26-28` (measured legacy TPO) | `src/components/ui/page-header.tsx:28-38`; `src/app/globals.css:324,363-369` | [x] Desktop values source-matched to measured reference |
| Head divider border1px, bottom padding16px and margin16px | `components___listing-page-header.scss:26-35` | `page-header.tsx:26-29` border-b/pb-4/md:mb-4 | [x] One divider owned by shared header, no second wrapper divider |
| Mobile header 20px title, 8px vertical gap, margin-bottom8px, actions full width column | `components___listing-page-header.scss:130-154` at max767px | `page-header.tsx:28-49` (md breakpoint 768, mobile 20px CSS variable and flex-col / w-full) | [x] Source-derived breakpoint values match |
| Title/subtitle wrap at desktop gap16px, tracking -0.02em | `components___listing-page-header.scss:45-58` | `page-header.tsx:30-45` md:flex-wrap/md:gap-4/tracking-[-0.02em] | [x] Source rule; text not truncated |
| Back-link 44px touch target and label hidden on phones, hover tint color .15s | `components___learn-layout.scss:361-383` | `src/components/ui/page-back-link.tsx:18-29`; used in faculty courses/notifications errors | [x] Source values/semantic destination retained |
| Action recovery correctness | Existing vNext `reset`/Retry and back links | All 18 route source files in table | [x] Retry handler preserved; exception panel remains an accessible alert |

**Known alternate legacy variant:** `components___listing-page-header.scss:52-60` calls for a 28px/1.3 desktop title, whereas the measured legacy TPO shell reference uses a 30px title; the shared header follows measured TPO 30px and 1.35 line height. This variant remains unresolved for full cross-portal B5 certification.

### Responsive source-proof matrix

| Class | Widths checked against breakpoint logic | Legacy breakpoint | Shared JSX/CSS behavior | Coverage |
| --- | --- | --- | --- | --- |
| Phone narrow | 320px, 390px, 767px | max-width:767px | PageHeader mobile `flex-col`, 20px title, stacked full-width actions; back label hidden | same selectors for all 18 |
| Tablet start | 768px, 991px | min-width:768px | PageHeader desktop `flex-row`, 30px title, actions shrink to right; back label visible | same selectors for all 18 |
| Tablet wide | 1024px, 1199px | min-width:768px | PageHeader remains row, title/subtitle flex-wrap and `break-words`, avoiding clipped heading | same selectors for all 18 |

Rules were compared statically using `components___variables.scss:148-159` and `components___listing-page-header.scss:130-154` versus `page-header.tsx:26-49`. The one canvas owns padding and borders; its inline `padding:var(--lms-canvas-padding)` wins over old mobile overrides. **No rendered viewport measurements or screenshots** were performed; separate visual acceptance remains open.

### Still-open category-level proof

- [ ] B5 whole-repo PageHeader and breadcrumbs: these 18 routes have source proof, not full authenticated route/delegated component coverage. The orchestrator has not yet run `scripts/codemods/chat9-page-header.cjs --apply` in a checkout.
- [ ] B6 global responsive: this batch's shared header breakpoint mapping is source-reviewed, but no phone/tablet browser overflow, control placement, or disabled/focus checks have run.
- [ ] E6 global card boundaries: these 18 root error wrappers are flattened; independent interactive object tiles and other portals still need classification.

**Exact next file:** `src/app/(authenticated)/tpo/settings/recruiters/error.tsx` (confirmed native h1 present at last source inspection). Continue TPO settings error routes and adjacent learner/faculty recovery files; update individual source inventories before any global tick.

## chat-9 scoped TPO page-head completion — 2026-10-19

**Integration:** upstream `main` was merged into the lane preserving nonconflicting changes and the newer upstream HR error states. The previously owned `clone-page-anatomy.md` section was retained because the upstream copy was its exact prefix. All work below was committed exclusively to `chatgpt/chat-9-b`.

### Completed files and source-grep output

| File under `src/app/(authenticated)/` | PageHeader source line | Root section line | PageBackLink line | Per-file grep/markup result |
| --- | ---: | ---: | ---: | --- |
| `tpo/settings/recruiters/error.tsx` | 21 | 17 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/reports/unplaced/error.tsx` | 14 | 13 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/students/requests/error.tsx` | 17 | 13 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/reports/offers-expiry/error.tsx` | 6 | 5 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/reports/placed-branch/error.tsx` | 6 | 5 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/reports/joining-status/error.tsx` | 14 | 13 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/reports/season-pipeline/error.tsx` | 7 | 6 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/reports/placement-summary/error.tsx` | 14 | 13 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/reports/offers-acceptance/error.tsx` | 14 | 13 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/placements/jobs/[jobId]/edit/error.tsx` | 9 | 8 | 13 | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/students/[membershipId]/history/error.tsx` | 11 | 10 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/students/[membershipId]/participation/error.tsx` | 14 | 13 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/settings/see/error.tsx` | 17 | 13 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/settings/team/error.tsx` | 17 | 13 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/verification/error.tsx` | 7 | 6 | 11 | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |
| `tpo/students/error.tsx` | 17 | 13 | — | [x] native h1=0, shared PageHeader=1, extra outer canvas=0 |

**Connector-backed grep equivalent** (each of the 16 files fetched *after its last write* from the lane branch):

- Pattern `/<h1(?:\\s|>)/g`: **0 matches across all 16 files**.
- Pattern `/<PageHeader\\b/g`: **16 matches total, exactly 1 per file**.
- Every file: `PageHeader` imported, `"use client"` directive first, `<section role="alert">` and its `</section>` retained, `onClick={reset}` retained.
- Outer decorative rounded/bordered `<section>` wrappers: **0** in these 16 files after the pass; layout uses shared authenticated `PageCanvas` once (`src/app/(authenticated)/layout.tsx:147-156`).
- Two recovery navigation destinations preserved: `/tpo/placements/lifecycle` and `/tpo/students`, now via the 44px shared `PageBackLink`.
- No suspicious escaped apostrophe sequences or stray opening-tag quote markers in the scoped checks.
- These are scoped file-content inspections; **not** a whole-tree `git grep`, executed typecheck, or browser screenshots.

### Legacy and vNext value table

| Property | Old LMS reference | vNext implementation | Outcome |
| --- | --- | --- | --- |
| One page canvas | `old-lms-shell-spec.md:18-20`: white #fff, border 1px #e5e9f0, radius 12px, padding 24px, no shadow | `src/app/(authenticated)/layout.tsx:147-156`; `src/components/ui/page-canvas.tsx:13-23` | [x] Inherited once for these 16 routes; no duplicate outer error card |
| Heading desktop | `old-lms-shell-spec.md:26-28`: 30px, 600, #172033 | `src/components/ui/page-header.tsx:31-38`, heading token `src/app/globals.css:324` | [x] Shared source maps to measured legacy shell |
| Header divider/space | `legacy-styles/components___listing-page-header.scss:26-35`: bottom 1px neutral200; padding16px/margin16px | `page-header.tsx:26-29`: 1px canvas-border, pb-4, md:mb-4 | [x] Single header separator, removal of redundant route section borders |
| Phone header | `listing-page-header.scss:130-154`: max767px, 20px title, 8px gap, actions stack | `page-header.tsx:26-49`: mobile flex-col, 20px title via CSS variable, gap2 (8px), full-width actions | [x] Static breakpoint/value comparison |
| Tablet title/subtitle | `listing-page-header.scss:45-49`: baseline, gap16px, wrap | `page-header.tsx:30-45`: md:items-baseline, md:gap-4, md:flex-wrap | [x] Static comparison; no truncation |
| Back-link touch/focus | `components___learn-layout.scss:361-383`: 44px hit area, label hidden up to767px, muted to teal hover in .15s | `page-back-link.tsx:18-29`: min-h-11/min-w-11, hidden md:inline label, duration-150 teal hover, focus-visible outline | [x] Scoped source proof for two returned-link callers; no rendered a11y test |
| Recovery behavior | Existing vNext errors | All 16 `error.tsx` files in table | [x] Retry `reset` handlers and warning copy retained |

**Source responsive matrix:** at 320, 390 and 767px the header remains the mobile 20px stacked mode and back label hidden; at 768, 991, 1024 and 1199px the `md` row/30px heading and visible back label apply. This follows `legacy-styles/components___variables.scss:148-159` breakpoint sources; it is a **static rule trace**, not measured visual output. Exact browser geometry and cross-portal overflow testing are still open.

**Strict tick scope:** 16 *file-level* source checks completed, but parent B5/B6/E6 audit checkboxes remain **[ ]** for global coverage, visual/interaction proof, other page variants and card-wrapper exemptions. Do not infer repo-wide zero counts.

**Next batch:** `src/app/(authenticated)/tpo/settings/trusted/error.tsx` (verify whether shared `ErrorState` already owns title) followed by `src/app/(authenticated)/tpo/reports/*/error.tsx` leftovers and learner/mentor recovery surfaces that still have source-level nested wrappers.

## Replacement chat-9 bounded turn — 2026-10-19, source-verified file batch

**Upstream and branch:** at turn start `chatgpt/chat-9-b` was nine commits ahead but 640 behind `main`. An explicit two-parent integration merge `857c9d5391ed7b8d2b276ef890717b03914ec554` used `main` `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0` as the base tree and preserved the nine newer page-head commits and this audit. This is a **merge**, not a literal `git rebase`, because the connected GitHub operations expose no checked-out git worktree. All writes target `chatgpt/chat-9-b`, never `main`.

### File-complete Work queue: shared PageHeader and single canvas (20)

Each line below means a connector fetch *after the write* confirmed **0** literal native `<h1>`, **1** `<PageHeader>` caller, **1** `PageHeader` import, unchanged `reset` action on each `error.tsx`; `college/verification/loading.tsx` retains `GracefulPageLoading`. All remain inside the authenticated layout's single `PageCanvas`, with no new outer decorative canvas card. This is **scoped source verification, not a repository-wide `git grep`**.

- [x] `src/app/(authenticated)/tpo/requests/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/learn/profile/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/mentor/reviews/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/teacher/results/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/mentor/activity/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/admin/attendance/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/learn/attendance/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/mentor/reports/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/learn/allQuizzes/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/mentor/task-reviews/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/tpo/reports/unplaced/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/tpo/reports/offers-expiry/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/tpo/reports/placed-branch/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/tpo/reports/season-pipeline/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/tpo/reports/joining-status/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/tpo/reports/placement-summary/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/learn/projects/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/college/verification/loading.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)
- [x] `src/app/(authenticated)/tpo/reports/leads/error.tsx` (source-scan: native h1=0, PageHeader=1; copy/action retained; md=768px source-breakpoint)

### File-complete Work queue: back links, breadcrumbs, E6 (10)

- [x] `src/components/projects/project-workspace.tsx` (source inspected: native h1=0, shared PageBackLink used; 1 shared breadcrumb + 1 back link; eight info subcards flattened; 22 section pairs preserved)
- [x] `src/components/projects/project-workspace-readiness.tsx` (source inspected: native h1=0, shared PageBackLink used; three state-specific Back links; retry views and successful header intact)
- [x] `src/components/projects/project-admin-reassign-mentor-page.tsx` (source inspected: native h1=0, shared PageBackLink used; one PageHeader action back link; other route filters retained)
- [x] `src/components/projects/super-admin-template-subview-page.tsx` (source inspected: native h1=0, shared PageBackLink used; template catalogue back link; create-workspace action intact)
- [x] `src/components/projects/project-admin-missing-college.tsx` (source inspected: native h1=0, shared PageBackLink used; dashboard recovery back link; warning message intact)
- [x] `src/app/(authenticated)/admin/tenants/setup/page.tsx` (source inspected: native h1=0, shared PageBackLink used; denied/error dashboard recovery link; normal header unchanged)
- [x] `src/app/(authenticated)/admin/tenants/create/page.tsx` (source inspected: native h1=0, shared PageBackLink used; denied/error dashboard recovery link; normal header unchanged)
- [x] `src/app/(authenticated)/admin/projects/templates/new/page.tsx` (source inspected: native h1=0, shared PageBackLink used; error + normal header both use back link)
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx` (source inspected: native h1=0, shared PageBackLink used; denied/error and success back links; filters and retry retained)
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx` (source inspected: native h1=0, shared PageBackLink used; denied/error/history and success back links retained)

### Source value proof (scope = above 30 files)

| Property / state | Legacy source (exact value and line) | vNext source (exact value and line) | Scope outcome |
| --- | --- | --- | --- |
| Authenticated page surface | `docs/design/old-lms-shell-spec.md:18-20`: #ffffff, solid 1px #e5e9f0, 12px radius, 24px padding, no shadow on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/layout.tsx:147-156` | Inherited canvas; recovery-page outer rounded cards removed |
| Desktop title | `docs/design/old-lms-shell-spec.md:26-28`: 30px, 600, #172033 | `src/components/ui/page-header.tsx:30-38`, `src/app/globals.css` heading token | Shared title for 20 recovery/loading views |
| Header separator/spacing | `docs/design/legacy-styles/components___listing-page-header.scss:26-35`: 1px neutral200, padding-bottom16px, margin-bottom16px | `src/components/ui/page-header.tsx:25-28`: border-b/pb-4/md:mb-4 | Nested section border removed where redundant |
| Title/subtitle alignment | `components___listing-page-header.scss:45-58`: baseline, flex-wrap, gap16px, tracking -.02em | `src/components/ui/page-header.tsx:28-45`: md:items-baseline, md:flex-wrap, md:gap-4 | Shared head, page-specific descriptions intact |
| Phone head | `components___listing-page-header.scss:130-154`: at <=767px, 20px title, stacked actions, gap8px | `src/components/ui/page-header.tsx:25-49`: before md=768px, 20px title, flex-col, gap-2 and full-width actions | Static breakpoint alignment only |
| Back-link tap and label | `components___learn-layout.scss:361-383`: min44x44, hide label at <=767px, teal hover #26bac7 at 150ms | `src/components/ui/page-back-link.tsx:18-29`; callers in ten files | Shared mobile-safe back link, aria label preserved |
| Breadcrumb presentation | `old-lms-pages.md:5-6`: page head and back context; universal slash rule not established | `src/components/ui/breadcrumbs.tsx:7-25`, `project-workspace.tsx:303-319` | Workspace custom nav moved to shared breadcrumbs; legacy exact separator proof still open |
| E6 information sections | `old-lms-pages.md:5,13`: single white page; cards only genuine separate objects, plain content separated by hairlines | `src/components/projects/project-workspace.tsx` definition of done, roles, task progress, completion chart, final submission and mentor info use `border-b pb-*` | 8 cosmetic subcards flattened; member cards and risk/status banners intentionally retained |
| Retry/error semantics | Existing vNext error views have retry/back actions (behavior kept, not a legacy restyle target) | All 19 `error.tsx` routes in ledger: `onClick={reset}` remains; respective `role=alert` where applicable | Source invariant preserved; runtime click not executed |

### Verification proof and open category gates

- **Source re-fetch**: 15/15 recovery files passed in batch one; 5/5 remaining recovery/loading plus 10/10 Projects and Super Admin pages passed in batch two. All 30 changed file paths have zero literal native h1; exact PageHeader counts and shared navigation checked; section opening/closing counts in `project-workspace.tsx` remained 22/22. The scoped source scan used JS regex equivalents of `<h1(?:\\s|>)`, `<PageHeader\\b`, `<PageBackLink\\b`, and source-string import/handler checks. **A checked-out recursive grep was not run.**
- **Responsive source trace**: `components___variables.scss:148-159` phone max767px / tablet min768px versus `PageHeader` md768 and `PageBackLink` md768. Source class rules assessed at 320/390/767/768/991/1024/1199px; no browser or computed-style verification.
- **No execution**: no TypeScript compiler, CI, tests, app server, code runner, snapshots or pixel comparison. No global claim of zero remaining dynamic `<h1>`, breadcrumbs or nested cards. Existing alternate 28px legacy listing title versus measured 30px TPO title remains unresolved.
- [ ] **B5 parent** remains open: full repo grep including imported titles, complete legacy breadcrumbs value rows, state/geometry proof.
- [ ] **B6 parent** remains open: phone/tablet computed responsive geometry and overflow per portal.
- [ ] **E6 parent** remains open: all-portal card-in-card inventory; retained separately meaningful object tiles need a global exception ledger.

**Next exact file:** `src/components/projects/class-team-workspace-creator.tsx` — distinguish individual team-selection cards from redundant preflight/status wrappers, then `src/components/projects/project-template-view.tsx`; resume global dynamic-heading and breadcrumb inventory when a worktree grep is available.

## Next bounded chat-9 E6/B6 batch — Projects and Super Admin, 2026-10-19

**Scope:** 14 fully source-inspected Projects TSX components, all committed to `chatgpt/chat-9-b`; `main` was at `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0` and the lane began 0 commits behind. Existing content, copy, request handlers, permissions, form data, navigation routes and controls were not intentionally changed. Legacy references are the measured `docs/design/old-lms-shell-spec.md:18-20`, `old-lms-pages.md:5-13`, and `legacy-styles/components___variables.scss:30-42, 133-140, 148-159`.

### Work queue — completed files (file-scoped, not category sign-off)

| File (prefix: `src/components/projects/`) | Current source evidence, file:line | E6 classification / change | B6 static responsive evidence |
| --- | --- | --- | --- |
| [x] `class-team-workspace-creator.tsx` | `class-team-workspace-creator.tsx:162-164, 212-215, 233-234, 266` | Status/preflight/outcome use hairlines; scroll focus retained; editable team fieldsets/cards kept | 768px form fields; 992px team-preview cards |
| [x] `project-template-view.tsx` | `project-template-view.tsx:77, 93, 145-150` | Read-only releases/sprints/tasks/resources list rows use divide-y+border-y; no article cards | 992px section grid; rows wrap |
| [x] `project-list.tsx` | `project-list.tsx:76-81, 131` | Separate clickable project cards remain; nested metric panel becomes hairline strip | 425px metric columns; 992px two tiles; 1366px three |
| [x] `super-admin-template-resource-editor.tsx` | `super-admin-template-resource-editor.tsx:50, 64-78` | Resource-specific editable fieldsets retained; no extra page wrapper | 768px two-column resource form |
| [x] `super-admin-template-plan-editor.tsx` | `super-admin-template-plan-editor.tsx:160-163, 214-217` | Sprint and task fieldsets retained as independently editable objects | 768px two-column input grids |
| [x] `super-admin-template-overview-editor.tsx` | `super-admin-template-overview-editor.tsx:53, 58-75` | Ordinary form labels remain on canvas; no separate panel | 768px two-column editor |
| [x] `super-admin-template-create-form.tsx` | `super-admin-template-create-form.tsx:39, 55, 66, 101` | Overview/resource sections flattened from rounded cards to border-y hairlines | 768px two-column fields; 44px controls remain shared |
| [x] `super-admin-template-college-bulk.tsx` | `super-admin-template-college-bulk.tsx:48, 59-65` | Selectable college cards flattened to border-b rows, labels remain functional | 768px two-column options; 44px targets; long names wrap |
| [x] `project-admin-submissions-page.tsx` | `project-admin-submissions-page.tsx:168-176, 241` | Four summary cards are genuinely separate metrics; read-only detail rows remain hairline | 768px two metric columns; 1366px four; details three at 768 |
| [x] `project-admin-at-risk-page.tsx` | `project-admin-at-risk-page.tsx:81-101, 145` | Three filter bucket links are genuinely separate interactive targets; results remain divide-y | 768px three bucket columns + detail columns |
| [x] `project-create-control.tsx` | `project-create-control.tsx:331-342` | Roster section became border-b; scrollable selection region and live controls unchanged | 44px roster rows with wrapping; narrow phone safe |
| [x] `admin-readiness-workspace-picker.tsx` | `admin-readiness-workspace-picker.tsx:20-27, 30-39` | Bordered fieldset is a distinct bounded scroll/listbox control, not a page subcard | 44px radio labels; min-width0/wrapping; paginator wraps |
| [x] `project-template-controls.tsx` | `project-template-controls.tsx:200` | Native 3-field template form responsive breakpoint aligned | 992px three fields; single below |
| [x] `project-admin-collection-controls.tsx` | `project-admin-collection-controls.tsx:210-243` | Pagination links preserve disabled routes; shared radius and focus styles, no enclosing card | 44px targets below 768px /36px at desktop, flex wrap |

### Value-by-value source table

| Property and state | Exact legacy property, file:line | Current vNext property, file:line | Result / deliberate exception |
| --- | --- | --- | --- |
| Outer page canvas default | `old-lms-shell-spec.md:18-20`: one `#fff` 12px-radius, 1px `#e5e9f0` border, padding24px, no shadow, on shell `#f1f4f9` | Authenticated `layout.tsx:147-156` + `ui/page-canvas.tsx:13-23`; scoped 14 components: **0** `<PageCanvas` and **0** `<main` | Matches existing shared outer surface; independent workspaces do not create another |
| Ordinary content panels default | `old-lms-pages.md:5,13`: ordinary content separated by whitespace and hairline borders, no presentation-only card-in-card | `class-team-workspace-creator.tsx:162-163,212,266`; `super-admin-template-create-form.tsx:55,101`; `project-create-control.tsx:331` | Decorative card wrappers changed to `border-b`/`border-y`, color token `border-border` (`#e5e9f0`) |
| Read-only list rows | `old-lms-pages.md:9-10`: tables/list rows directly on canvas, hairline row dividers | `project-template-view.tsx:145-150`: `divide-y divide-border border-y border-border`, no `rounded-lg border bg-muted` per article | Matches list treatment |
| Distinct object card radius/border | `variables.scss:30,134`: 1px neutral200 `#e5e9f0`, radius12px; `old-lms-pages.md:13` allows genuine object tiles | `project-list.tsx:81`, `project-admin-submissions-page.tsx:176`, `project-admin-at-risk-page.tsx:87-92` | Cards retained only for independently selectable projects, metric tiles and bucket filters |
| Team-specific editable object | `old-lms-pages.md:13`: genuinely separate objects may be individually bordered; `variables.scss:30` neutral200 | `class-team-workspace-creator.tsx:233-261`: group-specific card, reassign/swap selects | Explicit E6 exception: each group separately editable; no card-in-card |
| Semantic grouped form fieldsets | `variables.scss:30,134`: hairline border, radius12px for distinct surfaces; `old-lms-pages.md:13` true object sections retained | `super-admin-template-resource-editor.tsx:50` resource fields; `super-admin-template-plan-editor.tsx:160-203,214+` sprint/task objects | E6 justified exception; no redundant outer card around the form |
| Scroll-region boundary | `old-lms-pages.md:10`: bordered data area; `variables.scss:30` neutral200 | `admin-readiness-workspace-picker.tsx:20-29`: one bordered max-h64 scrollable selection control; `class-team-workspace-creator.tsx:215` no second border surrounding DataTable | Picker border is control boundary, not a page section card |
| Metrics inside object card | `old-lms-pages.md:5,13`: read-only figures as thin internal separators, not another card | `project-list.tsx:130-155`: inner `bg-muted rounded` metric card replaced with `border-y divide-y` on phone and `divide-x` at 425px | Nested metric card removed |
| Phone/tablet breakpoint | `legacy-styles/components___variables.scss:148,155-156`: phone max767, desktop layout starts 768; tablet grid alternative 992; large 1366 | Resource/plan/overview/create editor forms use `md:grid-cols-2`; team preview/template view use `min-[992px]`; project list uses 992/1366 | Matches legacy breakpoint tokens for scoped elements; source rule trace, not rendered proof |
| Narrow phone metric strip | `variables.scss:153`: 425px distinct threshold and `148`: 767px phone | `project-list.tsx:131`: one stacked column below425, three columns and `divide-x` from425 | Avoids 320/390 metric squeeze, keeps content |
| Phone tap area | `variables.scss:140`: touch target44px; `legacy-styles/components___learn-layout.scss:362-370` minimum44px | `super-admin-template-college-bulk.tsx:61`, `project-create-control.tsx:342`, `admin-readiness-workspace-picker.tsx:22`, `project-admin-collection-controls.tsx:221,235` | 44px minimum, text wrap on narrow screens; pager shrinks to 36px at >=768 |
| Interactive states | `legacy-styles/components___learn-layout.scss:361-383`: focus/hover semantics and 150ms back affordance; `variables.scss:10` interactive teal `#26bac7` | Existing shared inputs/Buttons and form handlers unchanged; `project-admin-collection-controls.tsx:221-239` gains `focus-visible:outline-2`, retained `aria-disabled` and hover | Source-level semantic and state retention; visual test pending |

### Scoped grep-equivalent proof (connector reads, not a local worktree command)

- **14/14** changed files were fetched after final pushes and compared to corresponding current-main versions. Native heading pattern `/<h1(?:\\s|>)/g`: **0 matches** across the 14; explicit `<PageCanvas` and `<main` tag pattern: **0 matches**.
- In all 14 files, counts of opening and closing `section`, `fieldset`, `form`, `label`, `div`, `article`, `Link`, and `Button` tags are **unchanged versus main**. No opening/closing tag migration was required.
- Scoped original early mobile form rule `/sm:grid-cols-/g`: **0 instances** in these 14 files after changes (all identified grids move to legacy 768/992/1366 breakpoints). Existing independent `sm:` control behaviors outside those grids were not swept.
- E6 exception inventory: true clickable workspace/project cards, four summary metric tiles, three filter-bucket links, separate editable team cards, sprint/task/resource fieldsets, bounded radio picker control. Ordinary panels, read-only template rows, roster selector and metric subcards are flattened. Interactive content and state transitions preserved at the source level.

### Static responsive rule proof, not browser snapshots

| Width | Effective layout in scoped components | Legacy source logic |
| --- | --- | --- |
| 320px, 390px | Single-column forms, creator/team preview, workspace tiles, template rows; ProjectList metric strip stacks, list/radio targets at least44px | `variables.scss:148` max767 and `:153` 425 transition |
| 425px–767px | ProjectList metric strip three columns with dividers; editable forms still single column; selectable college rows still single column | `variables.scss:153,148` |
| 768px–991px | Form grids and college/bucket choices expand at 768; long text wraps; team previews stay one column | `variables.scss:155` 768, `:149` 991 |
| 992px–1199px | ProjectList/team/template two columns; template creation form remains two columns, project metrics continue one or two as specified | `variables.scss:156,151` |
| >=1366px | ProjectList/workspace listing three columns and submissions metrics four columns | `variables.scss:158` |

**Strict category status:** B5 page canvas/header/breadcrumb universal coverage **[ ]**; B6 actual viewport and all-portal overflow/hover validation **[ ]**; E6 repository-wide remaining nested-card inventory **[ ]**. This batch is *file-scoped source completion* only, not a declaration of whole-area pixel parity. GitHub connector does not provide a checked-out worktree; no compiler, test runner, CI, browser, screenshot, actual recursive grep, or pixel measurements were executed.

**Next exact file:** `src/components/projects/project-admin-readiness-page.tsx` — classify its summary `Metric` presentation in the workspaces table and retained status states; then `src/components/projects/project-admin-audit-page.tsx`, and the remaining Super Admin last-third delegated components.

## Next bounded chat-9 B5/B6/E6 batch — Projects readiness and routes, 2026-10-19

**Scope:** 11 edited and post-commit source-inspected files; 8 additional route files already compliant and inspected without changes. All committed changes on `chatgpt/chat-9-b` tagged `[chat-9]`. A two-parent upstream integration (branch-only) incorporated `main` at `2808e32a641e1e35f513755b840b6ef892c61163` before editing; no `main` write and no local checked-out `git pull`/rebase. Source checks are not compiler or browser validation.

### Work queue — 11 changed files (source complete)

| Checked file | Current path:line proof | E6/B5 result | B6 responsive source rule |
| --- | --- | --- | --- |
| [x] `src/components/projects/project-admin-readiness-page.tsx` | `src/components/projects/project-admin-readiness-page.tsx:201,265` | Four per-workspace numbers on one hairline grid; semantic StatusBadges + links retained | phone 1 col; >=768 2; >=1366 4 |
| [x] `src/components/projects/project-admin-audit-page.tsx` | `src/components/projects/project-admin-audit-page.tsx:195,273,289` | Filter toolbar and three-part summary directly on canvas | phone 1 col; >=768 2 filter / 3 summary; >=1366 5 filter |
| [x] `src/components/projects/project-admin-workspace-list.tsx` | `src/components/projects/project-admin-workspace-list.tsx:107,134,170` | Genuine workspace object cards kept, nested metrics converted to hairlines, mobile Open target 44px | 320/390 1 metric col; >=425 3; >=992 2 cards; >=1366 3 |
| [x] `src/app/(authenticated)/admin/projects/readiness/page.tsx` | `src/app/(authenticated)/admin/projects/readiness/page.tsx:1-9,23-29` | Denied-scope back action uses PageBackLink, PageHeader preserved | 44px icon at <=767; text visible >=768 |
| [x] `src/app/(authenticated)/admin/projects/submissions/page.tsx` | `src/app/(authenticated)/admin/projects/submissions/page.tsx:1-9,23-29` | Denied-scope back action uses PageBackLink, PageHeader preserved | 44px icon at <=767; text visible >=768 |
| [x] `src/app/(authenticated)/admin/projects/at-risk/page.tsx` | `src/app/(authenticated)/admin/projects/at-risk/page.tsx:1-10,22-30` | Denied-scope back action uses PageBackLink, PageHeader preserved | 44px icon at <=767; text visible >=768 |
| [x] `src/app/(authenticated)/admin/projects/audit/page.tsx` | `src/app/(authenticated)/admin/projects/audit/page.tsx:1-11,23-30` | Denied-scope back action uses PageBackLink, PageHeader preserved | 44px icon at <=767; text visible >=768 |
| [x] `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx` | `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx:1-11,47-55` | Scope-denied back action uses PageBackLink; permission check unchanged | 44px icon at <=767; text visible >=768 |
| [x] `src/app/(authenticated)/admin/projects/page.tsx` | `src/app/(authenticated)/admin/projects/page.tsx:1-16,39-45,143-150` | Denied-scope back action shared; two header actions use 768px control-height reset | 44px back/action on phone; 36px header actions >=768 |
| [x] `src/app/(authenticated)/admin/projects/templates/page.tsx` | `src/app/(authenticated)/admin/projects/templates/page.tsx:1-7,33-42,65-75` | Access-denied back action shared; directory form 768px column breakpoint | phone single filter stack; >=768 search/status/button row |
| [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx` | `src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx:1-11,29-35,56-70` | Denied template back action shared, success header already shared | 44px icon at <=767; text visible >=768 |

### Work queue — 8 inspected no-change canonical route delegates

| Checked file | Proof from source at branch head | Result |
| --- | --- | --- |
| [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/overview/page.tsx` | no native `<h1>`, no `<main>` and no `<PageCanvas>`; redirect to canonical overview; no local canvas/head | No edit needed |
| [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/resources/page.tsx` | no native `<h1>`, no `<main>` and no `<PageCanvas>`; shared SuperAdminTemplateSubviewPage owns header | No edit needed |
| [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/page.tsx` | no native `<h1>`, no `<main>` and no `<PageCanvas>`; shared SuperAdminTemplateSubviewPage owns header | No edit needed |
| [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/page.tsx` | no native `<h1>`, no `<main>` and no `<PageCanvas>`; shared SuperAdminTemplateSubviewPage owns header | No edit needed |
| [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx` | no native `<h1>`, no `<main>` and no `<PageCanvas>`; shared SuperAdminTemplateSubviewPage owns header and history query | No edit needed |
| [x] `src/app/(authenticated)/admin/projects/[projectId]/page.tsx` | no native `<h1>`, no `<main>` and no `<PageCanvas>`; permission-checked redirect to canonical summary; no duplicate canvas | No edit needed |
| [x] `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx` | no native `<h1>`, no `<main>` and no `<PageCanvas>`; AdminProjectSectionPage delegates the shared workspace header | No edit needed |
| [x] `src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx` | no native `<h1>`, no `<main>` and no `<PageCanvas>`; ProjectWorkspaceReadiness already owns PageHeader | No edit needed |

### Value-by-value legacy source table

| Property | Old LMS file:line / value | Scoped vNext file:line / rule | Result |
| --- | --- | --- | --- |
| One canvas without subcards | `docs/design/old-lms-shell-spec.md:18-20` #fff, 1px solid #e5e9f0, radius12px, padding24, no shadow on #f1f4f9 | Authenticated `layout.tsx:147-156` and `page-canvas.tsx:13-23`; 19 inspected files introduce **zero** new `<PageCanvas>`/`<main>` | Inherited once, no new outer card |
| Plain read-only metric sections | `old-lms-pages.md:5,10,13` continuous surface, thin #e5e9f0 separators, distinct object cards only | `project-admin-readiness-page.tsx:201,265` plain 1px `border-t/border-b` and `border-border`; no `bg-muted rounded-lg` child card | Fixed E6 nested presentation metrics |
| Row/figure grid responsiveness | `legacy-styles/components___variables.scss:148-159` 425, 767, 768, 991, 1365 breakpoints | `project-admin-workspace-list.tsx:134` 1-column to 425px then 3; `project-admin-readiness-page.tsx:201` 1, 2 at 768, 4 at 1366 | Static breakpoint matches |
| Explicit independent object cards | `old-lms-pages.md:13` cards for genuinely separate items; `variables.scss:30,134` neutral border #e5e9f0, radius12px | `project-admin-workspace-list.tsx:111` one workspace per card, no nested metric card | Legitimate E6 exception |
| Page head title and inline subtitle | `old-lms-shell-spec.md:26-28` measured 30px /600 / #172033; `legacy-styles/components___listing-page-header.scss:26-35,45-60` title row, gap16, divider1px, with alternate 28px title | All eight edited routes use existing shared `PageHeader`; `src/components/ui/page-header.tsx:26-49` title 30px desktop and 20px mobile | Title and action anatomy source-aligned; alternate 28px listing variant still unresolved |
| Page back touch and hover | `legacy-styles/components___learn-layout.scss:361-383` 44x44 min, text hidden max767, teal hover 150ms | `src/components/ui/page-back-link.tsx:18-29`, eight replaced back actions; original destinations retained | Matches source rule with accessible label |
| Page header action height | `old-lms-shell-spec.md:23-25` 36px desktop buttons; `variables.scss:140` phone minimum44px | `admin/projects/page.tsx` actions `min-h-11 md:min-h-9`; template directory matching | 44 phone /36 desktop |
| Audit filters layout | `legacy-styles/components___variables.scss:148-159`: max767 phone, min768 desktop; min1366 wide | `project-admin-audit-page.tsx:195,273` single column mobile, 2 at 768, 5 at1366; summary `:289` three columns at768 | Correct source breakpoints; form control components unchanged |
| Directory search + status controls | Same `variables.scss:148-159` breakpoints; `old-lms-pages.md:8-10` toolbar directly on canvas | `admin/projects/templates/page.tsx`: `md:grid-cols-[minmax(0,1fr)_auto_auto]`; border-b form on canvas | No extra filter card |
| Empty/error/denied states | `old-lms-pages.md:5` one canvas across content; shared page header | Eight edited permission/recovery route variants retain `PageHeader`, `ErrorState`, permission conditions, exact navigation URLs, and existing error copy | Source semantics intact; not runtime-tested |

### Scoped source-grep and markup proof

- Re-fetched 11 edited source files *after* writing from `chatgpt/chat-9-b`. Their direct native `/<h1(?:\\s|>)/g` count is **0**, additional `<PageCanvas` **0**, additional `<main` **0**. The three Projects components retain exact counts of element opening/closing tags versus main. The eight edited routes replace exactly **one** `<Link>…</Link>` pair with exactly **one** self-closing `<PageBackLink />` each; other JSX element counts and links remain unchanged.
- Re-fetched eight small canonical alias/delegate files. All eight have native h1=0, native main=0, local PageCanvas=0; two are validated/authorized redirects, six delegate header ownership to a shared Projects view.
- The source grep was implemented by connector-backed file-content scans; **no recursive checkout `git grep` or complete repository inventory was executed**. Exact full-repository clone parity remains **unverified**.
- User forbids runtime, tests and CI. No TypeScript compiler, application run, browser, Playwright, screenshots, focus observation or pixel measurement performed; responsive proof here is *class-selection* at breakpoints rather than visual proof.

### Responsive proof — inherited canvas and changed elements

| Width band | Header and back affordance | Content and controls |
| --- | --- | --- |
| 320px /390px /767px | 20px PageHeader, actions stack; PageBackLink 44px and hides visible text but retains aria-label | Readiness metrics stack 1 col; workspace card metrics stack below425; audit/template filters remain single column |
| 768–991px | Header switches to 30px title/inline subtitle, back text visible, action min-height36px | Readiness metrics 2 cols; audit filters 2 cols, summary 3; template directory row |
| 992–1199px | Same header row (flex-wrap for long title) | Workspace cards 2 cols and 425px internal metrics 3 |
| 1200–1365px | Same header | Audit filters still 2; metrics 2; all remain on one page canvas |
| >=1366px | Same header | Audit filter 5 columns; readiness metrics 4; workspace cards 3 |

**B5/B6/E6 parent gates remain [ ]**: all-portal/dynamic h1 inventory, universal breadcrumb values, full nested-card exception audit, visual/pixel/keyboard proof, and unresolved 28px listing-vs-measured-30px header variant.

**Next exact file:** `src/components/projects/super-admin-template-subview-page.tsx` — audit conditional status/header/action variants and responsive collection rows; then `src/app/(authenticated)/admin/settings/page.tsx` and `src/app/(authenticated)/admin/tenants/page.tsx` for B5/B6/E6 back/canvas states.

## Replacement chat-9 next complete batch — Super Admin last-third and Projects template, 2026-10-19

**Work queue (14 edited, committed, source-rechecked files).** Parent B5/B6/E6 item remains **[ ]** until all-portal inventory and full visual verification; no unchecked whole-category item is marked complete. All source writes target `chatgpt/chat-9-b` with `[chat-9]`, not `main`.

| File (all source-verified) | Current value proof (vNext file:line) | B5/E6 result and classification | B6 source breakpoint proof |
| --- | --- | --- | --- |
| [x] `src/components/projects/super-admin-template-subview-page.tsx` | `src/components/projects/super-admin-template-subview-page.tsx:178-198,302,390,660,683-685` | PageHeader action catalogue back link shared; sprint/task/version lists remain hairline; distinct status badges remain | 2-up at 768, 4-up at 1366; action min44 under768 |
| [x] `src/app/(authenticated)/admin/settings/page.tsx` | `src/app/(authenticated)/admin/settings/page.tsx:35-44,83-94,141-160,224` | Error back link shared; settings note is border-b instead of nested tinted card; filters and tables sit on canvas | overview 3-up at 768; form/menu controls 44 mobile /36 >=768 |
| [x] `src/app/(authenticated)/admin/tenants/page.tsx` | `src/app/(authenticated)/admin/tenants/page.tsx:23-33,51-85` | Permission back link shared; college tiles are separate objects, not cosmetic subcards | directory 2-up at 768, 4-up at1366; action/input height 44/36 |
| [x] `src/app/(authenticated)/admin/colleges/page.tsx` | `src/app/(authenticated)/admin/colleges/page.tsx:59-72,125-147` | Header retained; controls and directory filters preserve separate actions | right actions align from768; 44 mobile/36 desktop |
| [x] `src/app/(authenticated)/admin/features/page.tsx` | `src/app/(authenticated)/admin/features/page.tsx:122-143,155-191` | No separate page shell; persisted feature rule forms are on the continuous page canvas | summary 3-up from768; search full width on phone, 44 mobile/36 desktop |
| [x] `src/app/(authenticated)/admin/settings/auth/page.tsx` | `src/app/(authenticated)/admin/settings/auth/page.tsx:18-30,37-40` | Denied back action shared; checklist records are hairline rows, not nested cards | auth posture list stacks to767, 2-up from768 |
| [x] `src/app/(authenticated)/admin/verification/page.tsx` | `src/app/(authenticated)/admin/verification/page.tsx:17-35` | Denied dashboard action shared; scoped notice continues as slim hairline section | 44 mobile/36 desktop for existing action |
| [x] `src/app/(authenticated)/admin/students/page.tsx` | `src/app/(authenticated)/admin/students/page.tsx:25-28,61-70` | Denied dashboard action shared; students/content remains inside inherited canvas | header actions 44 mobile/36 desktop |
| [x] `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx` | `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-35,48-56` | Tenant details use one PageHeader; read-only fields hairline; setup links are independent actions | two columns from768; ten navigation/setup links 44 mobile/36 desktop |
| [x] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx` | `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx:133-158,215-225,293` | Readiness StatTile components independently display summary data; no new parent card; error/unknown status preserved | summary 2-up >=768, 4-up >=1366; filters split >=768 |
| [x] `src/app/(authenticated)/admin/tenants/setup/page.tsx` | `src/app/(authenticated)/admin/tenants/setup/page.tsx:80-115,147-170` | Setup create and existing directories are hairline; launch option cards remain distinct actionable destinations | creation/record sections 2-up >=992, narrow tablet single column |
| [x] `src/app/(authenticated)/admin/companies/page.tsx` | `src/app/(authenticated)/admin/companies/page.tsx:40-65,126-150,170-171` | Six plain count metrics flattened from nested cards; company relationship cards retained as distinct objects | filters/curation 2-up >=768, three-up >=1366, controls 44/36 |
| [x] `src/app/(authenticated)/admin/module-access/page.tsx` | `src/app/(authenticated)/admin/module-access/page.tsx:40-59,65-76` | Module access summary and college rows already hairline; no enclosing card | summary 3-up and filter row >=768; actions 44 phone |
| [x] `src/app/(authenticated)/admin/semesters/page.tsx` | `src/app/(authenticated)/admin/semesters/page.tsx:78-83,109,124` | Semester list remains flat on canvas; header and clear/export actions use responsive control heights | 44 mobile/36 desktop |

### Legacy-to-vNext exact property / state table for this batch

| Property/state | Legacy source + value | vNext source + value | Assessment |
| --- | --- | --- | --- |
| Single page surface (default) | `docs/design/old-lms-shell-spec.md:18-20`: #ffffff, radius12px, 1px #e5e9f0, padding24px, no shadow, on #f1f4f9 shell | `src/components/ui/page-canvas.tsx:13-23` and inherited `src/app/(authenticated)/layout.tsx:147-156`; each of 14 files adds zero `<PageCanvas>` and zero native `<main>` | One shared canvas, no new wrapper |
| Page head desktop | `old-lms-shell-spec.md:26-28` 30px/600/#172033 + inline subtitle + actions right; `old-lms-pages.md:6` no eyebrow block | `ui/page-header.tsx:26-49`; all page-owned titles are `PageHeader`, no raw `<h1>` across the 14; old `eyebrow` props flow inline via subtitle in the shared component | Source parity for head structure (28px legacy listing variant remains open) |
| Mobile page head | `legacy-styles/components___listing-page-header.scss:130-154`: max767px 20px title, actions stacked and full width | `ui/page-header.tsx:26-49` 20px until `md` at768, stacked actions | Matches responsive rule; no screenshot |
| Back link default, hover, focus | `legacy-styles/components___learn-layout.scss:361-383`: min44x44, icon-only under768, teal hover, 150ms transition, accessible link | `ui/page-back-link.tsx:18-29`, four denied/error views now use `PageBackLink` with unchanged destination; already-shared template views retained; focus ring via shared component | Source aligned; active browser state not tested |
| Header controls height | `old-lms-shell-spec.md:23-25` 36px control height and 9px radius at desktop; `legacy-styles/components___variables.scss:140` touch44px | `super-admin-template-subview-page.tsx:189`; `admin/tenants/page.tsx:56-78`; `admin/settings/page.tsx:86,134,141`; `admin/companies/page.tsx:43-130` use min-h-11 + md:min-h-9 | 44px below768 and36px from768 |
| Body border and card exception | `old-lms-pages.md:5,10,13` whitespace or hairline row separators; separate objects may be bordered; `variables.scss:30` #e5e9f0 | `admin/settings/page.tsx:224` note becomes border-b (no rounded/tint); `admin/companies/page.tsx:135-143` six metrics become hairline rows; tenant/company project item tiles stay 12px-radius separate-object cards | E6 flattened two redundant container families; true object tiles exempt |
| Summary strip and item grid | `old-lms-pages.md:12-13` continuous strip of numbers/labels; cards only for distinct report options | `admin/companies/page.tsx:135-143` single border-t grid, child borders bottom; `admin/features/page.tsx:128-135` three metrics directly on canvas | No nested cosmetic card |
| Mobile input stacking | `legacy-styles/components___variables.scss:148-159`: phone max767, tablet min768, two-column large min992, wide min1366 | `admin/tenants/page.tsx:65` filters 2-up at768, 4-up at1366; `admin/companies/page.tsx:65,150,164` 2-up at768, 3-up >=1366; `admin/colleges/[collegeId]/readiness/page.tsx:158,216,221` | Breakpoint selections match legacy values |
| Independent object links / disabled states | `old-lms-pages.md:13`: report/option tiles distinct, no card-in-card; legacy 44px target from `variables.scss:140` | College and company cards remain separate, `admin/tenants/setup/page.tsx:152-158` launch links separate actionable objects; shared button/select disabled props, page data and permission logic unchanged | Existing interaction semantics retained (source-only) |
| Focus/hover states | `legacy-styles/components___learn-layout.scss:361-383` visible focus and 150ms teal hover; `variables.scss:6-12` interactive teal tokens | Existing `hover:`, `focus-visible:` classes maintained; no event handlers, permission conditions, save actions or URLs changed across the 14 files | Static state retention only |
| Empty/error/loading states | `old-lms-pages.md:5` one consistent page surface; `ui-clone-checklist.md:13` distinct error/empty states required | Existing `ErrorState`, `EmptyState`, `role=alert/status`, loading and retry branches retained. Four changed denied actions switched from native Link to shared PageBackLink without changing href | Conditional render and copy preserved; runtime not run |

### Grep-equivalent source proof and no-regression checks (committed branch, not a worktree)

- **14/14 files** fetched after writing from `chatgpt/chat-9-b` and compared against then-current `main`: `/<h1(?:\\s|>)/g` → 0 native h1 across these files; `/<PageCanvas(?:\\s|>)/g` → 0 nested canvas; `/<main(?:\\s|>)/g` → 0 nested main. Each already uses the inherited authenticated canvas and shared header or a canonical delegation.
- For all 14 files, opening/closing counts of `div`, `section`, `article`, `nav`, `label`, `dl`, `ul`, `form` remain equal to the pre-change main snapshot. The four back-action conversions replace a complete `<Link>…</Link>` pair with one self-closing `<PageBackLink />`. No unmatched closing tag.
- **Scoped source proof**, not literal recursive shell grep: connector file re-fetches with JS regex equivalent to `grep -En '<h1([[:space:]]|>)|<PageCanvas([[:space:]]|>)|<main([[:space:]]|>)' <file>` for the exact files above. Output count 0 for each of 14. No repository-wide zero claim, browser, TypeScript compiler, tests, CI, app server, screen comparison or device behavior run.

### Phone/tablet responsive class-rule trace (not rendered geometry)

| Viewport | Required legacy breakpoint | Changed DOM classes and resulting rule |
| --- | --- | --- |
| 320px / 390px | max767px single-column/44px hit target | Settings, tenant, company and module feature filters 1 column; template version details 1 column; back text hidden but aria-label kept; `min-h-11` inputs/actions |
| 425px–767px | still phone (legacy `$ssm:767px`) | Same filter stacking; read-only rows bordered not card-in-card; content wraps via min-w-0 and original break classes |
| 768px–991px | legacy `$sm:768px`, tablet `$smd:991px` | Filters 2 columns, header actions 36px, company curation columns 2, tenant detail description list 2, auth module list 2, template sprints/tasks details 2 |
| 992px–1365px | legacy `$md:992px` | Tenant setup create/organization directories each 2 columns; template subview detail columns stay 2; company directory still 2 |
| ≥1366px | legacy `$lg:1366px` | Tenant directory 4 filter columns, Companies 3, readiness 4 summary metrics, template version 4 detail metrics |

**B5 [ ], B6 [ ], E6 [ ]**: category not closed. Remaining work includes full-portal hand-rolled title/card/heading grep (only connector-backed scoped scans so far), legacy breadcrumb exact-source values and offscreen/keyboard/browser responsive checks.

**Next exact file:** `src/app/(authenticated)/admin/domains/page.tsx` — compare existing head/actions and error states; then `src/app/(authenticated)/admin/organizations/page.tsx`, followed by Super Admin tenant/detail and other open portal page-headers as listed in this work queue.

## Replacement chat-9 additional batch — Super Admin detail, content and academy source parity, 2026-10-19

**Work queue:** 19 edited source-complete files (including the People Directory lexical-binding correction); 12 inspected no-change entrypoints/subroutes (11 in the table below plus `admin/domains/page.tsx`). All commits use `[chat-9]` on `chatgpt/chat-9-b`. Entries are source-level file completions, not parent-category closure.

| Edited / source-verified file | Exact current file:line | B5 and E6 presentation result, with exceptions | B6 class-rule responsive result |
| --- | --- | --- | --- |
| [x] `src/app/(authenticated)/admin/organizations/page.tsx` | `src/app/(authenticated)/admin/organizations/page.tsx:31-37,109-122` | Organization rows use DataTable and hairline archived list; no extra rounded page shell | Phone controls min44px; 768+ controls 36px; search max width wraps |
| [x] `src/app/(authenticated)/admin/settings/error.tsx` | `src/app/(authenticated)/admin/settings/error.tsx:14-20` | Error PageHeader no longer centered inside redundant border-top panel; retry unchanged | Shared PageHeader title 20px under768/30px desktop; error body flows full width |
| [x] `src/components/courses/super-admin-content-directory-page.tsx` | `src/components/courses/super-admin-content-directory-page.tsx:47-88,91-127,150-155` | Resources/Videos/Live Classes share PageHeader with Courses back link in head; no separate bottom back row | Filters 1/2/3 at phone/768/1366; back min44px phone, content rows hairline |
| [x] `src/components/admin/college-create-form.tsx` | `src/components/admin/college-create-form.tsx:95,155-168,173-186` | Address Disclosure is a hairline subsection instead of card-in-card; multi-field form retains behavior | One column <992, 4-column creation at992; address inner columns at768/992 |
| [x] `src/components/admin/super-admin-attendance-settings-editor.tsx` | `src/components/admin/super-admin-attendance-settings-editor.tsx:41-56` | Attendance editor remains a plain border-b section with shared inputs and confirm dialog | Single-column through767, 2 columns at768 |
| [x] `src/components/admin/tenant-domain-manager.tsx` | `src/components/admin/tenant-domain-manager.tsx:233-239,318-355` | DNS ownership detail Card flattened to a titled hairline section; read-only TXT name/value boxes intentionally retain field borders | Flex wraps hostname/action controls; min44px buttons phone |
| [x] `src/app/(authenticated)/admin/announcements/page.tsx` | `src/app/(authenticated)/admin/announcements/page.tsx:42-59,125-140,167-194` | Receipt notices become hairline rows; slim status/alert signals kept separate | Controls min44 phone /36 desktop; search becomes min-w0 + width100% on phone |
| [x] `src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx` | `src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx:205-224,382-395` | Membership override summary no longer nests rounded cards inside the Student overrides section | Three read-only fields stack phone, 3 across at768; 44px phone controls |
| [x] `src/app/(authenticated)/admin/people/page.tsx` | `src/app/(authenticated)/admin/people/page.tsx:111-124,142-173` | Shared People header; no extra canvas; search inputs/action links honor 44px phone target | Filter grids 1/2/4 at phone/768/1366; link min-height 44 then36 |
| [x] `src/app/(authenticated)/admin/course-progress/page.tsx` | `src/app/(authenticated)/admin/course-progress/page.tsx:35-46,74-98` | Courses PageBackLink moved from bottom to PageHeader actions beside CSV export; plain rows preserved | Filters 1/2/5 at phone/768/1366; controls min44 mobile/36 >=768 |
| [x] `src/app/(authenticated)/admin/batches/page.tsx` | `src/app/(authenticated)/admin/batches/page.tsx:35-77,100-105` | Batches filters/status/table stay on one inherited canvas, no extra card wrapper | Full-width filter labels until768; controls min44 mobile/36 tablet; pager min44 mobile |
| [x] `src/app/(authenticated)/admin/hr/page.tsx` | `src/app/(authenticated)/admin/hr/page.tsx:42-61` | Invalid filter state retains PageHeader and error with corrected minimum tap height | Reset filters min44 phone,36 desktop |
| [x] `src/app/(authenticated)/admin/departments/page.tsx` | `src/app/(authenticated)/admin/departments/page.tsx:54-60` | Shared department directory head remains; navigation action uses legacy phone target | 44px phone,36px at768 |
| [x] `src/app/(authenticated)/admin/faculty/page.tsx` | `src/app/(authenticated)/admin/faculty/page.tsx:18-32` | AdminScopedReadPage owns faculty page title; standalone action remains outside any cosmetic card | 44px phone,36px at768 |
| [x] `src/app/(authenticated)/admin/classes/page.tsx` | `src/app/(authenticated)/admin/classes/page.tsx:33-67,94-96` | Classes list DataTable and filters remain on one canvas; no nested card | Filters full-width until768; pager 44px phone; desktop controls36px |
| [x] `src/app/(authenticated)/admin/people/directory/page.tsx` | `src/app/(authenticated)/admin/people/directory/page.tsx:23-45,59-80,115-130` | People Directory uses shared PageHeader/Tabs and no nested canvas; removed duplicated context declaration in one function for valid lexical binding | 1/2/5 search cols phone/768/1366; related links 44px phone/36 desktop |
| [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx` | `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:20-41` | College admin directory uses single PageHeader, shared back link and DataTable; session/history links accessible | Session/history links 44px phone/36 desktop |
| [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx` | `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx:23-33` | Active-session view shares PageHeader and back action | History link target 44px phone/36 desktop |
| [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx` | `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx:22-46` | Admin activity history PageHeader, back and export actions shared; error/empty states untouched | History CSV export 44px phone/36 desktop |

### No-edit queue entries fully reviewed at file boundary

| Entry (each source-fetched) | Verification and delegation |
| --- | --- |
| [x] `src/app/(authenticated)/admin/domains/page.tsx` | two PageHeader states and single TenantDomainManager; no local h1, main or PageCanvas |
| [x] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx` | PageHeader + PageBackLink, single inherited canvas, no mobile grid override; zero literal native h1/main/PageCanvas in route source |
| [x] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx` | PageHeader + PageBackLink; form provided by subcomponent, no local nested canvas; zero literal native h1/main/PageCanvas in route source |
| [x] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx` | PageHeader + PageBackLink; no hand-written h1; zero literal native h1/main/PageCanvas in route source |
| [x] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx` | PageHeader + PageBackLink; verification panel owns content, not extra page canvas; zero literal native h1/main/PageCanvas in route source |
| [x] `src/app/(authenticated)/admin/recruiters/page.tsx` | canonical re-export of ../hr/page.tsx; shared HrAccounts page owns heading; zero literal native h1/main/PageCanvas in route source |
| [x] `src/app/(authenticated)/admin/resources/page.tsx` | canonical delegate to SuperAdminContentDirectoryPage (edited above); zero literal native h1/main/PageCanvas in route source |
| [x] `src/app/(authenticated)/admin/videos/page.tsx` | canonical delegate to SuperAdminContentDirectoryPage (edited above); zero literal native h1/main/PageCanvas in route source |
| [x] `src/app/(authenticated)/admin/domains/error.tsx` | GracefulErrorBoundary delegate retains shared error head/Retry; zero literal native h1/main/PageCanvas in route source |
| [x] `src/app/(authenticated)/admin/organizations/error.tsx` | GracefulErrorBoundary delegate retains shared error head/Retry; zero literal native h1/main/PageCanvas in route source |
| [x] `src/app/(authenticated)/admin/colleges/error.tsx` | GracefulErrorBoundary delegate retains shared error head/Retry; zero literal native h1/main/PageCanvas in route source |
| [x] `src/app/(authenticated)/admin/not-found.tsx` | already uses shared PageHeader and 44px mobile home action; zero literal native h1/main/PageCanvas in route source |

### Value-by-value reference table for this file group

| Property/state | Old LMS source:line, exact expectation | Current vNext source:line and value | Result |
| --- | --- | --- | --- |
| Default canvas | `docs/design/old-lms-shell-spec.md:18-20`: #fff, 1px #e5e9f0, 12px radius, padding 24, shadow none; shell background #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23` and `src/app/(authenticated)/layout.tsx:147-156`; each of 19 changed files uses **0** extra `<PageCanvas>` and `<main>` tags | Inherited single white canvas; no new wrappers |
| Page title/subtitle | `old-lms-shell-spec.md:26-28`: h1 30px/600/#172033 with grey inline description and right-aligned actions; `old-lms-pages.md:6` | `src/components/ui/page-header.tsx:26-49`; `course-progress/page.tsx:36-40` moved Courses back action into head; `settings/error.tsx:17-19` removed extra centered border | Shared PageHeader; no native h1; alternative 28px listing SCSS variant still unconfirmed |
| Phone header/action | `legacy-styles/components___listing-page-header.scss:130-154`: <=767px title20px, actions stack and fill width | Shared `PageHeader` md768 breakpoint; directory forms use `md:` not `sm:`; `PageBackLink` remains icon+aria mobile | Matches static class selections |
| Back link default/focus/hover | `legacy-styles/components___learn-layout.scss:361-383`: min44x44, label hidden at <=767, teal hover and focus | `src/components/ui/page-back-link.tsx:18-29`; `courses/super-admin-content-directory-page.tsx:85-88`; `admin/course-progress/page.tsx:36-40` | Shared back action, routes unchanged |
| Desktop action height | `old-lms-shell-spec.md:23-25`: 36px; `legacy-styles/components___variables.scss:140`: 44px phone touch target | `admin/organizations/page.tsx:35,120`, `admin/batches/page.tsx:46-76,103-104`, `admin/people/page.tsx:122,168,171`, `admin/colleges/[collegeId]/admins/page.tsx:37-38` | `min-h-11 md:min-h-9` or `md:min-h-[var(--lms-control-height)]`: 44 phone,36 desktop |
| Section-only content | `old-lms-pages.md:5,10,13` plain content on canvas divided by hairlines, not cards within cards; `legacy-styles/components___variables.scss:30` `#e5e9f0` | `src/components/admin/tenant-domain-manager.tsx:318-355`: DNS Card replaced by titled border-t section; `admin/announcements/page.tsx:187-195`: receipt cards become border-b rows; `admin/features/[collegeId]/trace/page.tsx:385-394`: overview cards become hairlines | Matches E6; input-like DNS TXT field borders retained as legitimate distinct values |
| Distinct objects | `old-lms-pages.md:13` cards only for independent objects, e.g. report options | College create form Disclosure now border-b `college-create-form.tsx:155-168`; company/tenant object cards and alert banners stay separately surfaced | E6 exception ledger: actionable tenant, project, company choices and warning banners remain |
| Form responsiveness | `legacy-styles/components___variables.scss:148-159`: 425/767/768/991/1365/1366 breakpoints | `college-create-form.tsx:95,157` 4-up and address 3-up at992; `admin/people/page.tsx:152` 2-up768/4-up1366; `admin/classes/page.tsx:40-66` input group full-width phone | Direct breakpoint alignment |
| Read-only listing states | `old-lms-pages.md:9-10` tables/list rows directly on canvas with 1px separators, no nested per-row card | `admin/course-progress/page.tsx:67-88` offers border-y divide-y; `admin/batches/page.tsx:78-103` shared DataTable; `admin/people/directory/page.tsx:95-128` shared DataTable | Preserved existing pagination/filter/empty actions |
| Disabled/loading/error | `ui-clone-checklist.md:11-17` preserve disabled, loading, empty, error, and focus states; `legacy-styles/components___variables.scss:140` 44px | `college-create-form.tsx:93-190` pending/disabled unchanged, `super-admin-attendance-settings-editor.tsx:20-65` confirm/disabled unchanged, `tenant-domain-manager.tsx:269-390` verification/deletion confirmation unchanged | Behavioral controls unchanged in source; interaction not executed |
| Focus/hover | `legacy-styles/components___learn-layout.scss:361-383` teal hover and visible focus / transition | Existing `focus-visible` and `hover:` selectors in modified page links unchanged, shared Buttons remain, no event-handler changes in 19 files | Source retention; not browser proof |

### Scoped grep/coverage proof and JSX/TS no-regression checks

- **19/19 edited files** fetched from branch after latest writes. Native heading equivalent `grep -nE '<h1([[:space:]]|>)' FILE` (connector-backed regex `/<h1(?:\\s|>)/g`) => **0 in each of 19**; nested native `<main>` => **0 each**, new `<PageCanvas>` => **0 each**. File counts are *scoped*, not global grep from a checkout.
- Rechecked pre/post opening+closing tag counts for `div, section, form, nav, article, li, dl, ul, label, fieldset` against main on the 16-file subset and static checks in later edits; `tenant-domain-manager.tsx` specifically converts the single Card open/close pair to a semantic section pair; `course-progress/page.tsx` adds one balanced action wrapper `<div></div>`. All inspected edits preserve JSX matching tags.
- `admin/people/directory/page.tsx`: **one** `const context=await getCurrentRequestContext();` remains (previously twice in the same function), and one matching `isSuperAdmin` authorization guard remains. This is a source-level TypeScript syntax repair without running a compiler.
- **12/12 no-edit routes** additionally source-inspected: no raw h1/main/PageCanvas. Headers are existing PageHeader or delegated to shared view/error components (see table). No additional claim about hidden transitive components beyond those inspected.
- No runtime, TypeScript compiler, lint, tests, CI, Playwright, screenshot comparison or keyboard observation was run. All responsive and interaction proofs here are based on source classes and preserved conditionals.

### Breakpoint proof for phone/tablet/desktop, this group

| Width | Source rule and expected shape | Edited files proving it |
| --- | --- | --- |
| 320/390px | <768, single-column filters and form fields, min-height44 controls, back label visually hidden with accessible label | `people/page.tsx:152-168`, `classes/page.tsx:40-67`, `college-create-form.tsx:95-157`, `tenant-domain-manager.tsx:269-315` |
| 425–767px | Still phone per legacy `$ssm:767px`; content and actions wrap, no decorative nested summary cards | `announcements/page.tsx:187-195`, `features/[collegeId]/trace/page.tsx:385-394` |
| 768–991px | `md` two-column forms/summary, min-height36 desktop controls, full back-link label | `courses/super-admin-content-directory-page.tsx:90-125`, `super-admin-attendance-settings-editor.tsx:43`, `people/directory/page.tsx:79` |
| 992–1365px | Legacy `$md:992px` enables college-create four-column form and address three-column input | `college-create-form.tsx:95,157,155` |
| >=1366px | Legacy `$lg:1366px` enables 4/5-column inventory filters | `admin/people/page.tsx:152`, `admin/course-progress/page.tsx:46`, `admin/people/directory/page.tsx:79` |

**Strict category gates B5/B6/E6 remain [ ]** pending complete repository hand-rolled title/canvas/card inventory, exhaustive value proof for all global elements/states, and device/browser screenshot verification. Do not infer full pixel parity from source checks.

**Next exact file:** `src/app/(authenticated)/admin/audit/page.tsx` (Super Admin Activity Log header/actions), then `src/app/(authenticated)/admin/placements/page.tsx`, then the remaining Super Admin first/second-third routes whose inherited canvas may contain duplicate presentation wrappers.


## Replacement chat-9 source-complete file batch — 2026-10-20

**Integration:** `main` at `5511eb1043bb9368a74cdf84eddb35f5d18636e3` contained the previous chat-9 head (`dc68624e68afd683f583a91ed602dc9b76d3f334`) and was fast-forwarded with lease to branch `chatgpt/chat-9-b` before changes; no forced reset, no writes to main. Re-read each changed file from branch after its [chat-9] commit. The category gates B5/B6/E6 remain open; 21 individual files are source-reviewed here, not browser-certified.

### Per-file legacy value matrix and responsive/coverage proof

Reference values for **every row**: `docs/design/old-lms-shell-spec.md:18-20` one #fff canvas, #e5e9f0 1px border, 12px radius, 24px internal padding on #f1f4f9, no shadow; `old-lms-shell-spec.md:26-28` measured TPO h1 30px/600/#172033 (shared desktop); `docs/design/legacy-styles/components___listing-page-header.scss:26-49,80-85,130-154` desktop head flex gap24/title/subtitle baseline gap16/actions gap16 top8, and phone (<768px) title20px, stacked actions width100%; `docs/design/legacy-styles/components___learn-layout.scss:361-383` back link 44x44 phone, label hidden, teal hover/focus; `docs/design/legacy-styles/components___variables.scss:148-159` phone <=767, tablet 768-991, 992+, 1366+ layouts; `docs/design/old-lms-pages.md:5-13` one uninterrupted canvas and ordinary sections separated by hairlines.

| File reviewed (scope) | Exact legacy source value / line | vNext source line, property or change | Scoped source result and responsive evidence |
| --- | --- | --- | --- |
| `src/app/(authenticated)/admin/audit/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/admin/audit/page.tsx:16` — Invalid filter head, Audit Findings action moved into shared header | `src/app/(authenticated)/admin/audit/page.tsx:18` — 44px phone / 36px md action; inherited single canvas; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/activity/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/activity/page.tsx:208` — Export and audit findings are right-header actions; scoped activity notice and filters changed from cards to hairlines | `src/app/(authenticated)/activity/page.tsx:216` — Phone one column/44px actions; md=768 two filter columns, xl four; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/admin/placements/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/admin/placements/page.tsx:36` — Scoped/unscoped Placement Drives heads align directory actions and Create drive; no floating duplicate link row | `src/app/(authenticated)/admin/placements/page.tsx:40` — Head actions flex-col <768, flex row md; targets 44px / 36px; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/admin/projects/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/admin/projects/page.tsx:40` — Projects head precedes tab/navigation in all authorized/error/scope states | `src/app/(authenticated)/admin/projects/page.tsx:136` — PageHeader action buttons wrap; inherited single canvas; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/admin/placements/drives/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/admin/placements/drives/page.tsx:77` — Shared BackLink + lookup + Create drive in header; removed redundant row | `src/app/(authenticated)/admin/placements/drives/page.tsx:81` — 44px phone/36px md actions and back label phone hidden; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/admin/projects/templates/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/admin/projects/templates/page.tsx:32` — Templates head precedes navigation in permitted and denied/loading states | `src/app/(authenticated)/admin/projects/templates/page.tsx:60` — Primary create action min44 phone/36 md; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/admin/projects/at-risk/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/admin/projects/at-risk/page.tsx:24` — Scope header before navigation; authorized delegates to shared Projects view | `src/app/(authenticated)/admin/projects/at-risk/page.tsx:41` — Shared PageHeader 20px phone, 30px md; no nested shell; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx:27` — Scope and access error headers before navigation; successful delegate unchanged | `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx:49` — PageBackLink 44x44 phone with hidden label; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/components/projects/project-admin-at-risk-page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/components/projects/project-admin-at-risk-page.tsx:42` — Authorized At-risk head with CSV action before navigation and quick-filter chips | `src/components/projects/project-admin-at-risk-page.tsx:73` — Grid/text wrapping inherited; 44px phone target; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/components/projects/project-admin-reassign-mentor-page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/components/projects/project-admin-reassign-mentor-page.tsx:36` — Unavailable and ready states show PageHeader before Projects nav; back preserved | `src/components/projects/project-admin-reassign-mentor-page.tsx:73` — Workload tiles remain distinct filter links; source responsive grid; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/components/placements/placement-job-create-workspace.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/components/placements/placement-job-create-workspace.tsx:96` — Fixed TPO-only Back link destination to basePath, integrated shared PageBackLink into head | `src/components/placements/placement-job-create-workspace.tsx:100` — Phone icon back 44x44; md label visible; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/error.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/error.tsx:10` — Native heading replaced by shared PageHeader; retry and error notice preserved | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/error.tsx:12` — 20px phone/30px desktop header and accessible 44px back; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/activity/[eventId]/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/activity/[eventId]/page.tsx:50` — Activity detail cards flattened to thin sections; breadcrumb preserved and shared back action | `src/app/(authenticated)/activity/[eventId]/page.tsx:63` — Grid 1 phone / 2 md / 3 min992; 44px phone back; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/admin/placements/analytics/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/admin/placements/analytics/page.tsx:28` — Invalid-filter shell normalized; CSV focus/hover; analytics form/metrics breakpoint matching | `src/app/(authenticated)/admin/placements/analytics/page.tsx:82` — 1 phone/2 md/4 min992 filters; 2/3/5 headline metrics; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/admin/placements/student-lookup/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/admin/placements/student-lookup/page.tsx:28` — Back to Placements and Analytics aligned in PageHeader; lookup state unchanged | `src/app/(authenticated)/admin/placements/student-lookup/page.tsx:30` — 44px mobile back/links, 36px md action; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/admin/projects/audit/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/admin/projects/audit/page.tsx:25` — Project audit unavailable-scope PageHeader before tabs; global audit delegate unchanged | `src/app/(authenticated)/admin/projects/audit/page.tsx:42` — Shared 20px phone/30px md heading, no standalone extra canvas; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/admin/projects/readiness/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/admin/projects/readiness/page.tsx:24` — Readiness missing-scope PageHeader before tabs; authorized delegate unchanged | `src/app/(authenticated)/admin/projects/readiness/page.tsx:41` — Shared 20px phone/30px md heading; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/app/(authenticated)/admin/projects/submissions/page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/app/(authenticated)/admin/projects/submissions/page.tsx:24` — Submissions missing-scope PageHeader before tabs; authorized delegate unchanged | `src/app/(authenticated)/admin/projects/submissions/page.tsx:41` — Shared 20px phone/30px md heading; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/components/projects/project-admin-audit-page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/components/projects/project-admin-audit-page.tsx:174` — Project Audit PageHeader before preset tabs; refresh/activity actions unchanged | `src/components/projects/project-admin-audit-page.tsx:182` — Actions wrap and 44px phone/36px md; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/components/projects/project-admin-readiness-page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/components/projects/project-admin-readiness-page.tsx:88` — Readiness shared heading before tabs; active overrides/hairline rows retained | `src/components/projects/project-admin-readiness-page.tsx:94` — Export target 44px phone/36px md, data tables inherited; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 
| `src/components/projects/project-admin-submissions-page.tsx` | `old-lms-shell-spec.md:18-20,26-28`; `components___listing-page-header.scss:26-49,80-85,130-154`; `old-lms-pages.md:5-13` | `src/components/projects/project-admin-submissions-page.tsx:65` — Error and success headers before tabs; review chips remain directly below heading | `src/components/projects/project-admin-submissions-page.tsx:104` — Needs-doing chips wrap; responsive inherited from shared header; per-file `grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' FILE` → **0** | 

#### Batch-wide grep and JSX proof — source inspect, not local shell execution

- All **21 individual fetched branch files** were re-read after edits. Equivalent JavaScript expressions `/<h1(?:\\s|>)/g`, `/<main(?:\\s|>)/g`, `/<PageCanvas(?:\\s|>)/g` returned **0/0/0 in each file**. This is scoped file coverage, **not** a claim of a whole-tree grep. The sole indexed authenticated raw h1 seen in the GitHub `<h1 path:src/app` source search at the time was `tpo/placements/jobs/[jobId]/edit/error.tsx`; its source was migrated to `PageHeader`, and then fetched again with h1 count zero. Other indexed `<h1` hits are public/auth/e2e or an API documentation string and require separate exemption logging.
- Re-fetched changed files and compared closing/opening counts of `div, section, article, form, nav, ul, ol, dl` under the source-scoped regex `/<tag(?:\\s|>)/g` and `/<\\/tag>/g`; none of those modified files showed an unmatched pair in the inspected results. JSX `<PageHeader />`, `<PageBackLink />` and related self-closing components are not counted as paired tags. For converted `Card` tags, **both** opening and closing tags were changed to `section`.
- All edits retained existing permissions, service calls, fields, error notices, loading guards, links and event handlers. The `PlacementJobCreateWorkspace` back link now derives from `basePath` (previously a TPO hard-code), which fixes Super Admin routing and retains TPO `basePath` routing.
- Source-level responsive proof: `PageHeader` mobile/desktop behavior in `src/components/ui/page-header.tsx:26-50` uses md=768 boundary; `PageBackLink` in `src/components/ui/page-back-link.tsx:18-29` uses 44px mobile target with md text and control height; activity detail uses `min-[992px]:grid-cols-3`, analytics form uses 1 column at 320/390/767, 2 at 768/991, 4 at 992, and audit form uses 1/2/5 at phone/768/1366. At 320/390px long header actions wrap or stack. Other routes inherit the same shared rules, so do not assert independent browser results for delegated content.
- Reproduction from a working checkout (not run): `grep -RnlE '<h1([[:space:]>])' src/app --include='*.tsx'`, `grep -RnlE '<PageCanvas([[:space:]>])' 'src/app/(authenticated)' --include='*.tsx'`, `grep -RnlE '<main([[:space:]>])' src/components --include='*.tsx'`, and `grep -RnlE 'rounded-(xl|2xl|lg).*border|border.*rounded-(xl|2xl|lg)' src/app src/components --include='*.tsx'`. Indexed GitHub search is not a whole-worktree grep; **global counts unavailable**. No lint, tests, TS compiler, CI, Playwright, screenshot comparison, or runtime observed.

### Source-completed file checklist (not B5/B6/E6 category closure)

- [x] `src/app/(authenticated)/admin/audit/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/activity/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/admin/placements/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/admin/projects/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/admin/placements/drives/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/admin/projects/templates/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/admin/projects/at-risk/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/components/projects/project-admin-at-risk-page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/components/projects/project-admin-reassign-mentor-page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/components/placements/placement-job-create-workspace.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/error.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/activity/[eventId]/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/admin/placements/analytics/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/admin/placements/student-lookup/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/admin/projects/audit/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/admin/projects/readiness/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/app/(authenticated)/admin/projects/submissions/page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/components/projects/project-admin-audit-page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/components/projects/project-admin-readiness-page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)
- [x] `src/components/projects/project-admin-submissions-page.tsx` (scoped source greps: raw h1/main/PageCanvas 0/0/0; value table above, responsive trace above; visual check pending)

**Unresolved strict category gates:** B5 [ ] (measured TPO h1 30px differs from legacy listing SCSS 28px, breadcrumb separators missing exact style source, whole-tree hand-rolled title enumeration not exhaustively captured); B6 [ ] (physical responsive/screenshots unavailable and mixed SCSS breakpoint evidence outstanding); E6 [ ] (global card-in-card classification and grep incomplete). Do not certify pixel parity based on source.

**Next exact file:** `src/app/(authenticated)/admin/placements/applications/page.tsx` (continue Super Admin Placements table header/actions/breakpoints); then `src/app/(authenticated)/admin/placements/offers/page.tsx` and remaining placements detail routes. Additional Projects/card work follows full inventory.


## Work queue — replacement chat-9, 2026-10-20, second complete-file batch

**Integration and scope.** `main` at `75cef123a9bafdf9126daaeb23556f66cb878caa` was verified to contain prior chat-9 head `663254b940809b626fa4f228489a1082c6a5bca7`; the branch was advanced by a non-force, expected-SHA fast-forward before the following changes. All changes committed with `[chat-9]` to `chatgpt/chat-9-b` only. **20 distinct source files** below were modified and fetched again from that branch. No app, typecheck, CI, tests or runtime screenshots were performed. Prior completed file counts are excluded here.

### Literal value baselines for the matrices

- `docs/design/old-lms-shell-spec.md:18-20`: the single canvas has **#fff background / 1px #e5e9f0 border / 12px radius / 24px padding / no shadow** on **#f1f4f9** shell; `src/components/ui/page-canvas.tsx:13-23` and `src/app/(authenticated)/layout.tsx:145-157` implement that inherited surface. No route in this batch should add a second canvas or main.
- `docs/design/old-lms-shell-spec.md:26-28`: measured legacy TPO title **30px / 600 / #172033**, subtitle on the same row, actions at right. `docs/design/legacy-styles/components___listing-page-header.scss:26-49,80-85,130-154`: **24px desktop gap**, **16px title/subtitle gap**, **16px action gap**, **8px action top inset**, **1px #e5e9f0 separator**, **16px bottom padding**, **20px phone title**, full-width stacked phone actions through **767px**. Current `src/components/ui/page-header.tsx:25-50` supplies these layout semantics with the known 28px listing-title variant conflict kept open.
- `docs/design/legacy-styles/components___learn-layout.scss:361-383`: **44x44px** phone back target, label hidden on phone with accessible name, teal **#26bac7** hover and **150ms** transition; `src/components/ui/page-back-link.tsx:18-30` has `min-h-11 min-w-11`, `md:inline` label, teal and `duration-150`. `docs/design/legacy-styles/components___variables.scss:148-159` defines **<=767 / 768-991 / >=992 / >=1366** responsive intervals; `old-lms-pages.md:5-13` limits full cards to standalone objects, ordinary content separated by hairlines.

### Per-file value comparisons, grep and responsive checks

#### 1. `src/components/admin/admin-scoped-read-page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/components/admin/admin-scoped-read-page.tsx:33` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/components/admin/admin-scoped-read-page.tsx:33`: PageHeader now owns directory back and CSV export; section-mode export preserved | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/components/admin/admin-scoped-read-page.tsx:33`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/components/admin/admin-scoped-read-page.tsx:33`: 1 filter column <768, 2 at 768, 4 at 992; 44/36px buttons; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/components/admin/admin-scoped-read-page.tsx:33`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/components/admin/admin-scoped-read-page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 2. `src/app/(authenticated)/admin/placements/applications/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/applications/page.tsx:11` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/applications/page.tsx:11`: Applications delegated header explicitly selects Placement overview back | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/components/admin/admin-scoped-read-page.tsx:26-37`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/components/admin/admin-scoped-read-page.tsx:88-112`: inherits shared directory filters and export responsive rules; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/applications/page.tsx:11`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/applications/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 3. `src/app/(authenticated)/admin/placements/offers/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/offers/page.tsx:7` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/offers/page.tsx:7`: Offers delegated header explicitly selects Placement overview back | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/components/admin/admin-scoped-read-page.tsx:26-37`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/components/admin/admin-scoped-read-page.tsx:88-112`: inherits shared 44/36px back and filters; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/offers/page.tsx:7`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/offers/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 4. `src/app/(authenticated)/admin/placements/interviews/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/interviews/page.tsx:9` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/interviews/page.tsx:9`: Interviews/rounds directory back lives in PageHeader | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/components/admin/admin-scoped-read-page.tsx:26-37`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/components/admin/admin-scoped-read-page.tsx:88-112`: inherits shared 44/36px back and filters; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/interviews/page.tsx:9`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/interviews/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 5. `src/app/(authenticated)/admin/placements/hiring/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/hiring/page.tsx:7` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/hiring/page.tsx:7`: Hiring applications summary back lives in PageHeader | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/components/admin/admin-scoped-read-page.tsx:26-37`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/components/admin/admin-scoped-read-page.tsx:88-112`: inherits shared 44/36px back and filters; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/hiring/page.tsx:7`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/hiring/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 6. `src/app/(authenticated)/admin/placements/joining/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/joining/page.tsx:7` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/joining/page.tsx:7`: Joining outcomes directory back lives in PageHeader | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/components/admin/admin-scoped-read-page.tsx:26-37`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/components/admin/admin-scoped-read-page.tsx:88-112`: inherits shared 44/36px back and filters; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/joining/page.tsx:7`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/joining/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 7. `src/app/(authenticated)/admin/placements/screenings/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/screenings/page.tsx:7` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/screenings/page.tsx:7`: Screenings queue directory back lives in PageHeader | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/components/admin/admin-scoped-read-page.tsx:26-37`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/components/admin/admin-scoped-read-page.tsx:88-112`: inherits shared 44/36px back and filters; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/screenings/page.tsx:7`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/screenings/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 8. `src/app/(authenticated)/admin/placements/shortlisted/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/shortlisted/page.tsx:7` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/shortlisted/page.tsx:7`: Shortlisted directory back is in PageHeader; CSV stays in head | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/components/admin/admin-scoped-read-page.tsx:26-37`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/components/admin/admin-scoped-read-page.tsx:88-112`: inherits shared 44/36px back, CSV and filters; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/shortlisted/page.tsx:7`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/shortlisted/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 9. `src/app/(authenticated)/admin/placements/seasons/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/seasons/page.tsx:7` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/seasons/page.tsx:7`: Seasons directory back lives in PageHeader | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/components/admin/admin-scoped-read-page.tsx:26-37`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/components/admin/admin-scoped-read-page.tsx:88-112`: inherits shared 44/36px back and filters; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/seasons/page.tsx:7`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/seasons/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 10. `src/app/(authenticated)/admin/placements/job-settings/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/job-settings/page.tsx:7` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/job-settings/page.tsx:7`: Job settings directory back lives in PageHeader | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/components/admin/admin-scoped-read-page.tsx:26-37`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/components/admin/admin-scoped-read-page.tsx:88-112`: inherits shared 44/36px back and filters; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/job-settings/page.tsx:7`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/job-settings/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 11. `src/components/admin/super-admin-placement-detail-view.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/components/admin/super-admin-placement-detail-view.tsx:9` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/components/admin/super-admin-placement-detail-view.tsx:9`: Placement detail back + related + optional application actions now header actions; facts below | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/components/admin/super-admin-placement-detail-view.tsx:9`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/components/admin/super-admin-placement-detail-view.tsx:9`: facts grid one column phone, two at 768; 44px back phone; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/components/admin/super-admin-placement-detail-view.tsx:9`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/components/admin/super-admin-placement-detail-view.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 12. `src/app/(authenticated)/admin/placements/retention/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/retention/page.tsx:25` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/retention/page.tsx:25`: Retention review header back, no separate nav row; scope-recovery header back | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/app/(authenticated)/admin/placements/retention/page.tsx:25`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/app/(authenticated)/admin/placements/retention/page.tsx:25`: PageHeader stacks actions phone and shares 44px back; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/retention/page.tsx:25`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/retention/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 13. `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:47` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:47`: Drive applications uses shared back in head, removes standalone link | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:47`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:47`: filters one column <=767, two at 768, four at 992; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:47`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 14. `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55`: Interview schedule uses shared back in head and one form row at >=768 | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55`: filter grid one column <=767, two fields + action at 768; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 15. `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:22` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:22`: Drive settings head has back action and min-w-0 root; hairline sections preserved | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:22`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:22`: back icon/44px target <=767, label at >=768; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:22`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 16. `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx:15` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx:15`: Application-detail stage/schedule links now supplied to shared header via extraActions | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx:15`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx:15`: header actions stack <=767 and wrap >=768; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx:15`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 17. `src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx:22` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx:22`: Scope and unavailable headers retain shortlisted-list back action | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx:22`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx:22`: shared 44px phone back with hidden label; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx:22`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 18. `src/app/(authenticated)/admin/placements/calendar/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/calendar/page.tsx:27` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/calendar/page.tsx:27`: Calendar missing-college header gets placement back action; active workspace delegated | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/app/(authenticated)/admin/placements/calendar/page.tsx:27`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/app/(authenticated)/admin/placements/calendar/page.tsx:27`: phone/desktop shared header and back behavior; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/calendar/page.tsx:27`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/calendar/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 19. `src/app/(authenticated)/admin/placements/new/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/new/page.tsx:14` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/new/page.tsx:14`: Create-drive missing-college heading gets placement back action; populated state already shared | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/app/(authenticated)/admin/placements/new/page.tsx:14`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/app/(authenticated)/admin/placements/new/page.tsx:14`: phone/desktop shared header and back behavior; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/new/page.tsx:14`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/new/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

#### 20. `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx`

| Property / state | Old LMS exact value and file:line | vNext value and file:line | Source result |
| --- | --- | --- | --- |
| Canvas default | `old-lms-shell-spec.md:18-20` #fff, border 1px #e5e9f0, radius12, padding24, shadow none on #f1f4f9 | `src/components/ui/page-canvas.tsx:13-23`; `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:17` no nested surface/main | Match inherited single canvas |
| Page head default/action | `old-lms-shell-spec.md:26-28` title30px/600/#172033, inline subtitle/right actions; `components___listing-page-header.scss:26-49,80-85` gap24 / action gap16/top8 | `src/components/ui/page-header.tsx:25-50`; `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:17`: Drive detail missing-college header gets placement back action; populated workspace delegated | Matches measured TPO head anatomy; alternative 28px listing value remains globally open |
| Phone back/hover/focus | `components___learn-layout.scss:361-383` back44x44, label hidden max767, #26bac7 on hover and 150ms | `src/components/ui/page-back-link.tsx:18-30`; `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:17`; shared back and existing focus selectors | Matching source values; browser focus untested |
| Responsive + tablet | `components___variables.scss:148-159`: <=767 / 768-991 / 992+ / 1366+; `components___listing-page-header.scss:130-154`: 20px phone head, full-width action stack | `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:17`: phone/desktop shared header and back behavior; `src/components/ui/page-header.tsx:25-50` | Source-class branch trace, not physical viewport test |
| Empty/error/loading/disabled and E6 | `old-lms-pages.md:5-13` one canvas; separate objects only; strict states in `ui-clone-checklist.md:11-18` | `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:17`; existing guarded service/permission and recovery branches retained; no native h1 or nested main/canvas | Scoped JSX state retention; no runtime certification |

- [x] **File-level source completion** (`grep -En '<h1([[:space:]>])|<main([[:space:]>])|<PageCanvas([[:space:]>])' 'src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx'` — **0** matches; JavaScript regex equivalent verified from branch read; `div/section/article/form/nav/ul/ol/dl/label` open/close counts balanced; responsive branch proof above; screenshot proof pending)

### Scoped grep and breakpoint aggregate

- **20/20** revised files fetched on `chatgpt/chat-9-b` after their source writes: source-equivalent `/<h1(?:\\s|>)/g`, `/<main(?:\\s|>)/g`, `/<PageCanvas(?:\\s|>)/g` all **0/0/0 in every file**. Scoped JSX open/close counts for `div, section, article, form, nav, ul, ol, dl, label` all balanced. Nine 9-16-line list routes are canonical `AdminScopedReadPage` delegates with explicit `backHref`, **not independent copies of heading markup**. The shared form, CSV behavior and all read-only error/empty states are in `admin-scoped-read-page.tsx`; `headingMode="section"` retains its own CSV control to avoid dropping existing embedded-directory export.
- **Phone 320/390/767px:** header title20px, actions full width and vertical, back hit area44px; directory form single column, drive application filters one column, interview schedule inputs stacked. **Tablet 768/991px:** header title30px, back label visible, directory filters 2 columns, application filters 2, schedule 2 fields plus Apply. **Desktop 992/1199px:** directory and drive application filters 4 columns; detail facts 2 columns. **1366px+:** existing higher-breakpoint portal layout retained (no 1366-only structure added here). These are static class-rule traces, not executed CSS/screenshots.
- The directory CSV action was moved from a floating button below the page head into `PageHeader.actions`. Interactive export and its pending/error states remain in unchanged `admin-scoped-csv-control.tsx`. Placement detail retains status pill and related URL; `extraActions` moves application decision and scheduling shortcuts into the same head. Route service calls, persistence and permission checks were not altered. No AI or page-content redesign.
- **Category B5 [ ] / B6 [ ] / E6 [ ] stay open.** Global exhaustive grep/card-classification and image-side-by-side proofs are unavailable; desktop measured 30px vs legacy listing SCSS 28px remains unresolved. No false category tick or total-route zero claim.

**Next exact file:** `src/app/(authenticated)/admin/placements/interviews/[roundId]/page.tsx` — verify delegated detail back and heading against `SuperAdminPlacementDetailView`, then `src/app/(authenticated)/admin/placements/offers/[offerId]/page.tsx`, followed by remaining Super Admin placements detail and Projects admin card-in-card classification.

### Post-batch upstream integration — source reconciliation

The owner/orchestrator advanced `main` during this lane's changes. Rather than resetting or overwriting upstream work, the branch now includes `main` commit `78940091eebe986aad07e2fc7c5577579384a8c1` in a **two-parent merge** `a7eb3887db9ad5182f0a99f5d3da4ea60ab28d7b`. This is a merge, **not** a literal worktree `git rebase` (unavailable in the connected GitHub workflow). Lease-checked branch ref update succeeded, with no update to `main`. Comparison immediately after merge: `main...chatgpt/chat-9-b` 10 commits ahead / 0 behind and 9 remaining differing files.

The merge was constructed on the current `main` tree, preserving 180 incoming upstream commits; the 9 branch-only modified files were replayed. The only overlapping application-detail source update was reconciled manually: `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx` retains upstream stage-history `StatusBadge` and the lane's new page-header `extraActions`. The shared placement-detail component retains upstream back and related links **once** in the head (avoiding duplicate footer actions), with optional extra actions and a two-column >=768 fact grid. Source re-fetch confirms both behaviors. B5/B6/E6 remain unticked for global/browser proof.
