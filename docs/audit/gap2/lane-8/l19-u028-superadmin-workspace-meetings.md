# L19-U028 — Super Admin workspace Meetings page

Evidence file:line roots: meetings.js = docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/meetings.js; WorkspaceMeetingsEditor.jsx, projectSectionFieldConfigs.js, RepeatingItemEditor.jsx = docs/legacy-source/frontend/src/components/admin/projects/; project-workspace.tsx, project-meeting-controls.tsx, admin-project-section-page.tsx = src/components/projects/; meeting-service.ts = src/modules/projects/; projects.ts = src/db/schema/. Legacy backend closure includes updateProject meeting list/token and new lifecycle service + relational schema. No code changes.

| ID | Facet | Legacy file:line | vNext file:line | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-19-028-001 | F01 | meetings.js:25-28 Super Admin workspace route | admin-project-section-page.tsx:19-35 selected project route | GAP | P2 | Redirect old deep link | M |
| G2-19-028-002 | F02 | WorkspaceMeetingsEditor.jsx:39-59 Meeting plan intro and four stats | project-workspace.tsx:1466-1499 heading and actions without stats | GAP | P2 | Restore old metric strip | M |
| G2-19-028-003 | F03 | WorkspaceMeetingsEditor.jsx:67-79 Add meeting + Save meeting plan | project-meeting-controls.tsx:484-505 Schedule meeting in modal | GAP | P2 | Restore distinct buttons | M |
| G2-19-028-004 | F04 | projectSectionFieldConfigs.js:176-215 12 meeting fields including keys/notes | project-meeting-controls.tsx:53-136,524-585 fewer separate form fields | GAP | P1 | Expose omitted fields | M |
| G2-19-028-005 | F05 | RepeatingItemEditor.jsx:99-137 search/reorder/delete row | project-workspace.tsx:1528-1651 read-only cards with individual actions | GAP | P2 | Build list editor controls | M |
| G2-19-028-006 | F06 | projectSectionFieldConfigs.js:207-209 separate date and 5-min time pickers | project-meeting-controls.tsx:105-135 IST datetime-local controls | GAP | P2 | Match date/time controls | M |
| G2-19-028-007 | F07 | RepeatingItemEditor.jsx:253-275 max500 row validator | meeting-service.ts:257-331 per-meeting validation with overlap rules | GAP | P1 | Map batch errors to row | M |
| G2-19-028-008 | F08 | meetings.js:60-73 No changes to save / Meetings updated | project-meeting-controls.tsx:470-474 Meeting added/updated | GAP | P2 | Match save toasts | M |
| G2-19-028-009 | F09 | meetings.js:33 form-wide unsaved guard | project-meeting-controls.tsx:355-369 dialog dirty guard | GAP | P2 | Guard list-wide navigation | M |
| G2-19-028-010 | F10 | meetings.js:66-72 PUT meetingsList and meetingsToken | meeting-service.ts:257-429 POST/PATCH one meeting with version | GAP | P1 | Offer guarded batch compatibility | M |
| G2-19-028-011 | F11 | meetings.js:87-104 no-college alert inside tab shell | admin-project-section-page.tsx:38-47 access throws before shell | GAP | P2 | Preserve scoped empty state | M |
| G2-19-028-012 | F12 | projectSectionFieldConfigs.js:184-190 all six statuses editable | project-meeting-controls.tsx:525-534 disabled completed/cancelled/requested | GAP | P2 | Expose status transitions | M |
| G2-19-028-013 | F13 | meetings.js:115-132 Retry error, Skeleton6, not-found | admin-project-section-page.tsx:38-47 server fetch, no local retry | GAP | P2 | Restore recovery states | M |
| G2-19-028-014 | F14 | WorkspaceMeetingsEditor.jsx:39-84 no file upload/export | project-workspace.tsx:1466-1651 no export | MATCH | P3 | No file feature to add | M |
| G2-19-028-015 | F15 | WorkspaceMeetingsEditor.jsx:79 calendar/follow-up system managed | meeting-service.ts:365-426 notice on schedule | GAP | P2 | Verify calendar/follow-up notices | M |
| G2-19-028-016 | F16 | RepeatingItemEditor.jsx:169-184 xs24/md12 per half field | project-meeting-controls.tsx:105-135 start/end grid sm2 | GAP | P2 | Match compact field grid | M |
| G2-19-028-017 | F17 | RepeatingItemEditor.jsx:115-137 aria-expanded and reorder labels | project-workspace.tsx:1528-1651 card actions | GAP | P2 | Restore accessible reorder | M |
| G2-19-028-018 | F18 | WorkspaceMeetingsEditor.jsx:40,43 Meeting plan / Team cadence | project-workspace.tsx:1469 Meetings | GAP | P3 | Use exact headings | M |
| G2-19-028-019 | F19 | RepeatingItemEditor.jsx:49-51 client search all rows | meeting-service.ts:149-182 ordered full-project rows | GAP | P2 | Add search and paging | M |
| G2-19-028-020 | F20 | meetings.js:66-72 refresh siblings then section CAS | meeting-service.ts:289-331 project lock + time-overlap CAS | GAP | P2 | Preserve safe version semantics | M |
| G2-19-028-021 | F21 | meetings.js:35-44 sprint/task keys from workspace | meeting-service.ts:78-147 validates scoped UUID links | GAP | P2 | Convert keys to IDs | M |
| G2-19-028-022 | F22 | meetings.js:68-72 meetingsList JSON workspace update | projects.ts:1104-1215 project_meetings UUID relational rows | GAP | P1 | Write field/status migration | M |
| G2-19-028-023 | F23 | meetings.js:60-63 untouched save no-op | project-meeting-controls.tsx:405-480 dialog submit regardless touch | GAP | P2 | Disable unchanged save | M |
| G2-19-028-024 | F04 | WorkspaceMeetingsEditor.jsx:32-37 linked/complete/requested counts | project-workspace.tsx:1500-1524 mentor Next meeting only | GAP | P2 | Show all four admin counters |
| G2-19-028-025 | F06 | projectSectionFieldConfigs.js:210 optional meetingUrl | meeting-service.ts:314-316 URL required unless draft | GAP | P2 | Show conditional required hint |
| G2-19-028-026 | F06 | projectSectionFieldConfigs.js:213-214 agenda and notes as separate textareas | project-meeting-controls.tsx:93-104 agenda, facilitation notes separately | GAP | P2 | Expose both controls in admin editor |
| G2-19-028-027 | F07 | RepeatingItemEditor.jsx:272-274 Item N required fields message | project-meeting-controls.tsx:411-421 error generic per dialog | GAP | P2 | Use row-indexed validation |
| G2-19-028-028 | F09 | RepeatingItemEditor.jsx:105-107 Undo remove before save | project-meeting-controls.tsx:831-872 Cancel permanently changes state | GAP | P2 | Support undo of unsaved row removal |
| G2-19-028-029 | F12 | projectSectionFieldConfigs.js:192-205 ceremony General/Planning/Standup/Review/Retro | projects.ts:1192-1195 same five enums | MATCH | P3 | Retain ceremony enumeration |
| G2-19-028-030 | F23 | meetings.js:48-53 reset/refill after save avoids blank editor | project-meeting-controls.tsx:470-479 router refresh closes dialog | GAP | P2 | Keep editor populated on revalidation |

30 rows, all 23 facets; severities {"P2":17,"P1":4,"P3":2}. Main blockers: list-wide bulk edit and field coverage, versioned batch save, summary metrics and menu/copy differences. Preserve current room/organiser collision checks and tenant permissions.
