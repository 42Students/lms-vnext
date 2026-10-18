# Scroll and motion: shared UI kit — chat-17

Signed-off source: `docs/orchestrator/briefs/ux-scroll-motion-pass.md` and global tokens in `src/app/globals.css`.

## Changed scroll containers / overlays / animations

| Shared kit surface | Source | Owner decision enforced |
|---|---|---|
| ScrollCue | `src/components/ui/scroll-cue.tsx` | Keyboard-focusable named scroll region **only when scrollable**; actual overflow measured from scroll/client size and tracked by scroll, ResizeObserver, MutationObserver. At either hidden-scrollbar edge, inert start/end gradient fades appear; `overscroll-x-contain` and `overscroll-contain` preserve wheel/touch/key movement. |
| Dialog | `src/components/ui/dialog.tsx` | Native `showModal` remains; one bounded flex child is the scroll region, not both parent and child. Header/close/footers remain visible; visual viewport + safe area from existing webview hook. Token-driven opacity/transform entry, with bottom-sheet **inner panel** animated so desktop dialog centering is never overwritten. |
| Drawer | `src/components/ui/drawer.tsx` | One scrollable flex child with fade; native focus trap, history/back behavior and focus return preserved; drawer slides 16px from its edge with base token and reduced-motion gate. |
| BottomSheet | `src/components/ui/bottom-sheet.tsx` | One max-height bounded scrolling body with fade and overscroll containment; visible header/footer and safe area/keyboard offsets; sheet rise via motion token. |
| FilterBar | `src/components/ui/filter-bar.tsx` | Full-height mobile filter sheet locks body and traps Tab; filter content alone scrolls, with start/end fades, safe-area padding and dismissal/return. |
| Tabs | `src/components/ui/tabs.tsx` | Overflow-aware horizontal scroll cue and keyboard named region; underline, border and focus use fast/base motion tokens, reduced-motion from CSS. |
| DataTable | `src/components/ui/data-table.tsx` | Desktop wide table gets named, keyboard-reachable horizontal region + true edge fades. Mobile cards still expose all fields; extra cells use shared Disclosure. |
| Disclosure | `src/components/ui/disclosure.tsx` | Native semantic details/summary, >=44px hit target; only child opacity and chevron transform animate, never height; reduced motion stops animation. |
| ToastStack | `src/components/ui/toast.tsx` | Retains visual viewport/safe-area bounded scroll for 8+ persistent errors and keyboard dismissal; slight vertical mask indicates overflow, token-based nonblocking slide/fade on insertion. |
| Skeleton | `src/components/ui/skeleton.tsx` | Gentle linear 1.5s shimmer as the sole >300ms exception; reduced-motion global rule stops pseudo-element animation. |
| SelectionControls | `src/components/ui/selection-controls.tsx` | Switch/check transitions use `--lms-motion-fast` and `--lms-motion-ease`; no one-off 120ms. |
| Button / Input / Select / Textarea | `src/components/ui/{button,input,select,textarea}.tsx` | Removed 120ms one-off durations; all use the same fast duration/ease tokens without changing focus affordances or input 16px text. |
| Global styles | `src/app/globals.css` | Motion and hidden scrollbar baseline preserved; appended overlay/drawer/sheet/toast/shimmer keyframes and toast edge mask, all opacity/transform only. |

**Tests:** `tests/unit/UX-kit-scroll-motion-01.test.tsx` (8 tests, including direct coverage for bottom-sheet, loading-state, selection-controls and use-confirm-flow). Wired to `ux:audit:unit`; previous suites retained. No claims of running TypeScript, Vitest, ESLint, 320/360/390 screenshots or assistive technology. These are pending orchestrator execution.

**Caution:** No scrollbar chrome is deliberately visible. The ScrollCue fades appear only on actual overflow, not when everything is already visible. All backdrop, Escape and focus return behavior remains unchanged.

## 2026-10-19: additional chat-17 scroll/motion witnesses

- **ScrollCue multiple siblings:** All direct child elements are observed after each subtree child-list mutation and on mount. This prevents a secondary filter/table child resizing under a fixed-size scroll viewport from leaving stale visible fades. Source case `UX-kit-scroll-motion-09`, dev-browser `UX-kit-E2E-10` and `E2E-14` (nested vertical overlay) cover both axes; browser CI is deferred.
- **Motion:** The Switch track and `::after` thumb both opt out of transition under reduced motion, as do interactive Tabs. `UX-kit-scroll-motion-10` checks the exact shared style gates, with browser computed-style case `E2E-09` for tab duration.
- **Loading/notifications:** PageLoading/GracefulPageLoading reset slow-recovery timers on changed request identity, and InlineNotice/ToastProvider keep timed success feedback during background visibility; these are motion-adjacent interaction timing guarantees rather than animation changes.
