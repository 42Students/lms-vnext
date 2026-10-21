# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u011-college-admin-workspace-overview.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u011-college-admin-workspace-overview.md

## G2-7-011-014  [P1] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:64-81: `definitionOfDone` array rendered newline separated.
- vNext now: V/components/projects/workspace-brief-editor.tsx:17,22: schema property `completionConditions`, not `definitionOfDone`.
- Fix: Map definitionOfDone to completionConditions bidirectionally during migration/compat read.

## G2-7-011-016  [P1] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:67-68,94-111: keeps all unedited arbitrary overview keys intact.
- vNext now: V/modules/projects/workspace-brief-service.ts:23-26: overwrites authoredBrief with a strict schema object.
- Fix: Preserve unknown legacy overview keys in compatibility projection or explicitly inventory/migrate them before replace.

## G2-7-011-024  [P1] GAP  facet F06  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:63-68: Deliverables validator requires at least one non-empty line.
- vNext now: V/modules/projects/workspace-brief-model.ts:5,9-12: array may be empty; save accepts zero deliverables.
- Fix: Require at least one deliverable for college-admin edit (or document intentional policy change).

## G2-7-011-025  [P1] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:85-88: untouched form Save shows info toast; no network mutation.
- vNext now: V/components/projects/workspace-brief-editor.tsx:20-33: save always parses/confirms/PATCHes even unchanged.
- Fix: Track dirty state and disable/no-op untouched submit; restore `No changes to save` feedback.

## G2-7-011-026  [P1] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:48,113-115: navigation guard covers unload and section switches for dirty form.
- vNext now: V/components/projects/workspace-brief-editor.tsx:38,55-56: toggling Close/Cancel discards fields without dirty confirmation; guard only save confirm.
- Fix: Add dirty form route/unload/cancel confirmation with legacy exact message.

## G2-7-011-028  [P1] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:72-81: form reset/refill after loaded workspace; clears touched state.
- vNext now: V/components/projects/workspace-brief-editor.tsx:14-18: client useState initialized from props, no reset on subsequent update.
- Fix: Reinitialize fields when workspace version changes after refresh; avoid stale-edit saves.

## G2-7-011-039  [P1] GAP  facet F09  effort M
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:34-57: native beforeunload and `window.confirm('You have unsaved changes. Leave without saving them?')` on route change.
- vNext now: V/components/projects/workspace-brief-editor.tsx:55-56: instant Cancel/Close, no dirty dialog.
- Fix: Warn on cancel, Close, Back/tab and unload; retain exact copy.

## G2-7-011-042  [P1] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:94-101: blank goal explicitly sent to clear while unknown facts retained.
- vNext now: V/modules/projects/workspace-brief-service.ts:23-26: overwrites entire authoredBrief object, empty goal accepted.
- Fix: Test clearing a template-derived goal and retaining any unknown overview keys.

## G2-7-011-046  [P1] GAP  facet F11  effort M
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:14-117: assigned college admin can edit overview while workspace exists.
- vNext now: V/components/projects/project-workspace.tsx:260-263,469-471: editor not shown if ARCHIVED or COMPLETED.
- Fix: Confirm legacy archived/completed edit policy; if allowed, replicate scoped edit rules or record intentional lock.

## G2-7-011-047  [P1] GAP  facet F12  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:15-19: trim each line and discard blank lines; all array values may be cleared except deliverables fails validation.
- vNext now: V/components/projects/workspace-brief-editor.tsx:19-24: identical trim/filter, but empty deliverables permitted.
- Fix: Align deliverables validation while preserving clearable DoD/personas.

## G2-7-011-048  [P1] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:67-69,93-106: untouched overview fields preserved and empty goal supported.
- vNext now: V/modules/projects/workspace-brief-model.ts:2-12: strict object requiring five fields, no arbitrary key retention.
- Fix: Preserve extension keys or migrate/whitelist with explicit loss audit.

## G2-7-011-061  [P1] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:31-61: guards keyboard Back/Forward and app tab navigation on dirty form.
- vNext now: V/components/projects/workspace-brief-editor.tsx:37-39,55-56: no dirty navigation interception.
- Fix: Implement focus-safe confirm for dirty Cancel, tabs and browser unload.

## G2-7-011-069  [P1] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:61-82,108-109: rehydrate form on workspace reload/reset and preserve extra keys.
- vNext now: V/components/projects/workspace-brief-editor.tsx:14-18,31: initial useState props and router.refresh.
- Fix: Key form to project version or useEffect sync on updatedAt after save.

## G2-7-011-073  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/ProjectWorkspace.java:103-105; db/migration/V74__project_workspaces.sql:1-30: MySQL workspace.overview JSON, global unique slug and version field.
- vNext now: V/db/schema/projects.ts:172-264,209: PG project_instances.authored_brief JSONB default, college-scoped slug, updated_at.
- Fix: Create explicit legacy overview->authored_brief mapping, key rename and default/unknown-key policy.

## G2-7-011-074  [P1] GAP  facet F22  effort M
- Legacy: LBE/dto/projects/ProjectWorkspaceUpdateDTO.java:18,26-36: generic overview Object, detailsToken; DTO overview nested goal/currentFocus/deliverables.
- vNext now: V/modules/projects/workspace-brief-model.ts:2-12: strict five-field schema with goal/description/deliverables/completionConditions/personas and expectedUpdatedAt.
- Fix: Record full compatibility schema and migration test for all overview variants.

## G2-7-011-077  [P1] GAP  facet F23  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:67-111: extra unknown overview facts roundtrip and untouched-save protection.
- vNext now: V/modules/projects/workspace-brief-model.ts:2-12 and editor.tsx:20-33: strict payload and no untouched check.
- Fix: Restore extension-key preservation and untouched guard; document any purposeful removal.

## G2-7-011-030  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:111-114: showProjectError modal fallback `Failed to update overview`.
- vNext now: V/components/projects/workspace-brief-editor.tsx:32,59: inline error with fallback `Unable to save workspace brief`.
- Fix: Use section-specific modal/wording and distinct 409 conflict recovery.

## G2-7-011-031  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:139-142: load error `Workspace could not be loaded`, error description and Retry.
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47: throws or rejects during server render; no corresponding in-page Alert.
- Fix: Create recoverable workspace fetch-error panel with Retry and error details.

## G2-7-011-032  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:145-153: `Workspace not found` if not loading and no workspace.
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47: no explicit workspace-specific empty alert.
- Fix: Distinguish inaccessible/not-found from transport failure.

## G2-7-011-033  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:119-132: no-college Alert message/description inside shell.
- vNext now: V/components/projects/admin-project-section-page.tsx:38-42: access gate fails before shell renders.
- Fix: Restore `Admin not assigned to a college` warning and shell tabs.
