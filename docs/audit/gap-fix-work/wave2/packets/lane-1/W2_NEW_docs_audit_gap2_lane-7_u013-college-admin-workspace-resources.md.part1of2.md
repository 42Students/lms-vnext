# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u013-college-admin-workspace-resources.md (part 1 of 2)

40 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u013-college-admin-workspace-resources.md

## G2-7-013-001  [P2] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:21-25,101-110: College Admin /college-admin/projects/workspaces/:slug/resources, active projects menu
- vNext now: V/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx:1-16: redirect to /college/projects/:id/resources
- Fix: Preserve route alias/query context and selected tab

## G2-7-013-002  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:104-110: normalized workspace title and subtitle `Curate the references, files and access guidance this workspace team needs.`
- vNext now: V/components/projects/project-workspace.tsx:178-193,1432-1444: generic project title/summary and Resources subhead
- Fix: Restore section-specific subtitle and title normalization

## G2-7-013-003  [P2] GAP  facet F01  effort M
- Legacy: LFE/components/admin/AdminWorkspaceShell.jsx:10-26: contextual Back, workspace breadcrumbs and module-guarded tabs
- vNext now: V/components/projects/project-workspace.tsx:320-335: workspace breadcrumbs omitted when sectionBaseHref passed
- Fix: Include breadcrumb and Back context in canonical Resources route

## G2-7-013-005  [P2] GAP  facet F02  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:33-40: four metrics BEFORE form
- vNext now: V/components/projects/project-resource-list.tsx:85-106: eight statistics INSIDE directory before filters
- Fix: Show legacy four metrics in same placement and order

## G2-7-013-007  [P2] MISSING  facet F02  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:55-60: footer note `Resources are shared with the workspace team.`
- vNext now: V/components/projects/project-resource-list.tsx:85-179: no legacy footer help
- Fix: Restore note below save

## G2-7-013-008  [P2] MISSING  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:24-30: Project references eyebrow/headline, instruction for college account access
- vNext now: V/components/projects/project-workspace.tsx:1432-1444: generic Resources header and no introduction
- Fix: Copy eyebrow, headline and exact instruction

## G2-7-013-009  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:13-18: Resources/Links/Files & media/With access notes metric labels
- vNext now: V/components/projects/project-resource-list.tsx:85-98: Total/Showing/Links/Files/Other/Drafts/Archived/Pinned
- Fix: Restore exact labels including access-notes count

## G2-7-013-011  [P2] GAP  facet F03  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:121-138: Move up/down icon buttons and Remove row icon
- vNext now: V/components/projects/project-resource-list.tsx:165-211: row Move up/down when unfiltered and Edit/Archive actions
- Fix: Expose full keyboard edit/add/remove/reorder with undo during unsaved batch

## G2-7-013-012  [P2] GAP  facet F04  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:7-18: links = type uppercase LINK; files/media = total-links, even unknown type
- vNext now: V/components/projects/project-resource-list.tsx:78-89: link by resourceType or HTTP link; file by FILE only, other separate
- Fix: Use legacy categorization for comparison or document intentional corrected classes

## G2-7-013-013  [P2] MISSING  facet F04  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:11-18: With access notes counts nonempty trim()
- vNext now: V/components/projects/project-resource-list.tsx:85-98: no access-notes counter
- Fix: Add metric for trimmed access notes

## G2-7-013-017  [P2] GAP  facet F04  effort S
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:161-164: URL, access notes and description exact placeholders
- vNext now: V/components/projects/project-resource-controls.tsx:83-108,150-154: https://… and Description fallback prompt; access notes no placeholder
- Fix: Restore `https://...`, `What this resource is for`, college-email example

## G2-7-013-018  [P2] GAP  facet F05  effort S
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:40-51,96-113: no search until >12 rows; beyond 12 search title/JSON
- vNext now: V/components/projects/project-resource-list.tsx:25-78,99-125: search always visible, title+description only
- Fix: Match threshold and search fields or explicitly authorize directory change

