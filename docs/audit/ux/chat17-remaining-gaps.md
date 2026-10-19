# chat-17 — remaining global skin gaps and source audit

**Date:** 2026-10-19  
**Scope:** `src/components/ui/**`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(authenticated)/layout.tsx`.  
**Branch:** `chatgpt/chat-17-b` — the lane was fast-forwarded onto the newer `main` before these follow-up commits (the ref had been absorbed into main and was **416 commits behind**, not just the 16 originally mentioned).

## Exact source references and precedence

1. `docs/design/old-lms-shell-spec.md` and `old-lms-shell.css` (running TPO shell measurements) take precedence for the authenticated canvas and shell-era controls: `#f1f4f9` shell, `#fff` canvas, `1px #e5e9f0` border, radius 12px, 24px desktop inset, primary button `#0a7c88` with white text, 36px high and radius 9px, and Inter page typography.
2. `docs/design/legacy-styles/components___variables.scss`: effective palette `#26bac7` accent, `#1a95a1` active text, neutral `#1a1d21/#54505d/#6b7280/#a9a7ae/#d6dbe3/#e5e9f0/#f1f4f9/#fafbfc`; canonical radii 6/10/14/20 and control/card/feature 6/12/18; elevation `$elev-1`…`$elev-4`; fast/normal/slow 150/250/350ms with `cubic-bezier(.2,0,0,1)`.
3. The SCSS file defines `$space-7` and `$space-8` twice. Its **later effective values are 48px and 64px**; the global token aliases were corrected accordingly. The earlier aliases (40px, 48px) are superseded, not chosen at random.
4. `components___button.scss`, `components___form.scss`, `components___dropdown.scss`, `components___antddesign.scss`, `components___common.scss`, `components___header.scss`, `components___learn-layout.scss`, and `components___notification-drawer.scss` supply widget-specific dimensions. Some legacy `.ln-btn--pri` marketing CTAs use asymmetric corners and 40px height; the **measured authenticated TPO control**, not those unrelated marketing buttons, is the shared `Button` default.
5. The source `_form.scss` intentionally keeps keyboard `:focus-visible` rings even though pointer-only focus removes outlines. We preserved that. Hover/motion do not weaken disabled or error styling.

## Completed step-by-step reconciliation

