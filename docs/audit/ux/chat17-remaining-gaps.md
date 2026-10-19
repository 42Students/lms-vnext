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
