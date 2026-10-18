# Scroll and motion — faculty/teacher and teach

Global CSS hides all scrollbar tracks. This pass uses the existing shared reactive `ScrollCue`: edge fades appear only where there is actual overflow; the scroll region is focusable, keyboard and touch scroll work, and overscroll is contained.

| Surface | Change | Preservation |
|---|---|---|
| Faculty Course List assignments and Sections disclosures | 2 labelled vertical ScrollCue containers, bounded max-h-48 | Existing legacy counts, links and detail expansion |
| Faculty monthly attendance matrix | 1 labelled horizontal ScrollCue | Sticky learner column, 48rem table and month status legend |
| Faculty roster desktop | 1 labelled horizontal ScrollCue | Existing phone cards at md:hidden and data links |
| Course list arrow affordance | Motion-safe fast token, reduced-motion disabled transform | Hover arrow meaning unchanged |

Shared Dialog, Drawer and DataTable already use ScrollCue. No width/height/top/left animation. Tests: `UX-teacher-scroll-motion-01..03` in `tests/unit/UX-teacher-scroll-motion-pass.test.ts`. Runtime / 320/360/390 / screen-reader evidence pending.

## Discussion thread scroll follow-up

`src/components/courses/learner-course-discussion.tsx`: own scroll-ref/onScroll chat chronology remains; added conditional top/bottom gradient edge fades using measured actual overflow and ResizeObserver, labelled keyboard-focusable message region and a reduced-motion fallback for imperative scrollIntoView. Skeleton shimmer is now motion-safe. Test `UX-teacher-scroll-motion-04` at `tests/unit/UX-teacher-chat-scroll-motion.test.ts`.
