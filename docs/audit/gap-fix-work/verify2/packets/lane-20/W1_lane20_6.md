# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-6-023-017 [P1] GAP facet F06
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: Legacy eligibility decision array of Change {scopeType,scopeId,status,reason,note} (PlacementEligibilityService.java:136-141; TpoBatchesController.java:114-119).
- Expected fix: Support clear-to-NOT_DECIDED semantics via row removal, notes and per-scope decision provenance.

## G2-13-023-008 [P1] GAP facet F04
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LBE/service/tpo/TpoScheduleService.java:349-353 room fallback ra.room -> slot room -> round venue, treats '' and literal `null` as blank.
- Expected fix: Use booked candidate-slot venue before round default and normalize literal null/empty.

## G2-14-030-030 [P1] MISSING facet F09
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:237-254 dirty cancel invokes Modal.confirm `Discard interview changes?`, `Discard changes`, `Keep editing`.
- Expected fix: Add dirty snapshot tracking and exact discard confirmation; prevent accidental data loss.

## G2-17-021-048 [P1] GAP facet F22
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LBE/dto/response/PublicJobResponseDTO.java:35-44 excludes private evaluation/targeting data at projection boundary.
- Expected fix: Ensure DTO select explicitly whitelists needed nested JSON only; validate no accidental serialization.

## G2-17-031-029 [P1] GAP facet F10
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: src/modules/projects/instance-restore-service.ts
- Legacy: LBE/controller/AdminProjectController.java:555-630 Archive/Delete/Restore separate lifecycle operations.
- Expected fix: Verify distinct archive vs delete semantics and exact restoration of membership.

## G2-18-021-062 [P1] GAP facet F23
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LBE/controller/JobController.java:906-974 separates own learner from college-admin query permissions.
- Expected fix: Choose role-specific data providers and preserve tenant boundaries, not a single global job date query.

## G2-7-001-066 [P1] GAP facet F22
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LBE/model/ProjectWorkspace.java:15-32,58-60: entity project_workspace, slug 80, title 160, status IN_PROGRESS default, blocker TEXT.
- Expected fix: Document intentional slug/status differences and preserve blocker parity.

## G2-7-004-005 [P1] GAP facet F02
- Verification: OK — inspected vNext implementation: workspace brief exact deliverables error, canonical pagination redirect, and scoped slug resolution/readiness blocks are present as applicable.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:420-491: first card Active overrides, second Select workspace, third Current readiness, then Releases, Manual override.
- Expected fix: Restore order and all five legacy card blocks on same route.

## G2-7-004-046 [P1] GAP facet F12
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: src/modules/projects/readiness-override-model.ts
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:637-655: existing final submission takes precedence and override has no effect.
- Expected fix: Derive final verdict from submission gate precedence, not override alone.

## G2-7-005-056 [P1] GAP facet F23
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:157-165: removed redundant Preview and alternate weak create modal; only full create workflow.
- Expected fix: Restore only full create CTA, not preview or modal.

## G2-7-008-022 [P1] GAP facet F07
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:50-59: error `Workspace could not be loaded`, Retry; if empty without loading: `Workspace not found`.
- Expected fix: Map missing project to exact warning, add retriable scoped error state.

## G2-7-011-025 [P1] GAP facet F06
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:85-88: untouched form Save shows info toast; no network mutation.
- Expected fix: Track dirty state and disable/no-op untouched submit; restore `No changes to save` feedback.

## G2-7-011-029 [P1] GAP facet F07
- Verification: OK — inspected vNext implementation: workspace brief exact deliverables error, canonical pagination redirect, and scoped slug resolution/readiness blocks are present as applicable.
- Files: src/modules/projects/workspace-brief-model.ts
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:64-67: required deliverables error exactly `Add at least one deliverable.` field-level AntD.
- Expected fix: Restore required rule and field-level exact message, not generic Zod issue.

## G2-7-013-019 [P1] GAP facet F05
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:62-95,113-139: add/remove/undo/move rows unsaved, stable original order
- Expected fix: Restore unsaved batch/Undo semantics or deliberate separate CRUD design

## G2-7-014-040 [P1] GAP facet F10
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:97-110 PUT updateProject with `{sprints,sprintsToken}` after refreshWorkspaceForSave
- Expected fix: Provide atomic plan update or explicit failure recovery for partial per-sprint saves

## G2-7-015-046 [P1] GAP facet F10
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:316-357 PUT updateProject only touched scalar fields + detailsToken
- Expected fix: Map selective-update and version/merge semantics

## G2-7-016-056 [P1] GAP facet F17
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:31-61 keyboard Back/Forward and tab-switch guard
- Expected fix: Guard page navigation for dirty plan edits

## G2-7-017-041 [P1] GAP facet F09
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:257-269 destructive removal confirmation lists affected learner names and prior-work retention
- Expected fix: List removed learners explicitly in confirmation, with full consequence

## G2-7-018-036 [P1] GAP facet F10
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:81-85 POST restoreProject/:slug/restore?collegeId AdminService.js:380-387
- Expected fix: Differentiate soft-delete restore from archive restore, supply correct concurrency token

## G2-7-019-056 [P1] GAP facet F12
- Verification: OK — inspected vNext implementation: workspace brief exact deliverables error, canonical pagination redirect, and scoped slug resolution/readiness blocks are present as applicable.
- Files: src/modules/projects/college-projects-query-model.ts, src/app/(authenticated)/college/projects/page.tsx
- Legacy: workspaces/index.js:148-154 jumps to last valid page if archiving empties selected page
- Expected fix: Call canonicalCollegeProjectsPageHref when query.page exceeds result.totalPages.

## G2-7-026-087 [P1] GAP facet F22
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: src/modules/projects/mentor-attention-service.ts
- Legacy: notifications.js:287-340 project resolvedDelivery/meetingsList/status/updatedAt from projectService
- Expected fix: Define field/status/timestamp crosswalk for review and meeting signal parity

## G2-7-030-046 [P1] GAP facet F11
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: src/app/(authenticated)/admin/projects/audit/page.tsx
- Legacy: audit/index.js:469-487 no-college blocks audit under shell
- Expected fix: Show global vs selected-college scope clearly to avoid cross-tenant surprise

## G2-7-032-002 [P1] GAP facet F01
- Verification: OK — inspected vNext implementation: workspace brief exact deliverables error, canonical pagination redirect, and scoped slug resolution/readiness blocks are present as applicable.
- Files: src/components/projects/project-admin-readiness-page.tsx
- Legacy: readiness/index.js:248-274 URL ?projectId=slug preselects workspace
- Expected fix: Translate legacy slugs to UUID with scoped lookup for direct bookmarks

## G2-7-032-007 [P1] GAP facet F02
- Verification: OK — inspected vNext implementation: workspace brief exact deliverables error, canonical pagination redirect, and scoped slug resolution/readiness blocks are present as applicable.
- Files: src/components/projects/project-admin-readiness-page.tsx
- Legacy: readiness/index.js:515-721 selected workspace Current readiness, Releases, Manual override Cards
- Expected fix: Provide same-page readiness metrics/releases/override or explicit parity navigation

## G2-7-032-042 [P1] GAP facet F10
- Verification: DEFERRED — source/legacy behavior comparison and relevant integration checks still required; no parity asserted.
- Files: src/app/api/projects/[projectId]/readiness/override/route.ts
- Legacy: AdminService.js:470-471 POST /api/v1/admin/projects/{id}/readiness/override payload collegeId, override bool\|null, note
- Expected fix: Map old boolean/null contract to state enum, preserve access and effects
