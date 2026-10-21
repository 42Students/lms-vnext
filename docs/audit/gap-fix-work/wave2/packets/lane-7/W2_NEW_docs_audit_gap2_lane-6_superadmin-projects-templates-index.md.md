# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/superadmin-projects-templates-index.md

28 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-projects-templates-index.md

## G2-6-029-001  [P2] GAP  facet F01  effort S
- Legacy: Global Super Admin /superadmin/projects/templates under SuperAdminGroupShell projects; Create template to /superadmin/projects/templates/new (templates/index.js:227-240,333).
- vNext now: /admin/projects/templates uses ProjectAdminNav active templates and New template → to /admin/projects/templates/new (admin/projects/templates/page.tsx:57-61).
- Fix: Map legacy routes and exact Create template CTA; preserve tab and link path.

## G2-6-029-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy Open action goes to /superadmin/projects/templates/{id}/overview (templates/index.js:192-200).
- vNext now: vNext links to /admin/projects/templates/{id}, Inspect template → (admin/projects/templates/page.tsx:82-85,101-105).
- Fix: Restore direct Overview section destination and Open action wording.

## G2-6-029-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy page header Project templates, subtitle, primary Create template; one Card title Templates with extra search,status,export then table (templates/index.js:227-326).
- vNext now: vNext PageHeader Templates, ProjectAdminNav, separate filter form, ListToolbar, page count line, DataTable, Pagination (admin/projects/templates/page.tsx:57-113).
- Fix: Clone heading, card header/filter arrangement, section spacing, one white canvas.

## G2-6-029-008  [P2] GAP  facet F03  effort S
- Legacy: Legacy title Project templates and CTA Create template (templates/index.js:230-239).
- vNext now: vNext title Templates and CTA New template → (admin/projects/templates/page.tsx:58-60).
- Fix: Match exact title/CTA capitalization and arrow absence.

## G2-6-029-009  [P2] GAP  facet F03  effort S
- Legacy: Legacy search placeholder Search title or slug, clear icon, width240; Status placeholder Lifecycle status (templates/index.js:249-268).
- vNext now: vNext labelled fields Template title or slug and Status with no placeholder and GET Filter button (admin/projects/templates/page.tsx:62-73).
- Fix: Place clearable search/select with exact placeholders inline in Card title.

## G2-6-029-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy Export CSV small button with DownloadOutlined (templates/index.js:270-300).
- vNext now: vNext Export templates · CSV generic secondary button (super-admin-template-page-export.tsx:14-17).
- Fix: Use Download icon, small sizing and exact Export CSV text.

## G2-6-029-011  [P2] GAP  facet F03  effort S
- Legacy: Legacy lifecycle Tag uses statusLabel and color mapping (templates/index.js:170-176).
- vNext now: vNext raw status token in StatusBadge with tone status mapping (admin/projects/templates/page.tsx:22-25,88-89).
- Fix: Humanize Draft/Published/Archived and match tag color/shape.

## G2-6-029-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy archive button danger red with InboxOutlined; loading state and archived disabled in place (templates/index.js:201-218).
- vNext now: vNext secondary Archive or spinner Archiving…, archived item replaced with neutral Archived badge (super-admin-template-archive-control.tsx:13-29).
- Fix: Restore danger red icon/button/disabled appearance rather than replacing control on archived row.

## G2-6-029-013  [P2] GAP  facet F03  effort S
- Legacy: Legacy Sections chips Overview N, Sprints N, Tasks N, Resources N (templates/index.js:180-189).
- vNext now: vNext Overview chip omits number, other 3 show counts (admin/projects/templates/page.tsx:90-96).
- Fix: Restore exact Overview count and chip order/styling.

## G2-6-029-015  [P2] GAP  facet F04  effort S
- Legacy: Legacy separate Version column displays templateVersion or em dash (templates/index.js:165-169).
- vNext now: vNext Versions shows currentVersion and publishedVersion with Not yet placeholder (admin/projects/templates/page.tsx:97-98).
- Fix: Match Version header and singular version value; move extra published version to detail/tooltip.

## G2-6-029-019  [P2] GAP  facet F05  effort M
- Legacy: Legacy table columns Template, Version, Lifecycle, Sections, Action in that order (templates/index.js:153-223).
- vNext now: vNext Template, Status, Sections, Versions, Assignments, Action (admin/projects/templates/page.tsx:81-108).
- Fix: Restore original column order/headers and widths; place assignments optionally at end.

## G2-6-029-021  [P2] GAP  facet F05  effort M
- Legacy: Legacy filters search/status through request, 350ms debounce on search and immediate status changes (templates/index.js:119-133).
- vNext now: vNext requires explicit GET Filter submit for both fields (admin/projects/templates/page.tsx:62-73).
- Fix: Keep immediate filtering on status and debounced search input while preserving URL.

## G2-6-029-025  [P2] GAP  facet F06  effort M
- Legacy: Legacy filters are clearable AntD Input.Search and Select, controls initially blank (templates/index.js:249-269).
- vNext now: vNext native search plus Select defaults Status=ALL and search=q, explicit Filter button (admin/projects/templates/page.tsx:62-73).
- Fix: Match clear-button, placeholder, select menu and keyboard typeahead.

## G2-6-029-026  [P2] GAP  facet F06  effort M
- Legacy: Legacy archive action requires modal Popconfirm, no text inputs; button disabled if archived (templates/index.js:201-220).
- vNext now: vNext useConfirmFlow full confirm dialog; archived state uses Badge (super-admin-template-archive-control.tsx:14-29).
- Fix: Clone modal/popconfirm placement, disable rules and focus behavior.

