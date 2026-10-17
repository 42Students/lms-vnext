# UX Playbook — shared component changelog

## 2026-10-18 · chat-17 initial authoring branch

Scope: `chatgpt/chat-17-b` only. This log records **authored, remotely committed** changes, not a claim that typecheck, browser audits, or three independent approvals passed. The orchestrator owns verification. Source rules: `UX-PLAYBOOK.md`, `UX-AUDIT-RUBRIC.md`, `lms-color-parity.md`, `src/app/globals.css`.

### Added shared components

| File | Export / API and purpose |
|---|---|
| `src/components/ui/card.tsx` | `Card` with semantic element, title, description and optional footer; 16/24px content padding |
| `src/components/ui/skeleton.tsx` | `Skeleton` with line/card/kpi/row/form geometry; visually reserved space, reduced-motion and live status |
| `src/components/ui/pagination.tsx` | `Pagination`, `paginationWindow`; URL links, 44px controls, bounded page selection, spoken current page |
| `src/components/ui/breadcrumbs.tsx` | `Breadcrumbs` with Next Link to parent and aria-current terminal crumb |
| `src/components/ui/stat-tile.tsx` | `StatTile` with en-IN numeric grouping, text-equivalent value and optional full-tile accessible link |
| `src/components/ui/tabs.tsx` | `Tabs`, `tabNextEnabled`; controlled tablist (Arrow/Home/End/tabpanel), or route-link navigation via `renderPanel={false}` and `item.href` |
| `src/components/ui/selection-controls.tsx` | `Checkbox`, `Radio`, `Switch` with native form inputs, labelled 44px interaction target |
| `src/components/ui/bottom-sheet.tsx` | `BottomSheet`, native modal focus trap/return, safe area and internal scroll |
| `src/components/ui/filter-bar.tsx` | `FilterBar`, inline filters on ≥640px, BottomSheet on phones, active count |
| `src/components/ui/tooltip.tsx` | `InfoPopover` and `Tooltip` alias based on focus/click-reachable disclosure, not hover |
| `src/components/ui/avatar.tsx` | `Avatar` and `avatarInitials`; image dimensions, initials and image-load-failure fallback |
| `src/components/ui/file-upload.tsx` | `FileUpload`, `fileSizeIsValid`; native chooser, local size validation and accessible error |
| `src/components/ui/page-loading.tsx` | `PageLoading` skeleton with 12s slow-state fallback and retry |

### Updated shared components — backwards-compatible public props retained

| File | Changes |
|---|---|
| `button.tsx` | Kept variant/size and native button props; optional loading/busy, ≥44px target, dark-on-canonical-teal contrast, safe error-subtle destructive fill, visible deep-teal focus |
| `input.tsx` | Kept native input/ref props; optional `error`, 16px type to avoid WebView zoom, contrast/focus |
| `select.tsx` | Kept native select/children props; optional `error`, native phone picker, ≥44px |
| `textarea.tsx` | Kept native textarea props; optional `error`, 16px font, resize, visible focus |
| `page-header.tsx` | Kept `eyebrow/title/description/actions`; one h1, word wrap, phone action row |
| `status-badge.tsx` | Kept `children/tone/className`; canonical semantic tints with legible foreground labels |
| `empty-state.tsx` | Kept `title/description/action`; responsive spacing, break words |
| `error-state.tsx` | Kept `title/description/action`; role alert, responsive panel, no exposed codes |
| `data-table.tsx` | Kept generic columns/rows/getRowKey/empty; optional `caption/rowHref/mobileLabel/mobilePriority`, desktop table + phone card with up to three secondary fields and “More details” disclosure for remaining fields |
| `dialog.tsx` | Kept open/onOpenChange/title/description/children/footer; optional dismissible, unique IDs, native focus containment and full-screen mobile panel |
| `drawer.tsx` | Same existing props, optional dismissible; phone full-screen, desktop right dock, safe-area footer, native modal |
| `confirm-dialog.tsx` | Same existing action props; cancel first, cannot dismiss when pending, controlled destructive action |
| `confirm-action-dialog.tsx` | Same legacy confirmation props, now composed with shared native Dialog instead of a custom unmanaged overlay |
| `toast.tsx` | Same Provider and `useToast().showToast` API; safe-area placement, 44px close, timer cleanup, announcement |
| `third-party-link.tsx` | Same href/label; replaced popup with same-tab http(s) link and selectable fallback URL for WebViews |
| `inline-notice.tsx` | Same tone/message/onDismiss/timeout props; high-contrast focus and ≥44px dismiss |
| `loading-state.tsx` | Same label prop; now delegates to Skeleton |
| `graceful-page-loading.tsx` | Same zero-prop API; consistent Skeleton geometry + 12s fallback |

### Four live route references — roles and composition

| Archetype / role | File | Integrated change and preserved behaviour |
|---|---|---|
| Directory / College Admin | `src/app/(authenticated)/college/contacts/page.tsx` | FilterBar phone sheet, URL query GET form and real service results, Pagination, StatusBadge; preserves masking/exports, role filters and existing strings |
| Editor / Faculty | `src/app/(authenticated)/teacher/profile/details/page.tsx` | Breadcrumbs, Card and responsive max width; retains existing permission check and server-loaded document |
| Detail tabs / Mentor | `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx` | active-tab Breadcrumbs, Card and legacy tools; `src/components/projects/mentor-project-tabs.tsx` uses shared link-based Tabs, preserves ordered labels, route query and workspace data |
| Dashboard / TPO | `src/app/(authenticated)/tpo/home/page.tsx` | StatTiles from existing real counts/rows; retains work-queue, next actions, tenant services and links |

Supporting form behaviour: `src/components/people/faculty-profile-editor.tsx` replaces `window.confirm` with an accessible `ConfirmDialog`; existing save/version/receipt logic stays. Each of the four reference route `loading.tsx` and `error.tsx` boundaries (8 files) now use bounded shape-matched loading and graceful retry without raw stack/error codes.

### Unit and audit evidence

- `tests/ux-playbook-primitives.test.tsx`: named tests `UX-PLAYBOOK-01` through `UX-PLAYBOOK-09` exercise pagination windows and announcements, disabled tab traversal, file size, avatar initials, semantic mobile/desktop table, skeleton markup, route-link tabs and en-IN KPI grouping. **Authored but not executed in this lane.**
- **No runtime/browser proof claimed.** Orchestrator must execute `npm run typecheck`, `npm run lint`, `npm test -- tests/ux-playbook-primitives.test.tsx` then full tests, audit role/mobile route matrix at 320/360/390/768/1280px with keyboard, VoiceOver and TalkBack. Follow `docs/design-system/UX-AUDIT-RUBRIC.md` for three sign-offs.
- Candidate weak spots for auditors: dense legacy forms not yet converted to reusable FormField wrappers; native-app back-button interception/keyboard in embedded WebViews is host dependent; legacy teal-on-white older call sites outside modified components may fail WCAG AA; new shared components have not been swept against 30+ call sites; `FilterBar` switches layouts after media-query hydration; existing complex reference pages retain non-playbook nested widgets. No page-level UX checklists marked DONE.
