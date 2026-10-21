# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u011-college-admin-workspace-overview.md

32 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u011-college-admin-workspace-overview.md

## G2-7-011-002  [P2] GAP  facet F01  effort M
- Legacy: LFE/components/admin/AdminWorkspaceShell.jsx:9-28: contextual breadcrumb `Projects / Workspaces / [title] / Overview`, Back from query, nine workspace tabs and module guard.
- vNext now: V/components/projects/project-workspace.tsx:320-334: standalone PageHeader and tabs; breadcrumbs rendered only with no sectionBaseHref.
- Fix: Show workspace breadcrumb for section routes; preserve contextual Back.

## G2-7-011-003  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:124-127: title normalized college-scoped name and subtitle `Shape the project brief mentors and students use to understand the work.`
- vNext now: V/components/projects/project-workspace.tsx:178-193: title raw project.title and summary subtitle.
- Fix: Use normaliseCollegeScopedName semantics and exact Overview subtitle.

## G2-7-011-005  [P2] GAP  facet F02  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:28-48: Goal heading, helper, 4–9-row goal textarea.
- vNext now: V/components/projects/workspace-brief-editor.tsx:40-43: plain label `Project goal`, separate description field.
- Fix: Restore nested Goal section, field label/help and row sizing.

## G2-7-011-006  [P2] GAP  facet F02  effort M
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:50-93: two boxed side-by-side sections Deliverables then Definition of done.
- vNext now: V/components/projects/workspace-brief-editor.tsx:44-50: plain stacked textareas; public view puts completion conditions and personas side by side.
- Fix: Restore two boxed editor sections in legacy order and responsive grid.

## G2-7-011-007  [P2] GAP  facet F02  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:95-115: Personas & ownership section followed by Save project brief/footer.
- vNext now: V/components/projects/workspace-brief-editor.tsx:44-60: `Personas` row, save/cancel and inline error.
- Fix: Restore Personas heading, ownership helper and legacy footer hierarchy.

## G2-7-011-008  [P2] MISSING  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:19-24: exact kicker `Learner & mentor view` and prominent H4 promise line.
- vNext now: V/components/projects/workspace-brief-editor.tsx:36-39: none.
- Fix: Add kicker and h4 with exact source copy.

## G2-7-011-009  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:31-36,53-56,75-78,98-100: heading+helper pair for each subsection.
- vNext now: V/components/projects/workspace-brief-editor.tsx:40-49: only plain labels.
- Fix: Restore all four subsection helpers and headings separately.

## G2-7-011-010  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:111-117: `Save project brief` primary button and `Changes update the Overview seen by mentors and students.` note.
- vNext now: V/components/projects/workspace-brief-editor.tsx:51-57: `Save brief`, `Cancel`; no legacy note.
- Fix: Match button and note wording; keep new Cancel if needed as EXTRA.

## G2-7-011-011  [P2] GAP  facet F03  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:140-145: Retry small button appears in failed-load Alert.
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47: awaited workspace before component; no in-page retry button.
- Fix: Add section-scoped Retry with load error state.

## G2-7-011-020  [P2] GAP  facet F06  effort M
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:35-47: `Project goal / description`; optional; TextArea autoSize minRows 4 maxRows 9; exact placeholder.
- vNext now: V/components/projects/workspace-brief-editor.tsx:40-43: `Project goal` maxLength 2000; no placeholder or autoSize.
- Fix: Restore legacy label, exact placeholder, helper, and 4–9 rows; separately retain max if policy.

## G2-7-011-021  [P2] GAP  facet F06  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:59-73: `Deliverables` textarea 7–12 rows, multiline example placeholder.
- vNext now: V/components/projects/workspace-brief-editor.tsx:44-49: one-line-per-row hint, no example placeholder, no row sizing.
- Fix: Restore three-line sample placeholder and 7–12 row height.

## G2-7-011-022  [P2] GAP  facet F06  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:79-91: `Completion conditions` textarea minRows 7 maxRows 12; multiline placeholder.
- vNext now: V/components/projects/workspace-brief-editor.tsx:44-50: `Completion conditions · one per line` no placeholder/height.
- Fix: Restore exact label, three-line placeholder, sizing and helper.

## G2-7-011-023  [P2] GAP  facet F06  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:100-110: Personas textarea minRows 4 maxRows 10, sample frontend/backend ownership.
- vNext now: V/components/projects/workspace-brief-editor.tsx:44-50: Persona textarea no placeholder, height rule.
- Fix: Restore exact sample placeholder and sizing.

## G2-7-011-038  [P2] GAP  facet F09  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:14-117: always-expanded editor, no open/close trigger.
- vNext now: V/components/projects/workspace-brief-editor.tsx:36-39: collapsible toggle, `Edit project brief` / `Close brief editor`.
- Fix: Open editor by default on legacy Overview page; preserve optional collapse only if approved.

## G2-7-011-043  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:108-109: reloads workspace after save to refill form.
- vNext now: V/components/projects/workspace-brief-editor.tsx:31: closes editor then router.refresh; state may be reused.
- Fix: Version-key/remount form after refresh and keep it open in edit workflow.

## G2-7-011-045  [P2] GAP  facet F11  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:118-132: no-college state displays warning with tabs rather than redirect.
- vNext now: V/components/projects/admin-project-section-page.tsx:38-42: access denied before shell.
- Fix: Render recoverable no-college state for authenticated admins.

