# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/superadmin-projects-workspaces-reassign-mentor.md

29 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-projects-workspaces-reassign-mentor.md

## G2-6-028-002  [P2] GAP  facet F01  effort M
- Legacy: ?fromMentorId numeric deep-link initializes current filter when router ready (reassign-mentor.js:82-93).
- vNext now: Query accepts UUID or UNASSIGNED and rejects unrecognized parameters; builds encoded links (admin-reassign-mentor-query-model.ts:10-36,43-63).
- Fix: Translate legacy numeric mentor deep-link to membership UUID and preserve prefilter across redirects.

## G2-6-028-003  [P2] GAP  facet F01  effort S
- Legacy: Legacy top-right Back to workspaces button navigates /superadmin/projects/workspaces (reassign-mentor.js:355-368).
- vNext now: vNext standalone back link sits ABOVE PageHeader and navigates basePath=/admin/projects (project-admin-reassign-mentor-page.tsx:71-79).
- Fix: Position back action at legacy header right; retain exact destination and label.

## G2-6-028-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy workload is a compact AntD Table in Card, three columns (reassign-mentor.js:157-200,374-388).
- vNext now: vNext workload is grid of clickable Link tiles behind Disclosure (project-admin-reassign-mentor-page.tsx:79-95).
- Fix: Use shared table with Mentor, Active workspaces, At-risk columns and sorts.

## G2-6-028-007  [P2] GAP  facet F03  effort S
- Legacy: Title Bulk mentor reassignment; subtitle Move multiple active workspaces to a new mentor at once. (reassign-mentor.js:358-362).
- vNext now: Same title; subtitle Move selected non-archived project workspaces to a new primary mentor. (project-admin-reassign-mentor-page.tsx:73-76).
- Fix: Restore exact legacy subtitle and line positioning.

## G2-6-028-009  [P2] GAP  facet F03  effort M
- Legacy: Workspaces 3-column row headings Workspace, Current mentor, Status, current mentor label and Already this mentor — will skip Tag (reassign-mentor.js:294-327).
- vNext now: vNext checkbox list shows title, mentor/status badges, already-this-mentor warning (project-mentor-reassignment.tsx:214-244).
- Fix: Use shared table with original 3 headers and checkbox selection column.

## G2-6-028-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy CTA text Reassign selected, disabled for none or faculty options error (reassign-mentor.js:476-490).
- vNext now: vNext CTA Reassign N workspace(s), disabled for none/no mentor/pending; faculty loading error handled page-wide (project-mentor-reassignment.tsx:325-340).
- Fix: Keep Reassign selected literal wording and disabled rules; preserve new safeguard for missing mentor.

## G2-6-028-014  [P2] GAP  facet F04  effort S
- Legacy: Legacy project status displayed humanized via statusLabel and statusColor helper (reassign-mentor.js:323-326; adminProjectUtils.js:96-119).
- vNext now: vNext StatusBadge neutral displays raw workspace.status uppercase (project-mentor-reassignment.tsx:241-243).
- Fix: Humanize status and map colors by legacy active/blocked/archived state.

## G2-6-028-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy workload table shows 10 rows/page only if >10, no size selector (reassign-mentor.js:377-382).
- vNext now: vNext workload Link grid shows all mentors without pagination (project-admin-reassign-mentor-page.tsx:79-95).
- Fix: Add workload pagination at threshold 10 or approved scroll policy.

## G2-6-028-019  [P2] GAP  facet F05  effort M
- Legacy: Legacy filteredProjects computed from all projects client-side, excludes archive before filter, preserving current mentor userId equality (reassign-mentor.js:95-123).
- vNext now: vNext SQL filters prior to pagination; allows status, q and fromMentorId; only excludes ARCHIVED (mentor-reassignment-workload-service.ts:98-114,134-148).
- Fix: Reconcile completed status visibility, search/filter defaults and matching counts.

## G2-6-028-021  [P2] GAP  facet F06  effort M
- Legacy: Current mentor select showSearch, server search, allowClear, placeholder Any mentor — search by name (reassign-mentor.js:390-405).
- vNext now: vNext separate backend mentor search and native Select placeholder All mentors, filter form GET (project-admin-reassign-mentor-page.tsx:96-131).
- Fix: Rebuild searchable async select with exact placeholder/clear affordance.

