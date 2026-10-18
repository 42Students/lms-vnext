# UX /college/quizzes

- **Review / changes:** Retained assessment scope/authoring; added a lawful Clear filters recovery action to invalid-query ErrorState and responsive main landmark.
- **States:** Legacy copy, role scope and recovery choices preserved. Device/screen-reader/browser evidence pending.
- **Tests authored:** UX-college-quizzes-01, UX-college-quizzes-02. Tests not run in this connector.

## Loading and failure states

- Replaced manual placeholder layout with shared `Skeleton` shapes, including screen-reader loading announcements and reduced-motion support.
- Error fallback now uses `ErrorState` and shared secondary `Button` with a minimum 44px retry target, preserving the existing error copy.
- Added four source-level assertions in `tests/unit/UX-college-quizzes-states-01.test.ts`; execution pending CI.