## G2-7-011-049  [P2] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:93: detailsToken guards stale detail saves; backend DTO:26-36.
- vNext now: V/modules/projects/workspace-brief-service.ts:16-26: row lock, updatedAt compare then update; uses entire project version.
- Fix: Document version granularity and show conflict prompt; avoid unrelated changes invalidating brief silently.

## G2-7-011-051  [P2] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:134-156: six-row Skeleton, warning `Workspace not found`, reloadable error Alert.
- vNext now: V/app/(authenticated)/college/projects/[projectId]/loading.tsx:1-10: page-level GracefulPageLoading directory shape; no six-row editor skeleton.
- Fix: Match six-row skeleton and scoped errors.

## G2-7-011-052  [P2] GAP  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:14-117: section visible on load, no empty-view placeholder.
- vNext now: V/components/projects/project-workspace.tsx:557-578: `No authored project brief is available.` when both JSON and template empty; editor collapsed.
- Fix: Provide editable empty brief immediately, with contextual helper.

## G2-7-011-057  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:50-94: AntD Col xs=24 lg=12 for Deliverables/DoD; Card/textarea width in shell.
- vNext now: V/components/projects/workspace-brief-editor.tsx:39-50: all fields one column at every breakpoint.
- Fix: Restore 1-column phone, 2-column desktop boxed layout per breakpoint.

## G2-7-011-058  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:37-110: AntD autosize 4–9,7–12,7–12,4–10 textarea rows.
- vNext now: V/components/projects/workspace-brief-editor.tsx:40-49: shared Textarea no editor-specific rows.
- Fix: Match autosizing and min-height on touch/mobile.

## G2-7-011-059  [P2] GAP  facet F17  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:29-100: sections aria-labelledby to named H5 IDs.
- vNext now: V/components/projects/workspace-brief-editor.tsx:36-49: section has aria-label; labels wrap textarea, no aria-labelledby section headings.
- Fix: Restore heading hierarchy and screen-reader section navigation.

## G2-7-011-060  [P2] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:62-67: AntD field validation on deliverables and focus/error association.
- vNext now: V/components/projects/workspace-brief-editor.tsx:24,59: first Zod error in one role=alert after all fields.
- Fix: Show field error adjacent and aria-describedby; focus first invalid field.

## G2-7-011-062  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:15-25: `Project brief`, `Learner & mentor view`, full descriptive headline and helper.
- vNext now: V/components/projects/workspace-brief-editor.tsx:37-43: `Edit project brief`, `Project goal`, `Description`.
- Fix: Copy legacy title/eyebrow/header and description verbatim.

## G2-7-011-063  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:32-45: `Goal`, `Project goal / description`, exact two helper strings.
- vNext now: V/components/projects/workspace-brief-editor.tsx:40-43: `Project goal` only.
- Fix: Restore goal helper, label, textarea placeholder exactly.

## G2-7-011-064  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:75-91: `Definition of done`, `Completion conditions`, verifiability helper and examples.
- vNext now: V/components/projects/workspace-brief-editor.tsx:44-50: `Completion conditions · one per line`.
- Fix: Use legacy Definition of done heading and help.

## G2-7-011-065  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:95-110: `Personas & ownership`, roles helper and sample.
- vNext now: V/components/projects/workspace-brief-editor.tsx:46-49: `Personas · one per line`.
- Fix: Restore persona copy exactly.

## G2-7-011-066  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:108-115 and editor:112-117: `Overview updated`, `Save project brief`, footer.
- vNext now: V/components/projects/workspace-brief-editor.tsx:54-56: `Save brief`, `Cancel`.
- Fix: Restore title/button/toast/footer strings from legacy-copy-B.md section WorkspaceOverviewEditor.

## G2-7-011-067  [P2] GAP  facet F19  effort L
- Legacy: LFE/components/admin/projects/adminWorkspaceSection.js:25-65: one workspace GET, no pagination for four fields.
- vNext now: V/modules/projects/workspace-view-service.ts:37-67: eight parallel service reads even for Overview.
- Fix: Defer unrelated services or cache aggregate reads; benchmark large task/submission histories.

## G2-7-011-070  [P2] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:83-111 and DTO:26-36: detailsToken CAS; empty edits clear goal and arrays.
- vNext now: V/modules/projects/workspace-brief-service.ts:16-26: row lock CAS, project-wide updatedAt.
- Fix: Show actionable 409/stale-content retry, verify clearing and concurrent unrelated updates.

## G2-7-011-075  [P2] GAP  facet F22  effort M
- Legacy: LBE/model/ProjectWorkspace.java:119-125: JPA numeric version optimistic token, overview JSON nullable.
- vNext now: V/modules/projects/workspace-brief-service.ts:16-31: updatedAt CAS and JSONB non-null default.
- Fix: Define version/token semantics and null/empty migration behavior.

## G2-7-011-027  [P3] GAP  facet F06  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:115: save button uses AntD loading state while request in flight.
- vNext now: V/components/projects/workspace-brief-editor.tsx:52-56: Save and Cancel disabled while busy; Save text changes to `Saving…`.
- Fix: Keep disabled behavior; compare spinner/icon and message exactness visually.
