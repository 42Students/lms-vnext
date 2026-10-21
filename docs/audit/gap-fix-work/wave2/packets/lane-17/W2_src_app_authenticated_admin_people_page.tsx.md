# Work packet (wave 2): edit src/app/(authenticated)/admin/people/page.tsx

24 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/super-admin-user-admin-controller.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-8/superadmin-people.md

## G2-1-007-001  [P2] GAP  facet F01  effort M
- Legacy: `SuperAdminUserAdminController.java:132-168` GET `/faculty-admins` role/org/college filters.
- vNext now: `src/app/(authenticated)/admin/people/page.tsx:89-189`, `/admin/faculty/page.tsx:14-46` membership and faculty directories; no exact REST alias.
- Fix: Map legacy admin-account endpoint into scope-aware membership list and role filters.

## G2-1-007-006  [P2] GAP  facet F02  effort M
- Legacy: `AdminUsers.js:39-55,335-585` one Admin Users screen with role switch, form, sessions panel and history.
- vNext now: `src/app/(authenticated)/admin/people/page.tsx:89-189`, `/admin/faculty/page.tsx:14-46` split role directory, onboarding and membership detail.
- Fix: Keep legacy tab/sidebar reachability and per-account sessions panel accessible one click.

## G2-1-007-008  [P2] GAP  facet F03  effort M
- Legacy: `AdminUsers.js:40` default role ADMIN; `:18-20` role option TPO.
- vNext now: `admin/people/page.tsx:99` default ALL with role options COLLEGE_ADMIN/TPO; `admin/faculty/page.tsx:22` forced FACULTY.
- Fix: Preserve dedicated Admin/TPO management default and TPO label.

## G2-1-007-017  [P2] GAP  facet F05  effort S
- Legacy: `AdminUsers.js:39-41` role default ADMIN, fixedCollegeId from parent.
- vNext now: `admin/people/page.tsx:98-102` role ALL, no college means select safety scope.
- Fix: Show college selection before listing but preserve last Admin/TPO filter choice.

## G2-1-007-038  [P2] GAP  facet F12  effort M
- Legacy: `SuperAdminUserAdminController.java:413-420` blank role defaults ADMIN, TPO accepted, other rejected.
- vNext now: `admin/people/page.tsx:99` ALL role default for directory; create dialog multi-role.
- Fix: Make managed ADMIN role default explicit and enforce only valid choices.

## G2-1-007-046  [P2] GAP  facet F16  effort M
- Legacy: `AdminUsers.js:205-220` row actions/multi-modal patterns from AntD; responsive organization filter form.
- vNext now: `admin/people/page.tsx:140-189` responsive filters and table, `person-onboard-dialog.tsx:130-149` mobile full-width actions.
- Fix: Live visual compare 375/768/1280 for filter collapse and modal button order.

## G2-1-007-048  [P2] GAP  facet F18  effort M
- Legacy: `AdminUsers.js:17-20` exact 'TPO (Training & Placement Officer)' role label.
- vNext now: `admin/people/page.tsx:99,157` plain 'TPO' enum.
- Fix: Use legacy descriptive role copy in choice and status pill.

## G2-18-031-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy Super Admin /superadmin/people and College Admin /college-admin/people wrap shared read-only PeopleDirectory; college-admin/people.js:1-34;superadmin/people.js:1-33;PeopleDirectory.js:25-46
- vNext now: vNext /admin/people directory plus /admin/people/directory and /admin/students,/admin/faculty; src/app/(authenticated)/admin/people/page.tsx:89-184;admin/people/directory/page.tsx:59-149
- Fix: Map legacy People Directory to scoped read-only destination and preserve named entry point/link ordering

## G2-18-031-003  [P2] GAP  facet F01  effort S
- Legacy: Legacy PeopleDirectory management shortcuts Student accounts Faculty accounts Teaching assignments; PeopleDirectory.js:27-35
- vNext now: vNext /admin/people links to /admin/people/directory, scoped lists and enrollment form; admin/people/page.tsx:112-122,142-177
- Fix: Restore three legacy shortcuts in shared page-header actions and match labels/order

## G2-18-031-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy read-only PeopleDirectory description, shortcut actions, warning, then All contacts/Faculty/Students tabs; PeopleDirectory.js:25-48
- vNext now: vNext /admin/people directory separate from combined membership management, with role/status filters and table; admin/people/directory/page.tsx:59-149;admin/people/page.tsx:142-184
- Fix: Match legacy read-only directory section and three-tab strip before management actions

## G2-18-031-012  [P2] GAP  facet F03  effort M
- Legacy: Legacy student roster metrics Students Active Suspended Visible now; Students.js:1093-1100
- vNext now: vNext admin People count text N matching contacts plus role/status badges; admin/people/page.tsx:28-85,175-184
- Fix: Restore four aggregate metrics separate from filtered paged count, avoid treating page count as college total

## G2-18-031-014  [P2] GAP  facet F03  effort S
- Legacy: Legacy status Tag color orange Suspended green Active, faculty type blue tag; Students.js:949-956;Faculty.js:779-793
- vNext now: vNext StatusBadge tones success/warning/neutral for ACTIVE/SUSPENDED/ENDED and raw role badges; admin/people/page.tsx:47-70
- Fix: Copy old badge hues/text-case/radii and faculty type label mapping, keep new ENDED status distinct

