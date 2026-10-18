# UX /college/videos

- **Review / changes:** Kept Video wording and authoring/aggregate workspace; improved export focus and invalid-filter recovery.
- **States:** Legacy copy, role scope and recovery choices preserved. Device/screen-reader/browser evidence pending.
- **Tests authored:** UX-college-videos-01, UX-college-videos-02. Tests not run in this connector.

## Loading and error UX

- Shared Skeleton reserves header, filter/form and three record rows without reporting missing data during loading.
- Shared ErrorState and Button preserve the exact previous unavailable/retry messages; Retry is 44px with visible focus.
- Test assertions: UX-college-videos-loading-01/02, UX-college-videos-error-01/02. Authored, pending execution.

### Bounded-loading refinement

- Delegates to shared `GracefulPageLoading shape="directory"` so route loading retains the original label, matched form/row placeholders, and the shared 12-second recovery action.
- Updated UX-college-videos-loading-01/02 to assert the bounded shared loader rather than raw manual skeleton blocks. Authored, pending CI.