| Primitive / file | Legacy mapping and current state |
| --- | --- |
| `button.tsx` | 36px/9px/14px/650 measured primary, white text, dark teal hover; native disabled/busy, `sm` 13px compact legacy exception; secondary hairline `#bfc9da` |
| `input.tsx`, `select.tsx`, `textarea.tsx` | 14px/20px, 0.2px tracking, `#0a0517` text, teal focus and invalid red ring, neutral disabled states |
| `checkbox.tsx`, `radio.tsx` | Native checked/group/keyboard semantics and `#26bac7` selection colour |
| `form-field.tsx`, `file-upload.tsx` | 13px label/helper, visible error text, legacy teal focus and file-button accent |
| `badge.tsx`, `status-badge.tsx` | 12px/18px labels, full pill radius, 22px minimum height and legacy semantic backgrounds |
| `tabs.tsx` | 13px/600, 3px teal underline, 20px item separation and no individual tab cards |
| `dropdown.tsx`, `menu.tsx` | Legacy 6px content radius, `9px 11px 28px rgba(0,0,0,.1)` menu shadow, 44px interactive row height |
| `table.tsx`, `data-table.tsx` | `#fafbfc` header, muted header text, `#e5e9f0` row hairlines, compact 10px/16px desktop cell padding and responsive mobile details |
| `pagination.tsx` | 9px-radius outlined controls, 44px mobile targets, hide noncurrent number links on narrow screens |
| `dialog.tsx`, `modal.tsx`, `drawer.tsx`, `bottom-sheet.tsx` | Legacy white overlay surfaces, elevation-4 modals, slight drawer shadow, teal/keyboard controls, preserved focus management |
| `toast.tsx`, `tooltip.tsx` | Shadowed 12px toast, compact dark `#1a1d21` legacy tooltip (8px radius, 12px text, 6px/16px padding) |
| `alert.tsx`, `banner.tsx` | Compact 13px semantic strips, white/amber/teal/red corresponding legacy surfaces |
| `card.tsx`, `stat-tile.tsx`, `avatar.tsx` | White bordered 12px resting panels without heavy shadow; 44px default user avatar |
| `skeleton.tsx`, `loading-state.tsx`, `page-loading.tsx` | Pale `#f1f4f9` placeholders with 8px radius and reduced-motion behaviour |
| `empty-state.tsx`, `error-state.tsx`, `page-header.tsx` | Old LMS neutral header hierarchy and 30px/600 `#172033` page heading |
| `breadcrumbs.tsx`, `disclosure.tsx`, `scroll-cue.tsx`, `filter-bar.tsx` | Teal links, keyboard focus, hidden-but-cued overflow, unboxed desktop filters |
| `page-canvas.tsx` | One `#fff` background canvas, `1px #e5e9f0` border, radius 12px, 24px desktop padding (16px on small phones), no shadow |
| `src/app/globals.css` | Detailed palette, aliases, spacing, radii, 4-level shadows, scrollbars, focus rings, dropdowns, tables, tabs, badges, overlays, toasts, mobile hit targets, tracker dark override and reduced motion |
| `src/app/layout.tsx` | Self-hosted Next.js Inter and JetBrains Mono font variables retained |
| `src/app/(authenticated)/layout.tsx` | Exactly **one** shared canvas around authenticated page children and visible portal/connection notices, inside `AppShell`. Session guard remains outside the visual canvas |

## Remaining verification gaps / owner coordination

| ID | Status | Scope / needed action |
| --- | --- | --- |
| CHAT17-VIS-01 | **Unverified, no CI by instruction** | The source-level metrics are in place, but cannot claim pixel-exact parity until owner/orchestrator screenshots cover TPO, HR, Learner, Mentor, Faculty, College Admin and Super Admin at desktop + phone widths; compare actual computed dimensions and focus/hover states |
| CHAT17-SHELL-02 | **Other lane** | Sidebar 96px→256px hover expansion and push layout (chat-19), topbar 68px and command actions (chat-13) must be merged with this canvas; chat-17 did not edit their owned files |
| CHAT17-PAGES-03 | **Other lanes** | Individually hard-coded page-specific Tailwind colors, nested section cards, or width/padding can still diverge. Portal lanes own page sweeps; shared primitives do not rewrite page content |
| CHAT17-UX-04 | **Runtime-only** | Full keyboard tab traversal, mobile dropdown viewport clipping, reduced motion, WebView overlays and popup stacking should be manually verified after integration; focus behavior was preserved in source |
| CHAT17-TECH-05 | **Non-blocking cleanup** | `globals.css` retains earlier source-aligned skin declarations followed by explicit final token overrides. Consolidating duplicates is future maintainability work after screenshots are approved; active cascading values now use the reconciled tokens |
| CHAT17-TEST-06 | **Deferred by owner** | No local app execution, typecheck, unit tests, E2E tests, visual diff or CI were run for this batch. Owner requested no CI until the full rollout completes |

## Contract for other lanes

Do not wrap `PageCanvas` per page: it is already present in the authenticated layout. Do not change each page's sections, content or behavior to achieve a global look. Use `Button`, `Input`, `Select`, `Textarea`, `Tabs`, `DataTable`, etc., or their CSS data-slot skins instead of hard-coded colors. `src/components/shell/**` belongs to the dedicated sidebar/topbar lanes. Preserve mobile action targets, permitted hidden table fields and reduced-motion behavior.


## Continued shared-kit sweep — 2026-10-19 afternoon

