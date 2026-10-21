# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/l17-u031-projects-end-to-end.md

16 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l17-u031-projects-end-to-end.md

## G2-17-031-002  [P1] GAP  facet F01  effort M
- Legacy: LFE/pages/mentor/projects/[projectId].js:7-15 derives key from projectId+account, not `?tab`, preserving open modal state.
- vNext now: V/app/(authenticated)/mentor/projects/[projectId]/page.tsx:24-47 changes tab-specific server component tree.
- Fix: Protect in-progress modal/form state across same-project tab navigation.

## G2-17-031-010  [P1] GAP  facet F04  effort M
- Legacy: LBE/controller/AdminProjectController.java:273-307 ProjectWorkspaceDTO with nested overview/sprints/tasks/status; model serialized per workspace.
- vNext now: V/db/schema/projects.ts:172-233 normalized UUID project with templateVersionId/teamGroupId, authoredBrief JSON, progress/status.
- Fix: Create full legacy nested-section and ID to UUID migration projection.

## G2-17-031-011  [P1] GAP  facet F04  effort M
- Legacy: LBE/controller/ProjectWorkspaceController.java:341-415 returns delivery, submission and review history.
- vNext now: V/modules/projects/submission-service.ts:21-54 separates projectSubmissions, reviews and deliveryEvents.
- Fix: Map every submission state, version, feedback, approver and evidence field.

## G2-17-031-012  [P1] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:34-45 tasks and sprint rows converted with alias keys and keyed materialization.
- vNext now: V/modules/projects/validation.ts:39-65 blueprint task key/sprintKey and priority/estimate fields.
- Fix: Migrate task keys and order without detaching sprint/comment/submission associations.

## G2-17-031-017  [P1] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:47-91 touched-only Save and tasksToken with sibling refresh.
- vNext now: V/modules/projects/task-assignment-service.ts:47-51 uses per-row millisecond updatedAt CAS.
- Fix: Preserve no-op untampered save, section-level token and no stale sibling overwrite.

## G2-17-031-021  [P1] GAP  facet F07  effort M
- Legacy: LBE/controller/AdminProjectController.java:198-242 per-team preflight and write errors.
- vNext now: V/modules/projects/instance-service.ts:50-57 maps PROJECT_SLUG_CONFLICT.
- Fix: Report duplicate slug, stale roster and conflict individually in bulk error report.

## G2-17-031-024  [P1] GAP  facet F09  effort M
- Legacy: LFE/pages/mentor/projects/[projectId].js:8-15 Create Task, Add Member, Schedule Meeting and Review Submission must not close when tab changes.
- vNext now: V/app/(authenticated)/mentor/projects/[projectId]/page.tsx:50-89 server branches choose distinct board/allocation/workspace components.
- Fix: Maintain stable modal state across selectedTab changes with dirty-confirm.

## G2-17-031-026  [P1] GAP  facet F10  effort M
- Legacy: LBE/controller/AdminProjectController.java:173-242 create/bulk materializes teams and workspaces.
- vNext now: V/modules/projects/instance-service.ts:13-48 reads section/enrollments, members, versioned template.
- Fix: Compare transactional team assignment and failed bulk rollback state.

## G2-17-031-028  [P1] GAP  facet F10  effort M
- Legacy: LBE/controller/ProjectWorkspaceController.java:341-415 learner submission, review and immutable history endpoints.
- vNext now: V/modules/projects/submission-service.ts:21-54 writes separate submission/review/delivery tables.
- Fix: Preserve legacy final delivery approval/reopening/evidence revision history.

## G2-17-031-032  [P1] GAP  facet F11  effort M
- Legacy: LBE/controller/ProjectWorkspaceController.java:664-699 learner/member edit API.
- vNext now: V/modules/projects/member-service.ts:69-100 validates college and role, primary mentor conflict.
- Fix: Map mentor/reviewer/learner mutation powers and role transfer rules.

## G2-17-031-033  [P1] GAP  facet F12  effort M
- Legacy: LBE/controller/AdminProjectTemplateController.java:391-472 Publish/Unpublish and rollback template versions.
- vNext now: V/db/schema/projects.ts:26-120 template version and publishedVersion indexes/constraints.
- Fix: Verify rollback doesn't mutate already-assigned frozen version.

## G2-17-031-040  [P1] GAP  facet F14  effort M
- Legacy: LBE/controller/ProjectWorkspaceController.java:341-415 delivery evidence.
- vNext now: V/modules/projects/submission-service.ts:21-54 includes projectResourceFiles, submission links.
- Fix: Verify multi-file/link/text acceptance and attachment replay/removal behavior.

## G2-17-031-051  [P1] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:59-91 touched/refresh/section token concurrency.
- vNext now: V/modules/projects/task-assignment-service.ts:47-51 millisecond optimistic update.
- Fix: Check mismatch handling between array token and per-task timestamp updates.

## G2-17-031-053  [P1] GAP  facet F21  effort M
- Legacy: LBE/controller/AdminProjectController.java:79-137 team generation and reconciliation and 198-242 bulk.
- vNext now: V/modules/projects/instance-service.ts:13-35 references active enrollment/cohort/section.
- Fix: Lock learner group roster through creation, compare batch promotion/revert callbacks.

## G2-17-031-055  [P1] GAP  facet F22  effort L
- Legacy: LBE/controller/ProjectWorkspaceController.java:135-305 structured workspace sections and template keys.
- vNext now: V/db/schema/projects.ts:26-245 normalized templates/instances/release/sprints/tasks and JSON authoredBrief.
- Fix: Create legacy-to-vNext migrations field map for arrays, slugs, tokens and timestamp precision.

## G2-17-031-020  [P2] GAP  facet F07  effort M
- Legacy: LBE/controller/ProjectWorkspaceController.java:491-520 meeting and withdraw APIs return response errors.
- vNext now: V/modules/projects/meeting-service.ts:42-75 throws PROJECT_MEETING_INVALID_STATE/NOT_FOUND.
- Fix: Map exact error copy and field focus for invalid meetings.
