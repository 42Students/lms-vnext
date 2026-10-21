# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u014-college-admin-workspace-sprints.md (part 2 of 2)

4 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u014-college-admin-workspace-sprints.md

## G2-7-014-070  [P2] GAP  facet F20  effort L
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:70-85 unsaved Delete/Undo restore prior index
- vNext now: V/components/projects/project-workspace.tsx:945-949 separate sprint DeleteControl, no staged Undo
- Fix: Design reversible deletion or explicit confirm/recovery

## G2-7-014-076  [P2] GAP  facet F22  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:26-88 releaseKey selected from server release options, key materialized on save
- vNext now: V/modules/projects/mentor-sprint-write-service.ts:44-65 FK releaseId, templateKey mentor UUID; unique release sequence
- Fix: Map slug releaseKey and ordered sprint sequence

## G2-7-014-056  [P3] GAP  facet F15  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:85-123 UI calls only admin update, no email template code
- vNext now: V/modules/projects/mentor-sprint-write-service.ts:55-82 records project sprint activity; notification not shown in create service
- Fix: Audit expected activity event count on batch update and reconcile

## G2-7-014-072  [P3] GAP  facet F21  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:47-71 additional GET releases API, no local background worker
- vNext now: V/modules/projects/mentor-sprint-write-service.ts:20-87 direct DB transaction and activity event
- Fix: Verify no duplicate activity across legacy bulk saves and new CRUD
