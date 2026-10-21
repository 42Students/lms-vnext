# Work packet: edit src/components/projects/project-meeting-controls.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u027-mentor-project-detail.md, docs/audit/gap2/lane-8/l19-u028-superadmin-workspace-meetings.md

## G2-7-027-033  [P1] GAP  facet F06  effort L
- Legacy: PDC:10346-10598 meeting form title,status,ceremony,date,times,link,sprint,task,agenda,notes,outcome,retro,followups
- vNext now: project-meeting-controls.tsx:420-560 shorter meeting form
- Fix: Restore or intentionally retire individual fields and validation, with schema mapping

## G2-7-027-050  [P1] GAP  facet F10  effort L
- Legacy: PDC:10346-10598 meeting post/update carries notes, followups, retrospective
- vNext now: project-meeting-controls.tsx:420-560 smaller form and separate meeting notes
- Fix: Crosswalk mutation payload, record properties and meeting status transitions

## G2-19-028-004  [P1] GAP  facet F04  effort M
- Legacy: projectSectionFieldConfigs.js:176-215 12 meeting fields including keys/notes
- vNext now: project-meeting-controls.tsx:53-136,524-585 fewer separate form fields
- Fix: Expose omitted fields

## G2-19-028-008  [P2] GAP  facet F08  effort M
- Legacy: meetings.js:60-73 No changes to save / Meetings updated
- vNext now: project-meeting-controls.tsx:470-474 Meeting added/updated
- Fix: Match save toasts

## G2-19-028-027  [P2] GAP  facet F07  effort 
- Legacy: RepeatingItemEditor.jsx:272-274 Item N required fields message
- vNext now: project-meeting-controls.tsx:411-421 error generic per dialog
- Fix: Use row-indexed validation
