# Work packet: edit src/modules/projects/activity-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u018-project-activity-event.md

## G2-5-018-025  [P1] GAP  facet F10  effort M
- Legacy: Legacy per-project repository queries by projectId direct column `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectActivityEventRepository.java:15-53`
- vNext now: New project query checks PROJECTS module, college and project subject or metadata.projectId `src/modules/projects/activity-service.ts:68-98`
- Fix: Prove every imported activity has consistent project subject/metadata; otherwise silently missing.

## G2-5-018-049  [P1] MISSING  facet F23  effort M
- Legacy: Legacy has frozen actor name,type and readable title/sourceTab `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:28-46`
- vNext now: New event projection omits these fields, uses current user display name `src/modules/projects/activity-service.ts:26-53`
- Fix: Preserve historical display metadata or explicitly authorize retirement.

## G2-5-018-020  [P3] GAP  facet F08  effort S
- Legacy: Legacy success message 'Project activity feed retrieved' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:459-463`
- vNext now: New service returns rows/hasMore, not legacy response message `src/modules/projects/activity-service.ts:107-110`
- Fix: Map API envelope for compatibility callers.
