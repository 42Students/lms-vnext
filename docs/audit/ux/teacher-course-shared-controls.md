# Shared Faculty Course Directory controls — UX refinement

`FacultyCourseList` is the actual list component for `/teacher/courses` and `/teach/courses`. The query form now uses the signed-off `Input`, `Select`, and `Button` primitives rather than raw native controls, retaining each exact legacy label/value and GET URL. Inputs have 16px phone text and a visible deep-teal keyboard focus outline. Expanded the authorized teaching-delivery shortcut to a 44px target. Existing scoped empty copy, role filters, card statuses and Next/Previous pagination remain unchanged.

Tests: `UX-teacher-courses-shared-03`, `UX-teach-courses-shared-03` in `tests/unit/UX-teacher-courses-shared-controls.test.ts`. Device/browser and CI execution still pending.
