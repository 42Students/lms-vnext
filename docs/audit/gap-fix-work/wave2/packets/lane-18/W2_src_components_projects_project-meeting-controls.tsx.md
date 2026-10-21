# Work packet (wave 2): edit src/components/projects/project-meeting-controls.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u027-mentor-project-detail.md, docs/audit/gap2/lane-8/l19-u028-superadmin-workspace-meetings.md

## G2-7-027-064  [P2] GAP  facet F14  effort S
- Legacy: PDC:10346-10598 meeting link required and http/https
- vNext now: project-meeting-controls.tsx:520-535 HTTPS only
- Fix: Document deliberate secure HTTPS validation difference

## G2-19-028-003  [P2] GAP  facet F03  effort M
- Legacy: WorkspaceMeetingsEditor.jsx:67-79 Add meeting + Save meeting plan
- vNext now: project-meeting-controls.tsx:484-505 Schedule meeting in modal
- Fix: Restore distinct buttons

## G2-19-028-006  [P2] GAP  facet F06  effort M
- Legacy: projectSectionFieldConfigs.js:207-209 separate date and 5-min time pickers
- vNext now: project-meeting-controls.tsx:105-135 IST datetime-local controls
- Fix: Match date/time controls

## G2-19-028-009  [P2] GAP  facet F09  effort M
- Legacy: meetings.js:33 form-wide unsaved guard
- vNext now: project-meeting-controls.tsx:355-369 dialog dirty guard
- Fix: Guard list-wide navigation

## G2-19-028-012  [P2] GAP  facet F12  effort M
- Legacy: projectSectionFieldConfigs.js:184-190 all six statuses editable
- vNext now: project-meeting-controls.tsx:525-534 disabled completed/cancelled/requested
- Fix: Expose status transitions

## G2-19-028-016  [P2] GAP  facet F16  effort M
- Legacy: RepeatingItemEditor.jsx:169-184 xs24/md12 per half field
- vNext now: project-meeting-controls.tsx:105-135 start/end grid sm2
- Fix: Match compact field grid

## G2-19-028-023  [P2] GAP  facet F23  effort M
- Legacy: meetings.js:60-63 untouched save no-op
- vNext now: project-meeting-controls.tsx:405-480 dialog submit regardless touch
- Fix: Disable unchanged save

## G2-19-028-026  [P2] GAP  facet F06  effort 
- Legacy: projectSectionFieldConfigs.js:213-214 agenda and notes as separate textareas
- vNext now: project-meeting-controls.tsx:93-104 agenda, facilitation notes separately
- Fix: Expose both controls in admin editor

## G2-19-028-028  [P2] GAP  facet F09  effort 
- Legacy: RepeatingItemEditor.jsx:105-107 Undo remove before save
- vNext now: project-meeting-controls.tsx:831-872 Cancel permanently changes state
- Fix: Support undo of unsaved row removal

## G2-19-028-030  [P2] GAP  facet F23  effort 
- Legacy: meetings.js:48-53 reset/refill after save avoids blank editor
- vNext now: project-meeting-controls.tsx:470-479 router refresh closes dialog
- Fix: Keep editor populated on revalidation
