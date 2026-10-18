# UX /college/semesters

- **Review / changes:** Preserved semester directory and CSV truncation warning; improved invalid filter reset and export focus-visible controls.
- **States:** Legacy copy, role scope and recovery choices preserved. Device/screen-reader/browser evidence pending.
- **Tests authored:** UX-college-semesters-01, UX-college-semesters-02. Tests not run in this connector.

## Loading and failure states

- Replaced manual placeholder layout with shared `Skeleton` shapes, including screen-reader loading announcements and reduced-motion support.
- Error fallback now uses `ErrorState` and shared secondary `Button` with a minimum 44px retry target, preserving the existing error copy.
- Added four source-level assertions in `tests/unit/UX-college-semesters-states-01.test.ts`; execution pending CI.
