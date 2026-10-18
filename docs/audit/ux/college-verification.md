# UX /college/verification

- **Review / changes:** Replaced bare failure paragraphs with shared PageHeader + ErrorState for no-college, invalid-filter and queue-unavailable states, preserving original text and retry behavior.
- **States:** Legacy copy, role scope and recovery choices preserved. Device/screen-reader/browser evidence pending.
- **Tests authored:** UX-college-verification-01, UX-college-verification-02, UX-college-verification-03. Tests not run in this connector.

## Loading and failure states

- Replaced manual placeholder layout with shared `Skeleton` shapes, including screen-reader loading announcements and reduced-motion support.
- Error fallback now uses `ErrorState` and shared secondary `Button` with a minimum 44px retry target, preserving the existing error copy.
- Added four source-level assertions in `tests/unit/UX-college-verification-states-01.test.ts`; execution pending CI.