## G2-18-031-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy student table Name, Roll No., Mobile, Email, Class, Gender, Status, Actions; Students.js:928-965
- vNext now: vNext /admin/people table Person+contact, Roles, Status, Actions; admin/people/page.tsx:28-87; specialized /admin/students scoped table via AdminScopedReadPage; admin/students/page.tsx:82-92
- Fix: Audit specialized student DataTable columns one by one; preserve Roll No, Class and Gender labels and placeholders

## G2-18-031-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy faculty table Name Department Mobile Email Type Gender Status Actions; Faculty.js:769-801
- vNext now: vNext generic Person/roles/status separate from academic directory and scoped faculty list; admin/people/page.tsx:28-87;admin/faculty/page.tsx:33-44
- Fix: Confirm registered faculty list shows Department Type Gender and mobile columns within authorized college only

## G2-18-031-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy Students client fetches full college roster then filters Program Batch Class Status; Students.js:72-81,116,921-928
- vNext now: vNext /admin/people server q+role+status paging 10/20/50, scoped academic list separately; admin/people/page.tsx:89-137,150-184
- Fix: Preserve four academic filters and their dependent combinations; backend paginate before rendering for large rosters

## G2-18-031-021  [P2] MISSING  facet F05  effort M
- Legacy: Legacy Students AutoComplete shows Recent/Popular suggestions and searches 15 debounced results, selection restricted to loaded college roster; Students.js:178-340
- vNext now: vNext admin search uses GET form q, max100, no autocomplete suggestions in /admin/people; admin/people/page.tsx:150-175
- Fix: Decide to restore safe scoped Recent/Popular suggestions, pending spinner and typed-clear behavior

## G2-18-031-022  [P2] GAP  facet F05  effort M
- Legacy: Legacy Students name/roll numeric sort, Faculty name sort, row Actions pinned right tablet width220; Students.js:928-965;Faculty.js:769-801
- vNext now: vNext DataTable columns and page size/paging via components; admin/people/page.tsx:28-87,183-184
- Fix: Implement stable field sort keys and sticky action width at >=tablet as old, with responsive overflow

## G2-18-031-057  [P2] GAP  facet F13  effort S
- Legacy: Legacy zero college and empty roster show warning/AntD empty table and no data; superadmin/students.js:12-24;Students.js:360-485
- vNext now: vNext empty No matching contacts/No matching users and role statuses; admin/people/page.tsx:175-184;directory/page.tsx:120-143
- Fix: Separate no-college/no-results/no-permission and retryable DB error, use exact legacy title where same

## G2-8-002-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/people.js:5-10,29`: route `/superadmin/people`, selected college from `useSuperAdminScope`, SuperAdminLayout
- vNext now: `src/app/(authenticated)/admin/people/page.tsx:89-106`: `/admin/people`, server adminScope and redirect on unauthorized
- Fix: Preserve legacy route alias or redirect and People group active tab under Super Admin navigation

## G2-8-002-002  [P2] GAP  facet F01  effort S
- Legacy: `.../superadmin/people.js:17-28`: renders SuperAdminGroupShell groupKey people with PeopleDirectory child
- vNext now: `src/app/(authenticated)/admin/people/page.tsx:140-149`: membership-management page; actual directory moved to `/admin/people/directory` (`directory/page.tsx:59-65`)
- Fix: Route People Directory tab directly to read-only directory rather than editable membership manager

## G2-8-002-003  [P2] GAP  facet F02  effort S
- Legacy: `.../superadmin/people.js:12-24`: no-scope warning only; scoped path wraps PeopleDirectory
- vNext now: `src/app/(authenticated)/admin/people/page.tsx:109-125`: no-scope PageHeader+EmptyState plus navigation to scope-free directory
- Fix: Match exact legacy warning visual and source text; preserve safe new global directory link separately

## G2-8-002-005  [P2] GAP  facet F03  effort S
- Legacy: `.../superadmin/people.js:12-19`: antd Alert type warning, showIcon; message and description
- vNext now: `src/app/(authenticated)/admin/people/page.tsx:111-124`: EmptyState, text link, no warning Alert icon
- Fix: Render shared warning banner matching old Alert icon/color/spacing in no-scope state

## G2-8-002-041  [P2] GAP  facet F18  effort S
- Legacy: `.../superadmin/people.js:14-19`: exact no-scope title/description
- vNext now: `src/app/(authenticated)/admin/people/page.tsx:113-119`: `Select a college scope` copy and alternate instruction
- Fix: Use exact legacy string constants and show new global privilege separately

## G2-18-031-017  [P3] GAP  facet F04  effort S
- Legacy: Legacy name fallback "-" and college name fallback College {id}, class fallback id or "-"; Students.js:930-945,1186-1187
- vNext now: vNext Person fallback Unnamed person, No contact detail and ENDED represented as badge; admin/people/page.tsx:35-42,49-68
- Fix: Align placeholders by field and document ID fallback differences, never leak raw UUID unintentionally
