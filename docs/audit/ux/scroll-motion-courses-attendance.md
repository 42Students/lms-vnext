# Chat-7 scroll, motion and responsive cues

Source: `docs/orchestrator/briefs/ux-scroll-motion-pass.md`, `docs/audit/ui-surfaces/UI-SURFACES.md`. Checked with `tests/unit/UX-courses-scroll-motion-01.test.ts` and `tests/unit/UX-learn-attendance-month-01.test.ts` (source-level, not browser-executed).

| Owned surface | Container / change | Cue, motion and keyboard contract |
|---|---|---|
| `src/components/courses/college-content-preview.tsx` | Metadata modal | Replaced hand-built fixed overlay with shared Dialog: labelled native modal, Escape/backdrop, focus-return and vertical ScrollCue with truthful edge fades; fixed footer and 44px controls |
| `src/components/courses/learner-roadmap-item-dialog.tsx` | Learner content/assignment/quiz modal | Shared Dialog, focus return and body scroll cue, safe-area footer; authorized nested children still mount only while opened |
| `src/components/courses/learner-course-attendance.tsx` | Attendance History table | Replaced horizontal raw table + duplicate mobile cards with single DataTable; mobile primary/secondary fields, extra-column disclosure, named focusable horizontal ScrollCue and edge fades |
| `src/components/courses/learner-course-attendance.tsx` | Month chooser | React memo responds to updated query-provided `defaultMonth`; previous useState initializer did not update after router.replace |
| `src/components/ui/{dialog,drawer,scroll-cue,data-table}.tsx` | Referenced shared primitives (chat-15/17 ownership; not edited) | Own vertical ScrollCue, horizontal DataTable cue, Escape, backdrop and opener focus return. Shared global motion tokens in `src/app/globals.css` apply and disable under reduced-motion |

Unchanged owned scroll surfaces remain to audit. These changes avoid bespoke duration values and rely on the globally configured 150/200ms tokens and reduced-motion override.
