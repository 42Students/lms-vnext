# UX /college/semester-courses

- **Review / changes:** Kept mapping manager and Course offerings entry point; moved into responsive main landmark and upgraded 44px focus-visible link.
- **States:** Legacy copy, role scope and recovery choices preserved. Device/screen-reader/browser evidence pending.
- **Tests authored:** UX-college-semester-courses-01, UX-college-semester-courses-02. Tests not run in this connector.

## Loading and error UX

- Shared Skeleton reserves header, filter/form and three record rows without reporting missing data during loading.
- Shared ErrorState and Button preserve the exact previous unavailable/retry messages; Retry is 44px with visible focus.
- Test assertions: UX-college-semester-courses-loading-01/02, UX-college-semester-courses-error-01/02. Authored, pending execution.

### Bounded-loading refinement

- Delegates to shared `GracefulPageLoading shape="directory"` so route loading retains the original label, matched form/row placeholders, and the shared 12-second recovery action.
- Updated UX-college-semester-courses-loading-01/02 to assert the bounded shared loader rather than raw manual skeleton blocks. Authored, pending CI.
