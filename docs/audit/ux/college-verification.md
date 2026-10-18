# UX /college/verification

- **Review / changes:** Replaced bare failure paragraphs with shared PageHeader + ErrorState for no-college, invalid-filter and queue-unavailable states, preserving original text and retry behavior.
- **States:** Legacy copy, role scope and recovery choices preserved. Device/screen-reader/browser evidence pending.
- **Tests authored:** UX-college-verification-01, UX-college-verification-02, UX-college-verification-03. Tests not run in this connector.

## Loading and failure states

- Replaced manual placeholder layout with shared `Skeleton` shapes, including screen-reader loading announcements and reduced-motion support.
- Error fallback now uses `ErrorState` and shared secondary `Button` with a minimum 44px retry target, preserving the existing error copy.
- Added four source-level assertions in `tests/unit/UX-college-verification-states-01.test.ts`; execution pending CI.

### Bounded-loading refinement

- Uses the shared `GracefulPageLoading shape="directory"`, retaining the route-specific loading label and three row-shaped placeholders.
- If the route stays suspended for 12 seconds, the shared loader offers its original `Try again` action. No unbounded spinner or premature empty-result claim.
- Both loading assertions in `tests/unit/UX-college-verification-states-01.test.ts` now verify this shared component contract; test execution pending.
