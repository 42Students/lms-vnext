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

## Surface 9 — `src/app/(authenticated)/admin/projects/page.tsx`
- Original evidence: `docs/audit/ux/polish-lane-7.md`, Surface 9. Inspected route/loading/error, `ProjectAdminWorkspaceList`, `CreateProjectControl`, `Dropdown`, query/service model, statuses, shared table, filter and tabs, and parent layouts. Existing creation flow, view switch, permissions, query params, modal/pagination actions retained.
- Regression fixed (1): route omitted `riskReasons` and the assigned `templateTitle` on the compact list mapping, so status and template rows lost persisted context despite prior polish. Pass typed `riskReasons` and resolve the matching assigned template title from the already-loaded choices, without adding reads.
- Extra clutter/alignment fixes: 0; compact single-canvas row layout remains opted-in only here. Page copy/labels, legacy tokens, IDs and aria preserved.
- Files changed: `src/app/(authenticated)/admin/projects/page.tsx`, proof and queue.

## Surface 10 — `src/app/(authenticated)/admin/projects/readiness/page.tsx`
- Original evidence: `docs/audit/ux/polish-lane-7.md`, Surface 10. Inspected route/loading/error, `ProjectAdminReadinessPage` and picker/table/disclosure/filter/overrides and corresponding service model, page/nav/scoped layouts. Retained statuses, filtering, exports, no-match and error controls, keyboard disclosures.
- Regression fixed (1): the Select workspace disclosure was collapsed by default when nothing had been selected, hiding the task's primary starting control. It now starts open, while remaining collapsible and preserving selected workspace releases/Manage override.
- Extra alignment fix (1): moved original Project workspaces back link above single PageHeader instead of retaining it in its action slot, as required by prior polish; no text or destination changed.
- Files changed: `src/components/projects/project-admin-readiness-page.tsx`, proof and queue.

## Surface 11 — `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx`
- Original evidence: `docs/audit/ux/polish-lane-7.md`, Surface 11. Inspected route/loading/error, `ProjectAdminReassignMentorPage`, complete `ProjectMentorReassignment`, independent GET filter controls, mentor workload, statuses, confirmations, per-workspace failed retries, parent layouts.
- Regressions found/fixed: 0. Source has no stray FilterBar import; reviewed TSX tags, component prop contracts, buttons, form names, role and dialog labels and result state. No behavior change.
- Extra alignment fix (1): moved original Back to workspaces destination outside heading actions and above the PageHeader as requested by polish proof.
- Files changed: `src/components/projects/project-admin-reassign-mentor-page.tsx`, proof and queue. UI/TypeScript reviewed only, not executed.

## Surface 12 — `src/app/(authenticated)/admin/projects/submissions/page.tsx`
- Original evidence: `docs/audit/ux/polish-lane-7.md`, Surface 12. Inspected route/loading/error, `ProjectAdminSubmissionsPage`, two GET filter modes, export, status chips, row/review modal and pagination, read services and shared components.
- Regression fixed (1): Open · Review submission used `reason=pending-review` or status strings not recognized by shared project route guard (only `STALLED|BLOCKER|REVIEW`). Preserve existing destination and `from=submissions` and supply valid `REVIEW` only for submitted deliveries; other statuses omit unsupported reason.
- Extra alignment fix (1): moved unchanged Project workspaces back link above the single PageHeader; review chips remain in PageHeader. All labels, permissions, accessible targets and legacy tokens preserved.
- Files changed: `src/components/projects/project-admin-submissions-page.tsx`, proof and queue. No CI or runtime.

## Surface 13 — `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx`
- Original polish: `docs/audit/ux/polish-lane-7.md`, Surface 13. Reviewed entire page, loading and error routes, SuperAdminTemplateCollegeBulk (selection, checkbox permissions, confirm, retry, partial failures), tabs, DataTable/FilterBar, ID and search schema, authorized service, pagination and parent layouts.
- Regressions found/fixed: 0. Native disclosure renders only when requested, action/dialog/button props and query keys agree with model, college assignment scope and disabled states remain intact. No duplicate attributes, missing imports, dropped IDs/aria, or invalid TSX found in inspected files.
- Extra clutter/alignment fixes: 0. Single canvas, page title, clear-filter recovery, mobile selections, existing bulk disclosure and directory loading retained. Files changed: queue and this proof; source inspection only, not executed.

## Surface 14 — `src/app/(authenticated)/admin/projects/templates/[templateId]/overview/page.tsx`
- Original polish: `docs/audit/ux/polish-lane-7.md`, Surface 14. Redirect-only Overview alias read with loading/error boundaries, permission helper, template UUID schema and canonical subview resolver. Inspected absence of any independent rendered page controls.
- Regressions found/fixed: 0. Authorizes before validation and canonical redirect, invalid UUID notFound; template-specific directory loader with unchanged error retry. No content/layout invented.
- Extra clutter/alignment fixes: 0. Files changed: queue and this proof; source-only, no CI.

## Surface 15 — `src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx`
- Prior evidence: `docs/audit/ux/polish-lane-7.md`, Surface 15. Reviewed route/loading/error and complete `ProjectTemplateView`, `TemplateMetadataEditControl`, `ProjectTemplateActions`, version/history labels, draft/published lifecycle, dialog submit/cancel and buttons, parent admin layout.
- Regressions found/fixed: 0. No broken tags/imports, missing labels, dropped ID/aria, unauthorized interactive controls or mismatched props observed on source inspection; existing back destination precedes header, actions adapt in flex at phone widths and long version notes wrap.
- Extra clutter/alignment fixes: 0. No files changed for this route; queue and proof only. No execution/CI.