- Fast-forwarded `chatgpt/chat-17-b` to `ee98b58c86df02c0513136baab6d35ef633fef59` (the then-current `main`). At the start of this pass, the lane was **851 commits behind and zero ahead** because the preceding lane commits had already been integrated. Newer parallel merges may advance main again during these edits.
- Enumerated the repository's actual `src/components/ui` directory using GitHub contents; **49** shared files currently exist (including two non-visual hooks and the `Modal` re-export), rather than relying on the earlier 39-file pre-skin ledger.
- Reconciled the remaining visual primitives that were not covered in the original skin batch: `confirm-action-dialog`, `confirm-dialog`, `disabled-reason`, `disclosure`, `graceful-page-loading`, `loading-state`, `page-loading`, `inline-notice`, `long-text`, `permission-action`, `selection-controls`, `third-party-link`; followed with precise label, focus and sizing updates in `breadcrumbs`, `form-field`, `stat-tile`, `filter-bar`, `checkbox` and `radio`. Each source file was committed independently under `[chat-17]` on the lane branch.
- Preserved pre-existing native semantics: confirmation pending/disabled states; loading recovery action; non-dismissible pending overlays; helper/error IDs; switch checkbox/role semantics; URL policy on external links; permissions deny/hide decisions; and keyboard focus for disclosure and disabled reasons.
- `GracefulPageLoading` stays `aria-busy=true` for the entire mounted loading lifetime, including when its slow-load recovery button appears. A slow loading warning is not completion.
- Reverified that `AuthenticatedLayout` renders **one** `PageCanvas` inside `AppShell`, enclosing portal access notice, connectivity notice and route children, while session/access guards still enforce authorization outside. Added the named `lms-authenticated-canvas` class and full-viewport minimum height on short pages, accounting for the existing mobile (58px) and desktop (68px) top bars and shell main padding (24px or 32px). Longer content grows naturally.
- Both white canvas colors (`#fff`, `#e5e9f0`), 12px radius, 24px desktop / 16px mobile padding and the `#f1f4f9` shell remain intact. No nested page-level canvas was introduced.
- **Unverified:** no CI, tests, compilation or browser screenshot comparison was run per owner instruction. Integration with concurrent header/sidebar and portal lane commits needs combined browser review, especially height, responsive overlays, focus, and reduced-motion behavior.


## Continued shared primitive sweep — 2026-10-19 (later pass)

**Source baseline:** `main@d5798cd5a0d4aba3ae022293b231211cf1dbb04d`, fast-forwarded onto `chatgpt/chat-17-b` before editing. Previous chat-17 commits had already been merged. Each subsequent `src/components/ui` change was committed directly and separately to **the lane branch only**.

- Neutral/feedback: `avatar`, `skeleton`, `empty-state`, `error-state`, `card`, `status-badge` and `badge` use the actual legacy body/header/accent colors and shadowless white surfaces. Default avatar remains 44px, independent of the topbar owner’s 42px header avatar.
- Layout/scroll: `page-header` uses the shell-era heading/canvas border tokens; `scroll-cue` uses a teal visible keyboard focus and a **theme-sensitive** fade `from-surface` rather than a hard-coded white fade. No changes to overflow measurement or input handlers.
- Core controls: `button`, `input`, `select`, `textarea`, `pagination` and `dropdown` use the effective measured 9px control radius, neutral input border and teal focus token. Standard button continues to use 36px primary height, solid `#0a7c88` and white text.
- Interactive data: `table`/`data-table` preserve compact old-LMS hairlines and muted `#fafbfc` headings; responsive per-row hidden-field and safe URL semantics were not touched. Tracker opt-in dark surface remains variable-driven, not forced white inside mobile rows.
- Overlays and messaging: `toast`, `tooltip`, `dialog`, `drawer`, `bottom-sheet`, `alert`, `banner` and `tabs` use matched old-LMS palettes, elevation, radius and border variables. Native `<dialog>` focus/close behavior and all ARIA descriptions remain unchanged.
- File/menu/selection: `file-upload`, `menu`, `selection-controls` keep legacy form labels and the teal checkbox/switch treatment, with existing pointer/keyboard and disabled handling intact.
- **Authenticated canvas:** `src/app/(authenticated)/layout.tsx` continues to own exactly one `<PageCanvas className="lms-authenticated-canvas" data-authenticated-canvas="true">` wrapping the portal notices and authenticated route children. `PageCanvas` applies 24px desktop padding from the shared `--lms-canvas-padding` token; outer surface remains `#fff`, border `#e5e9f0`, radius 12px on `#f1f4f9` shell. Topbar/sidebar remain dedicated lane ownership.
- **Verification gate still open:** source-level code edits only. Per owner direction, no local app run, typecheck, unit/E2E, screenshot diff or CI was performed.