## G2-6-028-022  [P2] GAP  facet F06  effort M
- Legacy: New mentor select showSearch, server searching and placeholder Search by mentor name (reassign-mentor.js:440-453).
- vNext now: vNext type-search Input placeholder Name or email plus native Select label New primary mentor (project-mentor-reassignment.tsx:250-291).
- Fix: Clone single searchable new-mentor combobox and existing select focus/keyboard behavior.

## G2-6-028-023  [P2] GAP  facet F06  effort S
- Legacy: Role label input AntD AutoComplete suggests Project Mentor, max 80, blank means Project Mentor (reassign-mentor.js:454-467,208-218).
- vNext now: vNext plain Input maxLength=120, default Project Mentor and server requires min1 max120 (project-mentor-reassignment.tsx:52-53,292-303; validation.ts:443-449).
- Fix: Restore 80-character limit and blank-as-default semantics; include Project Mentor suggestion.

## G2-6-028-024  [P2] GAP  facet F06  effort S
- Legacy: Legacy new mentor required Form.Item with exact error Select a mentor (reassign-mentor.js:442-452).
- vNext now: vNext Button silently disabled until mentor selected; native Select option Select a mentor (project-mentor-reassignment.tsx:268-280,325-333).
- Fix: Show inline validation message Select a mentor on attempted submission.

## G2-6-028-025  [P2] GAP  facet F06  effort S
- Legacy: Legacy role label tooltip detailed explanation of team-roster name and blank default (reassign-mentor.js:454-459).
- vNext now: vNext role label field has no tooltip/helper (project-mentor-reassignment.tsx:292-304).
- Fix: Restore exact tooltip and keyboard-operable help affordance.

## G2-6-028-033  [P2] GAP  facet F09  effort S
- Legacy: Legacy Popconfirm opens from Reassign selected, title Reassign X of Y selected workspace(s) to mentor?, OK Reassign (reassign-mentor.js:476-489).
- vNext now: vNext ConfirmDialog title same count with new confirmLabel Reassign workspaces and description (project-mentor-reassignment.tsx:371-375).
- Fix: Match exact confirm button text, popover geometry and title; keep dialog focus/escape safety.

## G2-6-028-035  [P2] GAP  facet F09  effort S
- Legacy: Legacy filter is separate Card with AntD Select no disclosure toggle (reassign-mentor.js:390-409).
- vNext now: vNext entire filters section hidden behind Disclosure, defaultOpen only if filters provided (project-admin-reassign-mentor-page.tsx:96-132).
- Fix: Keep filters visible by default; match open/closed semantics only if legacy had collapsible control.

## G2-6-028-053  [P2] GAP  facet F16  effort M
- Legacy: Legacy uses Space wrap with minWidth 240px mentor selects and 220px role; table and Card use AntD grid (reassign-mentor.js:390-468).
- vNext now: vNext uses md:grid-cols-2 then vertical on mobile; buttons w-full on narrow screens (project-mentor-reassignment.tsx:185-219,250-304).
- Fix: Compare legacy 1280/768/375 geometry and ensure table horizontal scroll/controls touch targets.

## G2-6-028-054  [P2] GAP  facet F17  effort M
- Legacy: Legacy searchable AntD Select, Form required errors, Popconfirm focused actions (reassign-mentor.js:390-405,440-489).
- vNext now: vNext native Select with search field, checkbox labels, ConfirmDialog (project-mentor-reassignment.tsx:214-291,371-375).
- Fix: Match combobox keyboard behavior, Escape/Enter, focus return and required error announcement.

## G2-6-028-057  [P2] GAP  facet F18  effort S
- Legacy: Legacy missing scope says No college selected, Pick a college in the header to reassign its mentors. (reassign-mentor.js:339-345).
- vNext now: vNext Select a college scope, Choose a college before reassigning project mentors. (admin/projects/reassign-mentor/page.tsx:24-36).
- Fix: Restore exact strings and warning appearance.