## G2-7-013-020  [P2] GAP  facet F05  effort S
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:98-103: `Showing X of N items...` only when >12
- vNext now: V/components/projects/project-resource-list.tsx:85-98: always shows count tile, no conditional text
- Fix: Use legacy conditional `Showing` explanation

## G2-7-013-021  [P2] GAP  facet F05  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:115-118: <=12 rows all expanded; >12 collapsible
- vNext now: V/components/projects/project-resource-list.tsx:164-211: article rows always visible, edit via modal
- Fix: Allow inline edit with collapse threshold and preservation on navigation

## G2-7-013-022  [P2] GAP  facet F05  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:87-94: move row swaps neighbor even in unsaved form
- vNext now: V/components/projects/project-resource-list.tsx:37-73: reorder only if no filters and <=250; POST immediate
- Fix: Preserve reorder affordance and safe partial-list restriction details

## G2-7-013-024  [P2] GAP  facet F06  effort S
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:147-159: type select defaults blank for new row
- vNext now: V/components/projects/project-resource-controls.tsx:25-28: LINK default; status ACTIVE, visibility TEAM
- Fix: Align new row defaults and option casing

## G2-7-013-025  [P2] GAP  facet F06  effort S
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:62-68: checkbox defaults false, all other fields empty string
- vNext now: V/components/projects/project-resource-controls.tsx:25-28,187-199: defaults type LINK, visibility TEAM, empty content, false required/pinned
- Fix: Preserve original default type or show explicit source mapping

## G2-7-013-026  [P2] GAP  facet F06  effort S
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:163-166: accessNotes single line Input, Description textarea 2 rows
- vNext now: V/components/projects/project-resource-controls.tsx:99-107,150-154: both Textarea, description maxLength 4000
- Fix: Match field type, height and helper copy

## G2-7-013-027  [P2] GAP  facet F06  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:157-169: half-width cols md=12 for key/type,url/notes,pinned/required
- vNext now: V/components/projects/project-resource-controls.tsx:67-174: single-column Dialog field stack
- Fix: Restore 2-column desktop form layout and responsive stacking

## G2-7-013-028  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:43-49: untouched save yields `No changes to save`
- vNext now: V/components/projects/project-resource-controls.tsx:213-257: create always submits, edit modal lacks untouched guard
- Fix: Add no-op feedback without API call

## G2-7-013-036  [P2] GAP  facet F09  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:42-61: always inline form, no create/edit dialogs
- vNext now: V/components/projects/project-resource-controls.tsx:271-314,456-578: Add/Edit Dialog and Archive confirmation
- Fix: Match inline editing entry point or record modal-first workflow decision

## G2-7-013-038  [P2] GAP  facet F09  effort M
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:31-61: native unload + route confirm exact `You have unsaved changes. Leave without saving them?`
- vNext now: V/components/projects/project-resource-controls.tsx:200-212,302-314: beforeunload + own ConfirmDialog `Discard this resource?`
- Fix: Use consistent dirty-navigation copy across all exits

## G2-7-013-041  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:50-57: fetch latest siblings + stable key materialization before sending
- vNext now: V/modules/projects/resource-service.ts:116-193: inserts normalized rows; DB FK protects sprint/task relations
- Fix: Map key references safely; avoid dropping sibling links on refresh

## G2-7-013-043  [P2] GAP  facet F10  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:59-61: one success toast then reload/reseed form
- vNext now: V/components/projects/project-resource-controls.tsx:245-251: dismiss modal router.refresh
- Fix: Ensure edited data visible and form state rehydrated after refresh

## G2-7-013-046  [P2] GAP  facet F11  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:69-81: missing college recoverable warning in shell
- vNext now: V/components/projects/admin-project-section-page.tsx:38-42: throws before shell
- Fix: Restore recoverable warning without tenant leak

