# UX /college/people

- **Before / action:** Audited intentional People Directory redirect to the college Contacts surface; no duplicate directory UI added. Exact canonical route remains.
- **Preserved:** Legacy route labels/identifiers, backend permission checks and error boundaries. No browser/device/AT sign-off claimed.
- **Tests authored:** UX-college-people-01, UX-college-people-02. Not executed in this connector.

## Loading and failure states

- Replaced manual placeholder layout with shared `Skeleton` shapes, including screen-reader loading announcements and reduced-motion support.
- Error fallback now uses `ErrorState` and shared secondary `Button` with a minimum 44px retry target, preserving the existing error copy.
- Clear filters now returns to `/college/people/manage` instead of the read-only Contacts redirect.
- Added four source-level assertions in `tests/unit/UX-college-people-states-01.test.ts`; execution pending CI.

### Bounded-loading refinement

- Uses the shared `GracefulPageLoading shape="directory"`, retaining the route-specific loading label and three row-shaped placeholders.
- If the route stays suspended for 12 seconds, the shared loader offers its original `Try again` action. No unbounded spinner or premature empty-result claim.
- Both loading assertions in `tests/unit/UX-college-people-states-01.test.ts` now verify this shared component contract; test execution pending.