## Continued shared primitive sweep — third pass, 2026-10-19

**Baseline synchronized:** `main@6222f78a4a19084be6529aa802810ee98193c1d2` fast-forwarded into `chatgpt/chat-17-b`. The prior batch was already merged to main, so this was a clean fast-forward, not a force push or replayed patch. All writes below targeted `chatgpt/chat-17-b` with independent `[chat-17]` component commits.

- **Under-styled shared primitives:** `disabled-reason`, `long-text`, `graceful-page-loading`, `loading-state`, `page-loading`, `permission-action`, `form-field`, `confirm-action-dialog`, `confirm-dialog`, `inline-notice`, `selection-controls`, `third-party-link` and `filter-bar`. Replaced remaining raw neutral/teal text values, gaps, radii, borders and focus colors with the documented old-LMS token system without touching business logic, loading/permission semantics, external URL guards, focus management or caller props.
- **Next shared controls:** `checkbox`, `radio`, `disclosure`, `menu`, `table`, `alert`, `banner`, `card`, `page-header`, `empty-state` and `error-state`. Adopted the canonical `--lms-*` spacing/radius/typography and hairline colors; kept teal native input selection, 44px keyboard/touch targets, signed-off notification tones and 30px desktop page headings.
- **Authenticated canvas integration:** Confirmed one and only one `PageCanvas` wraps `PortalAccessNotice`, `ConnectionFailureNotice` and `children` inside `AppShell` in `src/app/(authenticated)/layout.tsx`. Added `data-lms-page-surface="legacy-single-canvas"` to make that exact shell surface auditable; `src/app/globals.css` now keys full-height canvas styling to `[data-slot="page-canvas"][data-authenticated-canvas="true"]`, instead of a generic class that could accidentally match nested page sections. The canvas still has a white `#fff` surface, `1px #e5e9f0` border, 12px radius, 24px desktop / 16px phone padding, no shadow, over `#f1f4f9` shell.
- **Validation outstanding:** No code execution, typecheck, lint, tests, CI or screenshot comparisons were performed at owner request. Browser visual verification and work by the separate shell/portal lanes remain coordination items; no claim of pixel-perfect runtime output is made.


## Continued shared global skin sweep — main merge and follow-up primitives

**Source coordination:** On 2026-10-19, this lane was three commits ahead of `main` and 193 behind. Preserved the three unmerged authenticated canvas and audit commits by creating a genuine two-parent merge onto then-current `main@8175bfbde69c2ffbec45f33ac08453dfe68a31e4`. No reset or forced ref update; the resulting lane merge commit was `c74c4b9e26401eb22c909f5961f7d346d30d1476`.