## G2-6-029-033  [P2] GAP  facet F09  effort S
- Legacy: Legacy Popconfirm title Archive "{template}"? and description Existing workspaces stay linked and keep working, but this template will no longer be offered for new workspaces.; danger OK Archive (templates/index.js:201-219).
- vNext now: vNext confirm sentence Archive template "{title}"? Existing workspaces keep their pinned snapshot. This template will no longer be available for new assignments. (super-admin-template-archive-control.tsx:16-17).
- Fix: Use exact two-part legacy title/description and danger Archive confirm button.

## G2-6-029-035  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET /api/v1/admin/project-templates?collegeId&lifecycleStatus&search; superadmin global (AdminProjectTemplateController.java:63-92).
- vNext now: vNext server listSuperAdminTemplateDirectory receives q,status,page, DB query (super-admin-template-directory-service.ts:10-28).
- Fix: Record public API param/response crosswalk; update any integrations relying on lifecycleStatus/search.

## G2-6-029-036  [P2] GAP  facet F10  effort M
- Legacy: Legacy DELETE /api/v1/admin/project-templates/{int templateId}?collegeId archives (AdminProjectTemplateController.java:304-323).
- vNext now: vNext DELETE /api/projects/templates/{UUID templateId} via projectMutation (super-admin-template-archive-control.tsx:16-22).
- Fix: Map identifier/path/body response for clients; keep archive instead of physical delete.

## G2-6-029-043  [P2] GAP  facet F12  effort S
- Legacy: Legacy archived template cannot be archived again; button disabled (templates/index.js:201-218).
- vNext now: vNext archive control replaces with Archived badge (super-admin-template-archive-control.tsx:14-15).
- Fix: Show disabled danger Archive action for archived template to match state semantics.

## G2-6-029-046  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty state No templates match your filters, suppressed entirely on fetch error (templates/index.js:309-324).
- vNext now: vNext No matching templates + description + Clear filters even if request valid (admin/projects/templates/page.tsx:109-111).
- Fix: Restore exact empty state wording; keep clear-filters link only as secondary addition.

## G2-6-029-051  [P2] GAP  facet F16  effort M
- Legacy: Legacy AntD Card table scroll x:max-content; search fixed240px, Space wraps at narrow screens (templates/index.js:246-268,314-320).
- vNext now: vNext grid filters stack on phone, DataTable mobilePriority columns (admin/projects/templates/page.tsx:62-73,77-108).
- Fix: Compare 1280/768/375 layouts, overflow and touch targets against legacy table.

## G2-6-029-053  [P2] GAP  facet F18  effort S
- Legacy: Legacy header Project templates, card Templates, Create template, Search title or slug, Lifecycle status, Export CSV, Open (templates/index.js:230-300).
- vNext now: vNext Templates, New template →, Template title or slug, Status, Export templates · CSV, Inspect template → (admin/projects/templates/page.tsx:58-105).
- Fix: Restore literal labels and placeholders across header, toolbar and actions.

## G2-6-029-054  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact error/empty strings Templates could not be loaded, Retry, No templates match your filters (templates/index.js:242-244,309-324).
- vNext now: vNext Project templates unavailable / Retry loading templates / No matching templates (admin/projects/templates/page.tsx:49-55,109-111).
- Fix: Restore legacy copy and placement for all three states.

## G2-6-029-062  [P2] GAP  facet F22  effort M
- Legacy: Legacy ProjectTemplateDTO fields templateVersion, lifecycleStatus, summary, embedded sections (templates/index.js:155-189; AdminProjectTemplateController.java:63-85).
- vNext now: vNext DB project_templates currentVersion/publishedVersion/status and current blueprint sectionCounts (super-admin-template-directory-service.ts:22-56).
- Fix: Produce explicit DTO field map, preserve legacy version and meaningful Overview count.

## G2-6-029-007  [P3] GAP  facet F02  effort M
- Legacy: Legacy full first-load skeleton within single card then table-loading overlay on refetch (templates/index.js:304-324).
- vNext now: vNext server renders table or distinct ErrorState, no in-card skeleton path (admin/projects/templates/page.tsx:45-56,57-113).
- Fix: Provide legacy in-canvas first-load skeleton and table overlay for reload if parity desired.

## G2-6-029-014  [P3] GAP  facet F04  effort S
- Legacy: Legacy template row shows formatted title + summary (em dash when absent) (templates/index.js:155-164; adminProjectUtils.js:14-20).
- vNext now: vNext shows title, slug, summary only if truthy (admin/projects/templates/page.tsx:82-87).
- Fix: Show legacy empty summary em dash and avoid unrequested slug under name.

## G2-6-029-034  [P3] GAP  facet F09  effort M
- Legacy: Legacy overlay anchored to Archive button Popconfirm (templates/index.js:201-219).
- vNext now: vNext global askConfirm dialog from useConfirmFlow (super-admin-template-archive-control.tsx:14-28).
- Fix: Match popover position/size/transitions or shared dialog if owner approves a consistent design.

## G2-6-029-045  [P3] GAP  facet F13  effort M
- Legacy: Legacy initial Skeleton six rows; subsequent filtering leaves old table under light loading overlay (templates/index.js:304-321).
- vNext now: vNext SSR response waits and separate generic error on failed fetch (admin/projects/templates/page.tsx:45-56,57-113).
- Fix: Use section-preserving loading skeleton and transition to avoid whole-page blank.

## G2-6-029-059  [P3] GAP  facet F20  effort S
- Legacy: Legacy title-keyed local row filter removes archived row without waiting for page refresh (templates/index.js:140-146).
- vNext now: vNext uses DB status and router.refresh, async state may keep old row briefly (super-admin-template-archive-control.tsx:16-24).
- Fix: Confirm stale optimistic UI and provide pending status until refreshed.