## Surface 16 — `src/app/(authenticated)/admin/projects/templates/[templateId]/resources/page.tsx`
- Prior evidence: `docs/audit/ux/polish-lane-7.md`, Surface 16. Reviewed route/loading/error, shared `SuperAdminTemplateSubviewPage`, `SuperAdminTemplateResourceEditor`, permission checks, version schema, all editor fields/buttons and layout wrappers.
- Regression fixed (1): while resource mutation was pending, edited row controls and Close editor remained interactive. Lock editable fieldsets and editor toggle for the pending interval, preserving version confirmation, Save/Add disabled and errors.
- Extra clutter/alignment fix (1): resource titles wrap and keys break safely in 375px rows, with shared 16px hairline rhythm, matching other template sections; affects only resources branch of shared subview.
- Files changed: `src/components/projects/super-admin-template-resource-editor.tsx`, `src/components/projects/super-admin-template-subview-page.tsx`, queue and proof. Legacy wording, tokens, routes and aria unchanged; no runtime test.

## Surface 17 — `src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/page.tsx`
- Prior proof: `docs/audit/ux/polish-lane-7.md`, Surface 17. Read route/loading/error, shared `SuperAdminTemplateSubviewPage` and `SuperAdminTemplatePlanEditor`, sprint/release validators, save/confirm, reorder, missing version/empty, archived read-only, permissions and responsive list/controls.
- Regressions found/fixed: 0. Expanded editor trigger and all row/add/reset/save controls guard pending; shared labels and subtabs match typed routes. No broken JSX, duplicate props, dropped ids/aria or changed wording.
- Extra clutter/alignment fixes: 0. Existing 16px hairline section and mobile full-width controls retained. Files changed: proof/queue only; source inspection, no CI.

## Surface 18 — `src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/page.tsx`
- Prior proof: `docs/audit/ux/polish-lane-7.md`, Surface 18. Read route/loading/error, shared subview and full `SuperAdminTemplatePlanEditor` task path, sprint prereq/link, validation, movement/removal, statuses, wide/phone layouts and error recovery.
- Regressions found/fixed: 0. Required task fields, status badges, accessibility and routes still match their models. Focusable 44px phone buttons and wrapped texts are preserved.
- Extra clutter/alignment fixes: 0. No task-specific edits; proof/queue only, no runtime tests.

## Surface 19 — `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx`
- Original evidence: `docs/audit/ux/polish-lane-7.md`, Surface 19. Inspected complete comparison route, loading/error, rollback client control, two-column/current-selected diff, ProjectTemplateView, parameter validation, access/not-found, version comparison result and its href.
- Regressions found/fixed: 0. Prior title/back-link separation and 1024px comparison grid remain, preformatted version content is wrapped, scrollable and keyboard-focusable with region aria; rollback is scoped, disabled for archived/current and has 44px mobile target.
- Extra clutter/alignment fixes: 0. No additional code edits. Files changed: queue and this proof; no runtime/CI.

## Surface 20 — `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx`
- Original evidence: `docs/audit/ux/polish-lane-7.md`, Surface 20. Inspected route and typed historyQuery, parent template subview rendering, separate loading/error, version pagination schema/service, comparison link model, statuses and 25-per-page hint.
- Regressions found/fixed: 0. Invalid/multi-value page is rejected by strict schema, history page and compare links retain their destinations; mobile count and paging wrap, titles and notes break safely and template version labels remain unchanged.
- Extra clutter/alignment fixes: 0. Files changed: queue and proof. No browser/CI.

## Surface 21 — `src/app/(authenticated)/admin/projects/templates/new/page.tsx`
- Original polish: `docs/audit/ux/polish-lane-7.md`, Surface 21. Inspected route/loading/error, complete `SuperAdminTemplateCreateForm` with baseline and all three native optional disclosures, inputs, validation, typed payload builder, pending/error, keyboard/phone/desktop controls, and parent layout.
- Regressions found/fixed: 0. Required baseline and optional state values remain independently bound, disclosures keep fields mounted and editable, route permission check precedes global action and confirmation/responses retain their targets. No broken JSX, duplicate attrs or missing labels found.
- Extra clutter/alignment fixes: 0; back link remains before heading, mobile action width and directory loader aligned. Files changed: queue and proof. No CI/runtime.

## Surface 22 — `src/app/(authenticated)/admin/projects/templates/page.tsx`
- Original polish: `docs/audit/ux/polish-lane-7.md`, Surface 22. Inspected route/loading/error, template directory query/filter model, `SuperAdminTemplateArchiveControl`, `SuperAdminTemplatePageExport`, table columns/statuses/version counts, CSV, pagination, permissions and parent shell.
- Regressions found/fixed: 0. Filter and New template actions maintain 44px mobile width, ListToolbar is sole results-count source, row actions wrap and no-result recovers with Clear filters. CSV uses existing page-only rows.
- Extra clutter/alignment fixes: 0; no source change needed. Files changed: queue and proof. Source-only verification.