**Component commits, one file at a time:**
- `data-table`: old-LMS compact neutral table headers, border/radius tokens, legacy link color and keyboard focus. Existing per-row authorization, hidden columns, safe URLs, mobile disclosure, and one-cell-render rules untouched.
- `tabs`: measured 20px spacing and underline behavior with neutral border and teal selected text in both interactive and link navigation modes; no keyboard/ARIA changes.
- `file-upload`: 9px control radius, compact label/helper/error text, teal file action and focus ring; picker constraints and disabled/error announcements unchanged.
- `toast`: 12px white notification cards, correct elevation, compact text and 44px dismiss controls; persistence and viewport/timer behavior untouched.
- `dropdown` / `menu`: desktop 6px legacy menus and mobile 14px rounded drop-down surface, matching old-LMS `components___dropdown.scss` (mobile panel with 16px padding; desktop 16px vertical/24px horizontal), legacy typography, keyboard/hover accents.
- `tooltip`, `pagination`, `dialog`, `drawer`, `bottom-sheet`, `filter-bar`: consolidated radius/border/spacing/heading/elevation tokens, preserving safe-area/backdrop, focus trapping, history handling and reduced-motion behavior.
- `selection-controls`, `breadcrumbs`, `confirm-action-dialog`: minor final neutral/focus/spacing parity. Added `--lms-avatar-placeholder: #c4c4c4` to `globals.css` and applied it to `avatar`, matching the exact legacy profile placeholder.

**Canvas:** `src/app/(authenticated)/layout.tsx` still renders exactly one `<PageCanvas>` enclosing the portal access notice, connection failure notice and authenticated route children. The marked full-height surface uses `#fff`, `#e5e9f0`, radius 12px, 24px desktop and 16px small-screen padding over the `#f1f4f9` shell. Authentication guard remains outside the surface; shell ownership stays in its separate lane.

**Not certified by this pass:** UI parity on actual browser/phone resolutions, overlay stacking and precise font metrics remain live visual review gates. As instructed, no application execution, typecheck, unit test, Playwright, lint or CI was run.


## Fourth shared skin follow-up — semantic focus and tokens

**Main synchronization:** `main@284472433ab9399db9afd36fee633958d0866d7b` was 53 commits ahead of the lane with zero lane-only commits at synchronization. Fast-forwarded `chatgpt/chat-17-b` before changing any source. Commits were pushed individually to that branch.

**Fresh visual parity work:**
- `Input`, `Select`, `Textarea`: keyboard focus teal `#26bac7`, 9px shell-era controls, disabled neutral surface, and invalid red background, border and ring. A later `globals.css` generic teal-focus rule could previously override the red invalid-focus ring; an explicit later selector now restores the intended `rgba(239,68,68,.2)` red shadow and error outline without weakening keyboard focus.
- `Button`: shared body/teal text tokens for secondary/ghost variants; primary 36px solid `#0a7c88` white CTA remains unchanged; busy/disabled native attributes remain.
- `Badge`, `StatusBadge`: semantic background pills retain the old-LMS 12px/18px scale, with stronger readable semantic text `#065f46`/`#92400e`/`#b91c1c` via new `--lms-*-text` variables rather than unrelated raw text colors.
- `StatTile`: standardized neutral small copy and subtle card border/radius/padding with existing safe internal navigation and numeric formatting.
- `ScrollCue`: legacy teal focus and consistent reduced-motion fade treatment. Actual overflow measurement/ARIA and visible keyboard scroll affordances remain unchanged.
- `InlineNotice`, `Alert`, `Banner`: reuse matching semantic text variables so shared notices and badges cannot drift.
- `Skeleton`: rounded placeholder token from the old LMS 6px/8px-compatible scale, with shimmer and reduced-motion handling unchanged.

**Single PageCanvas integration:** Already wired once inside `src/app/(authenticated)/layout.tsx`; the existing `data-authenticated-canvas="true"` selector and `data-lms-page-surface="legacy-single-canvas"` marker were verified. The canvas encloses portal access/connectivity notices and the authenticated children and remains white with 12px radius, 1px `#e5e9f0` border, 24px desktop and 16px phone inset, full-height shell behavior. No second wrapper was introduced and no unrelated shell file was edited.

**Execution:** Source-only GitHub updates; no TS compilation, lint, unit/E2E, visual snapshots, browser run or CI per orchestrator directive. Pixel-exact and keyboard screen-reader behavior still need a later controlled integrated verification.


