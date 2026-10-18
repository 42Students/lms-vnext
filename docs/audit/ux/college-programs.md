# UX /college/programs

- **Review / changes:** Kept active/archived program directories together but added named sections and a responsive main landmark; no new copy or permission changes.
- **States:** Legacy copy, role scope and recovery choices preserved. Device/screen-reader/browser evidence pending.
- **Tests authored:** UX-college-programs-01, UX-college-programs-02. Tests not run in this connector.

## Loading and error UX

- Shared Skeleton reserves header, filter/form and three record rows without reporting missing data during loading.
- Shared ErrorState and Button preserve the exact previous unavailable/retry messages; Retry is 44px with visible focus.
- Test assertions: UX-college-programs-loading-01/02, UX-college-programs-error-01/02. Authored, pending execution.
