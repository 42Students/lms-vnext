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
