# Work packet: edit src/modules/projects/meeting-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l19-u028-superadmin-workspace-meetings.md

## G2-19-028-007  [P1] GAP  facet F07  effort M
- Legacy: RepeatingItemEditor.jsx:253-275 max500 row validator
- vNext now: meeting-service.ts:257-331 per-meeting validation with overlap rules
- Fix: Map batch errors to row

## G2-19-028-010  [P1] GAP  facet F10  effort M
- Legacy: meetings.js:66-72 PUT meetingsList and meetingsToken
- vNext now: meeting-service.ts:257-429 POST/PATCH one meeting with version
- Fix: Offer guarded batch compatibility