## Fifth shared primitive continuation — 2026-10-19

**Integration baseline:** The chat-17 branch had 15 unmerged styling commits plus 44 newer mainline commits. It was merged with `main@f7dd3e81786adf00538daebf63a075046d159b4c` using the actual two-parent merge `cd5404e63dd6b048ade12cf42805bf9326cbb691`, preserving all branch-only edits. The main-side compare contained no overlapping changes under `src/components/ui`, `src/app/globals.css`, `src/app/(authenticated)/layout.tsx` or this audit file.

**Latest per-component old-LMS refinements:** `third-party-link`, `disclosure`, `disabled-reason`, `form-field`, `empty-state`, `error-state`, `page-loading`, `graceful-page-loading`, `permission-action`, `card`, `page-header`, `file-upload`, `breadcrumbs`, `selection-controls`, `tooltip`, and `filter-bar`. Work is limited to documented legacy token spacing, radius, copy/font sizes, neutral/link color, focus styles, motion reduction and minimal notice surfaces. File-upload now styles the actual invalid file-picker state with a red border, subdued red background and matching red focus outline, while preserving file-type/size/permission checks and its accessible error description. External link safeguards and clipboard fallback, and the native keyboard semantics of disclosure/selection, remain unchanged.

**Authenticated canvas:** The current `src/app/(authenticated)/layout.tsx` already contains precisely one `PageCanvas` around access notice, connection-failure notice and page children, with `data-authenticated-canvas="true"` and `data-lms-page-surface="legacy-single-canvas"`. `src/app/globals.css` scopes the min-height white canvas styling to that marker. The shell background is `#f1f4f9`, canvas white, 1px `#e5e9f0` border, 12px radius, no shadow, 24px desktop/16px phone padding. No duplicate canvas or change to `src/components/shell` was introduced.

**Validation caveat:** No runtime execution, typecheck, test suite, CI, lint or browser screenshot comparison was conducted per owner instructions. Syntax and expected JSX structure were checked in source text only; integrated parity remains for later browser verification.


## Sixth shared-component north-star sweep — 2026-10-19

- **Mainline reconciliation:** started at `main@f7dd3e81786adf00538daebf63a075046d159b4c`; the chat-17 lane was 33 commits ahead and no commits behind. While components were being committed individually, the parallel lanes moved `main` to `a98732e8ad1845a88229c57ba38c4a90f02eca77`. The latest main-only commits already contained the prior chat-17 common control sweep; verified file SHA overlap before merging. Brought those main commits into this branch with a real two-parent merge `6c5d8fbb556354e691652192ca1264e89845c963`, preserving the lane's 30 newer shared-component files plus stylesheet/audit, without resetting or pushing to `main`.
- **Shared list and data primitives:** `data-table.tsx` now uses the 13px/20px legacy table type scale with tabular numerics, 16px cell padding, semantic empty-state wrapper and measured mobile spacing. `table.tsx` uses the shared surface and neutral body token. Both use `--lms-table-hover: rgba(38,186,199,.045)` for the old-LMS teal hover. No row access logic, hidden fields, safe link checks or mobile detail permissions changed.
- **Dialog and overlay polish:** `dialog.tsx`, `drawer.tsx`, `bottom-sheet.tsx` align header spacing and typography with old-LMS measurements. In `Dialog` and `BottomSheet`, corrected the responsive width class from invalid CSS `calc(100%-2rem)` to Tailwind escaped-space syntax `calc(100%_-_2rem)`. Existing native `dialog`, close behavior, viewport safe-area and focus behavior are unchanged.
- **Shared controls:** `toast`, `dropdown`, `menu`, `pagination`, `tabs`, `tooltip`, `confirm-dialog`, `avatar` and `skeleton` received shared spacing, neutral copy, radius, reduction-of-motion and focus token alignment. Introduced the exact reference variables `--lms-tab-gap: 20px` and `--lms-skeleton-radius: 8px`; both `globals.css` and the components now use matching values rather than conflicting inline/classes/CSS. `pagination` visibly disables unavailable links without changing link calculation.
- **Authenticated PageCanvas:** `src/components/ui/page-canvas.tsx` now takes its base 16px padding from `--lms-space-4` and uses `--lms-foreground` text while retaining white `#fff`, 12px radius, 1px `#e5e9f0` border, no shadow, and 24px desktop inset. Confirmed the already-wired `src/app/(authenticated)/layout.tsx` still mounts exactly one `PageCanvas` wrapping notices and page children with `data-authenticated-canvas="true"`. No duplicate wrapper or shell/navigation restructuring is needed.
- **Validation boundary:** no local TypeScript execution, typecheck, lint, unit/interaction tests, browser/screenshot comparison, or CI (per request). Final integrated pixel and accessibility verification remains separate.


