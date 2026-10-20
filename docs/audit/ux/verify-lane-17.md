# UI/UX polish verification — lane chat-17

Method: source-only review of route, loaded UI components, parent layouts and the original polish evidence; TSX not executed and no CI.

## Surface 1 — `src/app/(authenticated)/admin/placements/shortlisted/page.tsx`
- Original polish: `docs/audit/ux/polish-lane-7.md`, Surface 1.
- Regressions found and fixed (1): the compact `Rows per page` disclosure used `md:col-span-6` in a grid limited to three columns, which can create implicit tracks and blow out the 768px and desktop filter form; switched to `sm:col-span-2 lg:col-span-3`.
- Extra clutter/alignment fixes (1): removed a duplicate conditional form-class expression (identical on both branches) without changing the active layout or behavior.
- Read: `page.tsx`, `loading.tsx`, `error.tsx`, `src/components/admin/admin-scoped-read-page.tsx` and its rendered search, CSV, PageHeader, PageBackLink, StatusBadge, Select, Input, Button, EmptyState, ErrorState, Pagination; placement-shortlisted query service; nearest admin/authenticated layouts and group tabs. Confirmed imports/prop contracts and existing statuses, names, links, route states, id/aria controls and tokens. No other behavior/copy edits.
- Files changed: `src/components/admin/admin-scoped-read-page.tsx`; queue and this proof.

## Surface 2 — `src/app/(authenticated)/admin/placements/student-lookup/page.tsx`
- Original polish: `docs/audit/ux/polish-lane-7.md`, Surface 2.
- Regressions found and fixed: 0; source-only verification found no broken tags, unresolved imports, duplicate attributes, missing form fields, dropped IDs/labels or mismatched component props.
- Extra clutter/alignment fixes: 0; full-width touch controls on phone, table rows, hierarchy of Search students versus Analytics and truncation notice placement remain appropriate on inspection.
- Read: `page.tsx`, `loading.tsx`, `error.tsx`, shared `DataTable`, `PageHeader`, `PageBackLink`, `Input`, `Button`, `StatusBadge`, `EmptyState`, `ErrorState`, `GracefulPageLoading`, query model and placement lookup service, nearest admin/authenticated layouts. No source changes to this surface.
- Files changed: queue and this proof; verified, no change to route code.

## Surface 3 — `src/app/(authenticated)/admin/programs/page.tsx`
- Original polish: `docs/audit/ux/polish-lane-7.md`, Surface 3.
- Regressions fixed (1): prior polish explicitly intended the Create New Program disclosure to be open when the program list is empty, but the committed `<details>` lacked the `open` state. Restore `open={programs.length === 0}` to expose the creation form immediately for first-time setup.
- Extra clutter/alignment fixes: 0; preserved dropdown action grouping, aligned search/paging controls, department and duration fields, all copy and submit validation.
- Inspected route `page.tsx`, `loading.tsx`, `error.tsx`, the complete `AdminProgramDirectory`, `AcademicSetupSteps`, shared `DataTable`/`Disclosure`/`PageHeader`/`Input`/`Button`/`Select` and admin/authenticated layouts; contracts, available controls, page states and legacy spacing were reviewed without executing code.
- Files changed: `src/components/admin/admin-program-directory.tsx`, queue, this proof.

## Surface 4 — `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx`
- Original polish: `docs/audit/ux/polish-lane-7.md`, Surface 4.
- Regressions found/fixed: 0. Route `params` and optional query values feed a guarded `AdminProjectSectionPage`; section names are narrowed by the ten-section guard before being supplied to `ProjectWorkspace`. Scoped `polishAdminSection` has matching prop types, and the existing back-link is outside the PageHeader only for the flagged admin route.
- Extra clutter/alignment fixes: 0; same route/aria/tab destinations retained. Source review of route page/loading/error, complete `AdminProjectSectionPage`, `ProjectWorkspace` outer shell and named UI/action imports, parent admin/authenticated layouts. Large nested workspace controls were not independently exercised.
- Files changed: queue, this proof; verified, no change to route code.

## Surface 5 — `src/app/(authenticated)/admin/projects/[projectId]/page.tsx`
- Original polish: `docs/audit/ux/polish-lane-7.md`, Surface 5.
- Regressions found and fixed: 0. Page is a server-side access-checked redirect, with no rendered list or actions. Reviewed guard, ID schema, authorization check, canonical `/summary` redirect, route error boundary and loading directory skeleton; found no dropped imports, changed route parameters or brittle visual state.
- Extra clutter/alignment fixes: 0; redirect-only route leaves presentation to the canonical summary.
- Files changed: queue, this proof; verified, no change.

## Surface 6 — `src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx`
- Original polish: `docs/audit/ux/polish-lane-7.md`, Surface 6.
- Regressions found and fixed: 0. Confirmed `ProjectWorkspaceReadiness` accepts the route props, narrow-scoped project validation and permission behavior, matching ten-tab links, progress counts paired with `MetricBar`, native `Disclosure` defaultOpen for manual override, form fields/confirmation/error and 375px Apply target. The null `ProjectAdminNav` does not duplicate tabs for admin.
- Extra clutter/alignment fixes: 0; retained single readiness state summary and hairline groupings, no duplicate override heading under compactLayout.
- Read route/loading/error, complete `ProjectWorkspaceReadiness`, `ProjectReadinessOverrideForm`, `MetricBar`, `Disclosure`, `ProjectAdminNav`, and parent layouts. Source-only; no runtime tests.
- Files changed: queue, this proof; verified, no change.

## Surface 7 — `src/app/(authenticated)/admin/projects/at-risk/page.tsx`
- Prior polish evidence: `docs/audit/ux/polish-lane-7.md`, Surface 7. Reviewed route, loading/error, `ProjectAdminAtRiskPage` and its collection controls, nav, list toolbar, statuses, chips, service risk signal model, and parent layouts. Checked responsive rows, labels, form fields, destinations, permissions and state handling.
- Regressions found/fixed (2): Open and Review submission links supplied free-form/lowercase `reason` values rejected by the workspace reason parser. Kept existing destinations and `from=at-risk`, passing valid `STALLED`/`BLOCKER`/`REVIEW` tokens for contextual risk banner and review flow.
- Extra clutter/alignment fixes (1): removed second identical page-scoped CSV note after results; kept the note immediately next to Export in ListToolbar.
- Files changed: `src/components/projects/project-admin-at-risk-page.tsx`, this proof, queue.

## Surface 8 — `src/app/(authenticated)/admin/projects/audit/page.tsx`
- Prior polish evidence: `docs/audit/ux/polish-lane-7.md`, Surface 8. Reviewed route/loading/error, `ProjectAdminAuditPage`, DateInput, ActivityCenter, date/parser model, inherited layouts, refresh/export and grouped empty state.
- Regressions found/fixed (2): Refresh previously reset saved audit filters despite its label; now retains validated action, importance, subject and IST from/to filters (pagination restarts). Audit-specific empty state previously linked Reset to unrelated `/activity`; introduced optional `emptyHref` in shared ActivityCenter with unchanged default for existing consumers, supplying `/admin/projects/audit` (or college equivalent) only from this audit page.
- Extra clutter/alignment fixes: 0; existing disclosure, date fields, result actions and grouping match legacy layout; no changed labels, aria, or tokens.
- Files changed: `src/components/projects/project-admin-audit-page.tsx`, `src/components/activity/activity-center.tsx`, this proof, queue.
