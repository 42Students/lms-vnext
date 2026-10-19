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
| Hover back text | `legacy-styles/components___learn-layout.scss:372-376` color .15s ease to learn accent | `src/components/ui/page-back-link.tsx:23` duration150 to primary text token | Color/token relation not exhaustive; leave open |
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