## Seventh pass — assigned form controls and feedback only (2026-10-19)

- **Ownership confirmed:** chat-17 now owns only the assigned core form controls and feedback surfaces. Chat-9 owns `page-header` / `page-canvas`; chat-14 owns tabs/tables/chips/pagination; chat-16 owns dialogs/drawers/toasts/tooltips/menus. No changes to those other owners' source files in this pass.
- **Main first:** `main@10ac677d5ab403f3c037d559c3321ac55c6cffa6` was merged into `chatgpt/chat-17-b` with two parents (`b02a6042b9ba08c295d31bd1085f6d82fee9496a`). The merge used the new `main` versions of newly reassigned components rather than reapplying this lane's earlier conflicting styling; it preserved the already-unmerged `card`, `empty-state`, `error-state` and audit contributions. Commits following that merge target only the assigned 12 primitives.
- **Controls:** `input`, `select`, `textarea` now explicitly match 36px controls (112px textarea minimum), 9px radius, 14px type, 12px horizontal inset, 200ms border/shadow/background transitions and the teal keyboard focus ring. Validation uses subdued 6% red surfaces and a 20% red focus halo, while disabled neutrals, aria-invalid and native props remain preserved. `checkbox`/`radio` keep native selection with teal accents, white surfaces and visible keyboard/invalid focus. `button` preserves 36px `font-weight:650` white-text `#0a7c88` primary treatment, matching shared spacing and busy/disabled handling.
- **Feedback and surfaces:** `badge` has a compact 22px status pill with wrapping for long content. `card` retains a single-purpose white 1px-bordered, shadowless object surface, now with canonical 16/24px padding and resilient text/footers. `alert` and `banner` keep tone-specific colors and legacy 9px/13px treatment with safe wrapping and button layout. `empty-state`/`error-state` have measured responsive padding and balanced long titles; their text/actions and role semantics are preserved.
- **Authenticated canvas:** the existing `src/app/(authenticated)/layout.tsx` already mounts a *single* `PageCanvas` for authenticated children and notices. Its wiring was **not** changed here because chat-9 is now its explicit owner.
- **Review:** fetched and inspected all 12 edited TSX files for complete JSX closing tags and expected legacy token usage. No application execution, typecheck, lint, tests, CI or screenshot comparison was performed, as requested. This was source inspection only, not a formal syntax/build verification.


## Eighth scoped old-LMS pass — form interaction and long-content resilience (2026-10-19)