## G2-7-013-049  [P2] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:250-276: up to 500 rows in bulk section
- vNext now: V/modules/projects/resource-service.ts:435-460: reorder limited 250 and full active IDs required
- Fix: Document divergence for >250 resource workspaces and allow consistent editing

## G2-7-013-050  [P2] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:41-60: no change detection avoids accidental stale write, CAS resourcesToken
- vNext now: V/modules/projects/resource-service.ts:253-258,435-463: per-row optimistic CAS and array-exact reorder
- Fix: Show 409 state and reload latest before retry

## G2-7-013-051  [P2] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:91-120: Skeleton six rows, error retry and not found alert
- vNext now: V/app/(authenticated)/college/projects/[projectId]/[section]/loading.tsx:1-10: generic directory loader
- Fix: Restore resource-specific skeleton and Retry

## G2-7-013-052  [P2] GAP  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:52: empty `No resources yet. Add only the references the team will actually use.`
- vNext now: V/components/projects/project-resource-list.tsx:164-171: `No resources yet`, generic team description
- Fix: Use exact legacy empty copy with Add action

## G2-7-013-054  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:69-82: no-college warning
- vNext now: V/components/projects/admin-project-section-page.tsx:38-42: error route outside shell
- Fix: Render missing-college state

## G2-7-013-060  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:157-169: xs24 md12 for half-width controls
- vNext now: V/components/projects/project-resource-controls.tsx:67-174: stacked dialog single column
- Fix: Use same desktop 2-column/mobile 1-column layout

## G2-7-013-061  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:33-40: metric row responsive CSS grid
- vNext now: V/components/projects/project-resource-list.tsx:89-98: grid 2 cols on mobile, 4 cols sm
- Fix: Review breakpoint/spacing using legacy SCSS not assumptions

## G2-7-013-062  [P2] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:115-139: aria-expanded, labelled Move up/down/remove buttons
- vNext now: V/components/projects/project-resource-list.tsx:178-211: drag/drop and text Move up/down, Edit buttons
- Fix: Retain keyboard reordering and accessible row action labels

## G2-7-013-063  [P2] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:229-236, 250-276: inline required validation and named row index
- vNext now: V/components/projects/project-resource-controls.tsx:74-82,296-303: native required and global error
- Fix: Expose per-field error focus and screen reader association

## G2-7-013-065  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:107: subtitle `Curate the references, files and access guidance this workspace team needs.`
- vNext now: V/components/projects/project-workspace.tsx:178-193: summary subtitle
- Fix: Restore exact subtitle

## G2-7-013-066  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:21-30: `Resource library`, `Project references`, exact help paragraph
- vNext now: V/components/projects/project-workspace.tsx:1432-1444: `Resources` only
- Fix: Restore exact heading and help copy

## G2-7-013-068  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:43-65: `No changes to save`, `Resources updated`, `Failed to update resources`
- vNext now: V/components/projects/project-resource-controls.tsx:247-260, 397-408: `Resource added.` / `Project resource updated` / `Could not add the resource.`
- Fix: Map to same feedback where operation equivalent

## G2-7-013-069  [P2] GAP  facet F19  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:98-103: search activates only for >12 rows; no server pagination
- vNext now: V/components/projects/project-resource-list.tsx:64-87: client filter whole returned resource array; no paging
- Fix: Document large-list load and provide UI search threshold parity

## G2-7-013-071  [P2] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:52-60: refresh sibling data before materialize, protect legacy key mapping
- vNext now: V/modules/projects/resource-service.ts:235-257: row lock + expectedUpdatedAt CAS
- Fix: Test competing edit/reorder/archival, surface stale-version feedback

## G2-7-013-073  [P2] GAP  facet F20  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:280-379: duplicate keys get deterministic suffix, explicit keys seeded first
- vNext now: V/db/schema/projects.ts:603-635: unique (projectId,templateKey) SQL constraint; client has no preview
- Fix: Preserve suffix uniqueness and give human-friendly collision resolution
