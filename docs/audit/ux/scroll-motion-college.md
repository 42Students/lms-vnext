# College scroll and motion pass — chat-4 (2026-10-18)

Global CSS hides the scrollbar. The shared `ScrollCue` measures overflow and displays truthful leading/trailing gradients; it provides a named focusable region when keyboard scrolling is available. Dialog bodies use its vertical variant, safe-area footer padding, modal body lock and reduced-motion global tokens; no custom transition duration is introduced here.

| Surface | Action | Affordance |
|---|---|---|
| `college-role-directory-workspace.tsx` | Wrap desktop-wide results table in shared `ScrollCue axis="x"` | Keyboard-reachable, dynamic edge fades and overscroll containment; mobile cards remain distinct |
| `college-faculty-csv-import.tsx` | Replace raw CSV table with shared `DataTable` | Responsive mobile rows and shared x-axis edge fades; page scroll remains primary |
| `college-student-csv-import.tsx` | Replace raw CSV table with shared `DataTable` | Per-row preview/failed reason still displayed, no nested phone scroller |
| `college-student-import-history.tsx` | Replace inner bounded table with `DataTable` in `Dialog` | Single modal vertical scroll, horizontal table edge fades, paging remains visible in modal |
| `college-faculty-schedule-reassign.tsx` | Remove the inner scroll on skipped schedules | Parent Dialog owns one accessible y-axis scroll and focus boundary |
| `college-person-audit-modal.tsx` | Remove inner event-list scroll | Parent Dialog owns one accessible y-axis scroll and focus boundary |
| All other `src/components/college` dialogs | Reuse shared Dialog/ConfirmDialog | Focus trap/return, backdrop/Escape dismiss, safe-area and reduced motion inherited |

Tests: `tests/unit/UX-college-scroll-motion-01.test.ts`, `tests/unit/UX-college-overlays-01.test.ts`, `tests/unit/UX-college-csv-tables-01.test.ts`.
Outstanding verification: manual 320px keyboard/touch checks and the remaining long raw tables /college area still require full Pass A acceptance.