- Fast-forward/merge check first: `chatgpt/chat-17-b` was already based on latest `main@10ac677d5ab403f3c037d559c3321ac55c6cffa6` (ahead 52, behind 0), so there was no need to rewrite its history or fabricate a pull. All 12 assigned component files were updated and pushed independently as `[chat-17]` commits, with their JSX source re-read after editing.
- `input.tsx` and `textarea.tsx`: preserve 36px/112px legacy sizing, neutral read-only surfaces, disabled placeholder treatment, `enabled:hover` border behavior and error-red hover that is not overwritten by neutral hover. `select.tsx`: same enabled/invalid hover treatment without disabling the native select appearance or dropdown keyboard behavior.
- `checkbox.tsx` / `radio.tsx`: match accessible old-LMS teal selection plus red invalid keyboard-focus shadow when `aria-invalid` is present; preserve native checked, disabled and keyboard semantics.
- `button.tsx`: primary CTA explicitly uses existing measured `--lms-button-primary` `#0a7c88` and `--lms-button-primary-hover` `#086873` with white foreground, while retaining 36px height, 9px radius, 650 weight, reduced-motion behavior and loading/disabled support. Adds small-screen label wrap resilience without changing event semantics.
- `badge.tsx`: compact old-LMS status pill keeps 22px minimum, 12px type, semantic tones and 999px radius; exposes `data-tone` and supports multiline text without pushing outside narrow tables.
- `card.tsx`: keeps 1px `#e5e9f0` border, 12px radius, white/no-shadow panel, responsive 16/24px padding, and guards long headings/descriptions against overflow. `alert.tsx` / `banner.tsx`: expose stable tone attribute and keep the slim 9px/13px legacy notices with resilient long-message/action wrapping. `empty-state.tsx` / `error-state.tsx`: preserve copy/role/action and improve wrap for long headings and messages without nesting additional canvas surfaces.
- Source-only validation: inspected complete edited component text, matching JSX closing tags and existing CSS token definitions. No code execution, lint, typecheck, tests, CI or screenshot check was performed, as requested.
- Other-lane ownership maintained: no modifications to `page-header`, `page-canvas`, tabs, tables/data-table, pagination, dialog, drawer, toast, tooltip, dropdown, or shared shell files in this pass.


## Ninth scoped pass — current main reconciliation and interactive controls (2026-10-19)

- **Mainline first:** The lane was 13 ahead / 785 behind after parallel changes, based on `5b7934f065a0afa5fe2491de74aef989b6b66f0c`. Pulled current `main@7a059f2734f76a3b7d75842fd94aa6e2e3d6d635` into `chatgpt/chat-17-b` via two-parent merge `468f8a933d550257023703b2f2bf37284a7c93f2`. Reapplied only the lane's 12 assigned file versions plus this audit file over `main`; all excluded shared components remain as they were on the updated main.
- **Forms:** `input` and `textarea` now use the legacy teal caret, clear readonly neutral state and hover behavior, and matching disabled border/surface; native form props, aria-invalid, 9px radius, 14px type and keyboard focus ring are intact. `select` retains its native select indicator and browser keyboard handling, with explicit disabled border styling. `checkbox` and `radio` preserve 20px native selection and teal accent, show neutral disabled surface and opt into native controls for forced-colors/high-contrast environments.
- **Button:** Native button now shows the pointer cursor when interactive, while disabled and busy states retain their own cursor/disabled styling, white `#0a7c88` primary CTA, 36px control height, 9px radius and accessible focus ring.
- **Compact feedback:** `badge` uses tabular numerals for count pills and stable tone/slot markers. `card` preserves metadata and custom classes without letting attribute spreading erase its data-slot; footer is allowed to wrap without horizontal overflow. `alert` is text-left and constrained to the canvas width. `banner` adds a small decorative current-tone dot matching the old LMS pale-yellow inline info strip; recovery actions and accessible role semantics remain untouched.
- **Empty and error states:** Long-body line breaks are balanced by readable width/text wrapping; action rows wrap and remain centered or left-aligned as appropriate. Original content and status/alert semantics are preserved.
- **Boundary and validation:** Only the 12 named UI files plus this audit changed. Specifically **no** edits to `page-header`, `page-canvas`, `tabs`, `table`, `data-table`, `pagination`, `dialog`, `drawer`, `toast`, `tooltip`, `dropdown`, or other-lane owned files. Each component was independently committed and pushed. Read all the edited JSX and inspected closing-tag names in source; no compile/test/CI/lint/app execution or browser verification was run.
