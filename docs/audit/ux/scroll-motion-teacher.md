# Scroll and motion — faculty/teacher and teach

Global CSS hides all scrollbar tracks. This pass uses the existing shared reactive `ScrollCue`: edge fades appear only where there is actual overflow; the scroll region is focusable, keyboard and touch scroll work, and overscroll is contained.

| Surface | Change | Preservation |
|---|---|---|
| Faculty Course List assignments and Sections disclosures | 2 labelled vertical ScrollCue containers, bounded max-h-48 | Existing legacy counts, links and detail expansion |
| Faculty monthly attendance matrix | 1 labelled horizontal ScrollCue | Sticky learner column, 48rem table and month status legend |
| Faculty roster desktop | 1 labelled horizontal ScrollCue | Existing phone cards at md:hidden and data links |
| Course list arrow affordance | Motion-safe fast token, reduced-motion disabled transform | Hover arrow meaning unchanged |

Shared Dialog, Drawer and DataTable already use ScrollCue. No width/height/top/left animation. Tests: `UX-teacher-scroll-motion-01..03` in `tests/unit/UX-teacher-scroll-motion-pass.test.ts`. Runtime / 320/360/390 / screen-reader evidence pending.

### Gradebook safe URL and empty-state follow-up

The gradebook card layout at `/teacher/courses/[deliveryId]/gradebook` is naturally wrapping on 320px screens and uses no custom scroll container. Filter-link ambiguity was corrected separately: duplicate page/search query keys now show a recovery link instead of running a report, without changing legacy wording. Direct SSR coverage: `tests/unit/UX-teacher-gradebook-strict-query-journey.test.tsx`, FAC-GRADEBOOK-UX-01. No horizontal scroll cue is applicable to this card-based surface.

### Four intentional redirect-only Faculty aliases

`/teacher/contacts`, `/teacher/courses/[deliveryId]`, `/teacher/courses/[deliveryId]/attendance-corrections` and `/teacher/courses/[deliveryId]/notices` have no UI shared components because each validates then directly redirects to an existing Faculty destination. SSR route tests `tests/unit/UX-teacher-redirect-no-shared-route-journey.test.tsx` check canonical destinations, wrong Section permission refusal and malformed link recovery; rationale and proposed four `noShared` waivers are in `docs/audit/ux/teacher-redirect-waivers-chat3.md`. No scrollable container is rendered by these aliases.

## Discussion thread scroll follow-up

`src/components/courses/learner-course-discussion.tsx`: own scroll-ref/onScroll chat chronology remains; added conditional top/bottom gradient edge fades using measured actual overflow and ResizeObserver, labelled keyboard-focusable message region and a reduced-motion fallback for imperative scrollIntoView. Skeleton shimmer is now motion-safe. Test `UX-teacher-scroll-motion-04` at `tests/unit/UX-teacher-chat-scroll-motion.test.ts`.
