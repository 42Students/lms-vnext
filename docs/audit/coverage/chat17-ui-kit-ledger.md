# Shared UI kit exhaustive-coverage ledger — chat-17

**Source inventory:** every file under `src/components/ui` (39 files; checked 2026-10-18). **Ownership:** chat-17. **Scope:** shared visual primitives only; other lanes own Projects route authorization. All test names below refer to `UX-kit-` prefixed test cases. This is a **source-to-test traceability ledger**, not proof of CI success or device-browser coverage.

Tests are in:
- `tests/unit/UX-kit-projects-hardening-chat17.test.tsx` (`UX-kit-HARDEN-01..22`),
- `tests/unit/UX-kit-role-and-overlay-chat17.test.tsx` (`UX-kit-HARDEN-23..31`),
- `tests/unit/UX-kit-states-chat17.test.tsx` (`UX-kit-STATES-01..15`),
- `tests/unit/UX-kit-scroll-motion-01.test.tsx` (`UX-kit-scroll-motion-01..08`).

**Coverage evidence levels:** tests marked only as static SSR/source assertions do **not** prove client keyboard interactions, mobile scroll physics, stateful DOM behavior or actual WCAG conformance; those remain browser/CI gates. No assertion has been intentionally weakened to hide a failure. The known scroll-cue SSR expectation was corrected to assert actual *unmeasured* state and the source's accessible overflow label, rather than falsely advertise an overflow region.

