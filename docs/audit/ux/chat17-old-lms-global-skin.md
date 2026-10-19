# chat-17 — Old LMS global skin handoff (2026-10-19)

## North star and source of truth

This lane covers **global tokens and shared UI primitives**, not the sidebar/topbar (chat-19/chat-13), and **does not change each page's content or business behaviour**. Source measurements: `docs/design/old-lms-shell-spec.md`, `old-lms-shell.css`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md`, and `legacy-styles/components___{variables,button,form,dropdown,header,common,antddesign,learn-layout,notification-drawer}.scss`.

- App shell `#f1f4f9`, page canvas `#fff`, `1px #e5e9f0`, radius 12px, desktop padding 24px, no shadow; authenticated content wrapped once in `src/app/(authenticated)/layout.tsx` via `PageCanvas`.
- Inter variable weights; JetBrains Mono retained; heading `#172033` 30px / 600 / 1.35, body 14px, legacy neutral and teal palette.
- Primary button `#0a7c88` with white text, 9px radius, 36px height, 14px / 650; separate hover, active, focus, and disabled states; mobile hit targets at least 44px.
- Forms 9px radius, 36px height, 14px / 20px; legacy placeholder, hover, error, and teal focus treatments.
- Tabs 13px / 600 with 3px teal active underline; tables subtle header, hairline dividers, compact desktop rows; mobile column disclosure retained.
- Overlays, status indicators, notices, and states use the same surface/border/radius/shadow/motion tokens; reduced motion and tracker-only dark mode retained.

## Updated existing shared components

| Component family | Files |
| --- | --- |
| Primary, secondary, danger, and ghost controls | `button.tsx` |
| Text and form inputs | `input.tsx`, `select.tsx`, `textarea.tsx`, `form-field.tsx`, `file-upload.tsx` |
| Badges and tab navigation | `status-badge.tsx`, `tabs.tsx` |
| Dialog, drawer, bottom sheet, toast and tooltip | `dialog.tsx`, `drawer.tsx`, `bottom-sheet.tsx`, `toast.tsx`, `tooltip.tsx` |
| Table, pagination, filtering | `data-table.tsx`, `pagination.tsx`, `filter-bar.tsx` |
| Page framing, cards and information hierarchy | `page-header.tsx`, `card.tsx`, `stat-tile.tsx`, `avatar.tsx`, `breadcrumbs.tsx`, `disclosure.tsx` |
| Loading and error/empty experiences | `skeleton.tsx`, `page-loading.tsx`, `loading-state.tsx`, `empty-state.tsx`, `error-state.tsx`, `scroll-cue.tsx` |

## New shared components

`page-canvas.tsx`, `checkbox.tsx`, `radio.tsx`, `badge.tsx`, `modal.tsx` (Dialog alias), `dropdown.tsx`, `menu.tsx`, `table.tsx`, `alert.tsx`, and `banner.tsx`.

## Integration cautions

- Portal lanes should use the shared components and CSS variables rather than copying hard-coded Tailwind colour/radius/padding; retain all page data, actions, and permissions.
- `PageCanvas` is already wrapped at the authenticated layout level; **do not nest another full-page canvas** in each portal.
- Tables preserve mobile disclosure and hidden-column authorization checks; avoid converting them to desktop-only HTML tables.
- Sidebar hover rail and topbar are **not** owned by chat-17; coordinate their final horizontal dimensions with the 24px canvas shell inset.
- No app execution, browser visual diff, test runs, or CI were performed per owner instructions. Values are source-aligned but pixel parity across all pages is **not yet runtime-verified**.