## G2-6-028-058  [P2] GAP  facet F18  effort S
- Legacy: Legacy helper spells previous primary mentor, co-mentors/reviewers untouched, meetings cancelled, tasks cleared and notifications (reassign-mentor.js:431-439).
- vNext now: vNext shorter description behind Reassignment impact disclosure omits explicit Reviewers line (project-mentor-reassignment.tsx:306-318).
- Fix: Restore whole explanatory paragraph and keep visible without click.

## G2-6-028-059  [P2] GAP  facet F18  effort S
- Legacy: Legacy role-label validation max80 and placeholder Project Mentor (reassign-mentor.js:455-467).
- vNext now: vNext maxLength120 and no placeholder because prefilled Project Mentor (project-mentor-reassignment.tsx:52-53,292-303).
- Fix: Cap80 and render literal placeholder; blank should mean default, not error.

## G2-6-028-065  [P2] GAP  facet F20  effort M
- Legacy: Legacy result failures named using whole initial projects array; entries are raw ID:reason (reassign-mentor.js:230-241).
- vNext now: vNext failure codes map to current visible page, fallback unavailable workspace (project-mentor-reassignment.tsx:354-365,376-385).
- Fix: Resolve failures against server-side ID/title map across pages without revealing other college workspaces.

## G2-6-028-068  [P2] GAP  facet F22  effort M
- Legacy: Legacy projectIds are list of string identifiers, mentorId Integer, collegeId Integer, roleLabel String (AdminProjectBulkMentorReassignDTO.java:7-13).
- vNext now: vNext UUID college, project IDs 1..100, mentorMembershipId UUID, role label 1..120 (validation.ts:431-450).
- Fix: Document type and constraints crosswalk, guard incompatible legacy numeric IDs.

## G2-6-028-008  [P3] GAP  facet F03  effort S
- Legacy: Workload count tooltip: Flagged when a mentor's active workspace count is 50% or more above the college average. (reassign-mentor.js:172-179).
- vNext now: Overloaded badge displays via isProjectMentorOverloaded without tooltip text (project-admin-reassign-mentor-page.tsx:79-92).
- Fix: Add shared Tooltip to header; preserve literal explanation and accessible icon.

## G2-6-028-015  [P3] GAP  facet F04  effort S
- Legacy: Legacy absent current mentor displays project.mentor or em dash via textOrDash (reassign-mentor.js:301-317; adminProjectUtils.js:14-20).
- vNext now: vNext displays Unassigned when mentorName null (project-mentor-reassignment.tsx:233-237).
- Fix: Use legacy empty placeholder or document explicit change to Unassigned.

## G2-6-028-020  [P3] GAP  facet F05  effort M
- Legacy: Legacy selecting workload mentor filters project list immediately without full navigation (reassign-mentor.js:157-166).
- vNext now: vNext workload Link reloads GET with fromMentorId query (project-admin-reassign-mentor-page.tsx:81-86).
- Fix: Keep instant filter responsiveness or retain browser deep-link while preserving keyboard focus.

## G2-6-028-047  [P3] GAP  facet F13  effort S
- Legacy: Legacy scope loading shows skeleton until scopeLoaded, then warning (reassign-mentor.js:334-351).
- vNext now: vNext server route emits static empty state for no adminScope, no separate scopeLoading state (admin/projects/reassign-mentor/page.tsx:20-38).
- Fix: Provide legacy-like initial scope loader where genuinely asynchronous.

## G2-6-028-049  [P3] GAP  facet F13  effort M
- Legacy: Legacy project list loading uses AntD Skeleton paragraph rows 6 and workload rows4 (reassign-mentor.js:374-416).
- vNext now: vNext async SSR route waits read and returns sections or full error; no equivalent section skeleton in mapped page (project-admin-reassign-mentor-page.tsx:47-70).
- Fix: Match section-level skeleton shape and avoid replacing entire canvas while loading.

## G2-6-028-055  [P3] GAP  facet F17  effort S
- Legacy: Legacy AntD workload numeric column uses Tooltip + QuestionCircleOutlined for accessible description (reassign-mentor.js:172-179).
- vNext now: vNext no Tooltip on workload headings (project-admin-reassign-mentor-page.tsx:79-95).
- Fix: Add labelled tooltip trigger accessible by keyboard and screen reader.