| UI file | Exported runtime components/functions | Behavioral or state test IDs (all UX-kit prefix) | Assertions / limitations |
|---|---|---|---|
| `avatar.tsx` | `avatarInitials, Avatar` | STATES-09; HARDEN-11 | blank/long name, image referrer policy, initials |
| `bottom-sheet.tsx` | `BottomSheet` | STATES-05; HARDEN-16 | nondismissible, accessible title, safe area and scroll |
| `breadcrumbs.tsx` | `Breadcrumbs` | STATES-09; HARDEN-09 | last item not linked; current-page a11y |
| `button.tsx` | `Button` | STATES-01; HARDEN-01 | variants, loading, disabled, submit and 44px |
| `card.tsx` | `Card` | STATES-12; HARDEN-10 | heading, semantic article, footer action |
| `confirm-action-dialog.tsx` | `ConfirmActionDialog` | STATES-04; HARDEN-16 | pending disables action; consequences and cancel |
| `confirm-dialog.tsx` | `ConfirmDialog` | STATES-04; HARDEN-16 | pending/disabled destructive action, no dismiss |
| `data-table.tsx` | `DataTable, isSafeDataTableHref` | HARDEN-17; HARDEN-27; HARDEN-30 | empty, formatted cell once, mobile, unsafe row links |
| `dialog.tsx` | `Dialog` | STATES-05; HARDEN-16 | nondismissible title, safe viewport, scroll |
| `disabled-reason.tsx` | `DisabledReason` | HARDEN-07 | reason associated with disabled control |
| `disclosure.tsx` | `Disclosure` | STATES-12; HARDEN-12 | semantic details/summary and defaultOpen |
| `drawer.tsx` | `Drawer` | STATES-05; HARDEN-16 | nondismissible title, route history, scroll |
| `empty-state.tsx` | `EmptyState` | STATES-08; HARDEN-06 | empty is not alert; optional recovery |
| `error-state.tsx` | `ErrorState` | STATES-08; HARDEN-06 | alert is not success, explicit recovery |
| `file-upload.tsx` | `FileUpload, fileSizeIsValid, fileMatchesAccept, mustClearFileSelection` | STATES-13; HARDEN-05; HARDEN-28 | disabled/unavailable fallback, type/size, cleared stale selection |
| `filter-bar.tsx` | `FilterBar` | STATES-11; HARDEN-19 | search visible, sanitize activeCount, overlay keyboard contract |
| `form-field.tsx` | `FormField` | STATES-03; HARDEN-03 | id association, helper/error, invalid merge |
| `graceful-page-loading.tsx` | `GracefulPageLoading` | STATES-07; HARDEN-13 | directory/card, readable loading, timeout source |
| `inline-notice.tsx` | `InlineNotice` | STATES-08; HARDEN-07 | alert/status semantics and dismiss action |
| `input.tsx` | `Input` | STATES-02; HARDEN-02 | required, disabled, invalid |
| `loading-state.tsx` | `LoadingState` | STATES-07; HARDEN-13 | skeleton and accessible label |
| `long-text.tsx` | `LongText` | STATES-09; HARDEN-11 | untrusted string escaping and wrapping |
| `page-header.tsx` | `PageHeader` | STATES-12; HARDEN-10 | single h1, action area |
| `page-loading.tsx` | `PageLoading` | STATES-07; HARDEN-13 | skeleton count, slow loading recovery source |
| `pagination.tsx` | `Pagination, paginationWindow, normalizedPageCount` | HARDEN-08; HARDEN-31 | clamp nonfinite, 10k pages, labels/disabled |
| `permission-action.tsx` | `PermissionAction` | HARDEN-20; HARDEN-23; HARDEN-24; HARDEN-25 | own/foreign scope, scoped SA, disabled/ended actor, hidden child |
| `scroll-cue.tsx` | `ScrollCue` | STATES-15; HARDEN-21 | SSR truthful overflow semantics, resize/measurement source |
| `select.tsx` | `Select` | STATES-02; HARDEN-02 | disabled, invalid |
| `selection-controls.tsx` | `Checkbox, Radio, Switch` | STATES-06; HARDEN-04 | native semantics, disabled/checked, switch |
| `skeleton.tsx` | `Skeleton` | STATES-07; HARDEN-13 | zero/NaN/high count bounded, reduced-motion |
| `stat-tile.tsx` | `StatTile` | STATES-12; HARDEN-11 | finite number, invalid fallback, link |
| `status-badge.tsx` | `StatusBadge` | STATES-08; HARDEN-10 | five tones/readable labels |
| `tabs.tsx` | `Tabs, tabNextEnabled` | STATES-10; HARDEN-18 | zero/all disabled, skip disabled and selected panel |
| `textarea.tsx` | `Textarea` | STATES-02; HARDEN-02 | disabled, invalid |
| `third-party-link.tsx` | `ThirdPartyLink` | STATES-14; HARDEN-14 | reject HTTP/js/credentials; same-tab/copy fallback |
| `toast.tsx` | `enqueueToast, clearEvictedToastTimers, ToastStack, ToastProvider, useToast` | HARDEN-15; HARDEN-29 | persistent errors, bounded info, timer cleanup, viewport |
| `tooltip.tsx` | `InfoPopover, Tooltip` | STATES-12; HARDEN-12 | summary keyboard and info content |
| `use-confirm-flow.tsx` | `useConfirmFlow` | HARDEN-20 | cancel/unmount resolver source contracts |
| `use-overlay-webview.ts` | `ownsOverlayHistoryEntry, useOverlayWebview` | HARDEN-26 | marker identity, back stack, resize listener cleanup source |

## Shared visual and accessibility invariants

**Motion:** `scroll-cue`, `skeleton`, `disclosure`, overlays and `globals.css` use reduced-motion paths. Source/SSR tests check the branches and classes; use real browser reduced-motion snapshots before release.

**No unsafe navigation:** `ThirdPartyLink` denies non-HTTPS and URLs with credentials; `DataTable.isSafeDataTableHref` rejects protocol-relative, backslash and encoded/obfuscated slash row links. Neither accepts a string ID as authorization. Verify actual redirect chains independently.

**Failure truthfulness:** `InlineNotice` and `ErrorState` assert live-region semantics; `ToastStack` preserves persistent errors and caps only transient notices. Loading surfaces do not assert an action succeeded merely because a spinner disappears.

**Interaction gates not yet certified:** browser-level focus trap, Escape/back-button sequencing for nested Dialog/Drawer/BottomSheet, actual resize-triggered scroll fade, screen-reader announcement order, upload selection/reselection via real `FileList`, touch keyboard occlusion, reduced-motion timelines, and click/double-submit concurrency. SSR/source tests are necessary but insufficient; do not mark all account journeys unbreakable on this ledger alone.

**CI commands:** `npm run test:ux:kit:hardening` and `npm run typecheck`. Re-run with source `main` rebased into `chatgpt/chat-17-b` and update this ledger based on cloud results.
