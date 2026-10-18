# Scroll and motion closure — mentor projects (chat-14)

Source brief: `docs/orchestrator/briefs/ux-scroll-motion-pass.md`. Shared controls continue to inherit the global `--lms-motion-fast` and `--lms-motion-base` tokens, including `prefers-reduced-motion` handling. No custom durations were introduced.

| Surface | Existing problem | Applied scroll cue and accessible behaviour | Evidence |
|---|---|---|---|
| `mentor-task-allocation.tsx` workload | A raw six-column table with no mobile disclosure and no horizontal cue | Replaced with shared `DataTable` (its built-in `ScrollCue`) and explicit empty copy; mobile primary and secondary column priorities | `UX-mentor-scroll-motion-01` |
| `mentor-task-allocation.tsx` learner card lanes | Hidden scrollbar gave no horizontal affordance; keyboard focus could not reach region | Right edge-gradient mask, named focusable region, `overscroll-x-contain`, visible focus outline | `UX-mentor-scroll-motion-01` |
| `mentor-lane-board.tsx` status board | Horizontally offscreen columns looked absent | Right edge-gradient mask, named focusable region, `overscroll-x-contain`, visible focus outline | `UX-mentor-scroll-motion-01` |
| `mentor-board-task-detail-dialog.tsx` task detail | Long modal content relied on invisible scrollbar and actions could disappear | Explicit overflow instruction, `overscroll-contain`, sticky close/title header. Native modal keeps background inert, Escape close and focus restoration | `UX-mentor-scroll-motion-01` |

Legacy labels and task state transitions are unchanged. All new scroll regions remain operable by wheel, touch and keyboard. Source-based tests are added; repository-wide suite and browser checks remain orchestrator responsibilities.
