# Work packet (wave 2): edit src/components/projects/project-create-control.tsx

29 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u028-superadmin-projects-section.md, docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md

## G2-5-028-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy top actions Refresh and Create Project. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:610-617`
- vNext now: vNext CreateProjectControl and More dropdown, no explicit top Refresh button. `src/app/(authenticated)/admin/projects/page.tsx:139-153`, `src/components/projects/project-create-control.tsx:214-225`
- Fix: Add Refresh preserving list filters and new Create action.

## G2-5-028-021  [P2] GAP  facet F06  effort M
- Legacy: Legacy title required max160, summary 3 rows, Course/Context optional. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:818-827`
- vNext now: vNext title max200, summary max2000, no inline Course/Context field (template overview). `src/components/projects/project-create-control.tsx:251-294`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectCreateDTO.java:14-21`
- Fix: Match max160 or approved data migration and expose context.

## G2-5-028-026  [P2] GAP  facet F06  effort M
- Legacy: Legacy existing mentor/learner lists populated from project, defaults replaceExisting:true. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:232-257`
- vNext now: vNext create assigns memberships; replacing allocation happens on team page. `src/components/projects/project-create-control.tsx:43-58`, `src/modules/projects/member-service.ts:69-119`
- Fix: Prepopulate edit dialogs from existing team and preserve replace semantics.

## G2-5-028-041  [P2] GAP  facet F09  effort M
- Legacy: Legacy 760px Create Project modal with 12 fields. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:800-887`
- vNext now: vNext template-based Create dialog with fewer editable lifecycle fields. `src/components/projects/project-create-control.tsx:229-380`
- Fix: Match modal size, field order and validation UI.

## G2-5-028-061  [P2] GAP  facet F16  effort M
- Legacy: Legacy table x=1200 and 760px project modal; drawer width520. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:657-674,800-814`
- vNext now: vNext cards and responsive md grid, modal shared Dialog. `src/components/projects/project-admin-workspace-list.tsx:80-136`, `src/components/projects/project-create-control.tsx:229-230`
- Fix: Compare 375/768/1280 table overflow, dialog dimensions, drawer.

## G2-5-028-063  [P2] GAP  facet F17  effort M
- Legacy: Legacy destructive removal names learners for informed consent. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:313-328`
- vNext now: vNext learner checkboxes expose names/roll, but no replacement consent. `src/components/projects/project-create-control.tsx:340-359`
- Fix: Announce removal names/count with accessible list in ConfirmDialog.

## G2-5-028-065  [P2] GAP  facet F18  effort M
- Legacy: Legacy primary button `Create Project`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:614-615`
- vNext now: vNext disabled `No assigned templates` if none; otherwise create action. `src/components/projects/project-create-control.tsx:214-225`
- Fix: Retain label and explain template prerequisite separately.

## G2-5-028-068  [P2] GAP  facet F19  effort M
- Legacy: Legacy remote search select queries college faculty/learners/classes on every focus and search. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:91-134,183-213`
- vNext now: vNext mentor candidates limited100 and class roster fetched only on class selection. `src/components/projects/project-create-control.tsx:82-149`
- Fix: Paginate/remote search candidates above 100.

## G2-7-020-005  [P2] GAP  facet F01  effort S
- Legacy: new.js:360-371 navigate to /{id}/summary on single success
- vNext now: project-create-control.tsx:193-201 navigate /{id}
- Fix: Navigate directly to Summary with safe missing-ID fallback

## G2-7-020-007  [P2] GAP  facet F02  effort M
- Legacy: new.js:454-602 fields title, summary, status, template, mentor, class, students, submit in order
- vNext now: project-create-control.tsx:229-396 template, title, slug, summary, mentor, class, status, students
- Fix: Match form order and spacing, avoid unrelated slug prerequisite

## G2-7-020-011  [P2] GAP  facet F03  effort S
- Legacy: new.js:455-464 workspace title with live max160 counter
- vNext now: project-create-control.tsx:252-263 project title max200 without counter
- Fix: Use exact label, counter and 160 max

## G2-7-020-013  [P2] GAP  facet F03  effort M
- Legacy: new.js:491-513 Template searchable with loading and version label
- vNext now: project-create-control.tsx:231-251 static Select, version label
- Fix: Add debounced server-side template search and loading state

## G2-7-020-014  [P2] GAP  facet F03  effort M
- Legacy: new.js:515-531 mentor searchable and conditional helper text
- vNext now: project-create-control.tsx:295-323 static mentor Select and Assign later
- Fix: Restore faculty lookup and required-state copy

## G2-7-020-015  [P2] GAP  facet F03  effort M
- Legacy: new.js:559-594 Students multi-select plus add-whole-class select
- vNext now: project-create-control.tsx:340-359 class roster checkbox list
- Fix: Restore direct student search and add-class shortcut

## G2-7-020-016  [P2] GAP  facet F03  effort S
- Legacy: new.js:596-599 Create workspace or Create workspaces for class or Create N team workspaces
- vNext now: project-create-control.tsx:381-394 Create Project; class-team-workspace-creator.tsx:309-313 different labels
- Fix: Match each legacy submit caption

## G2-7-020-019  [P2] GAP  facet F04  effort S
- Legacy: new.js:132-138 faculty option Name · ID
- vNext now: project-create-control.tsx:311-318 mentor displayName · email
- Fix: Match display ID and avoid unnecessary email exposure

## G2-7-020-021  [P2] GAP  facet F04  effort S
- Legacy: new.js:150-156 student full name · Roll or ID fallback
- vNext now: project-create-control.tsx:350-357 displayName · rollNumber without fallback
- Fix: Add ID fallback for missing roll number

## G2-7-020-030  [P2] GAP  facet F06  effort S
- Legacy: new.js:466-468 Summary optional rows3, Short live workspace summary
- vNext now: project-create-control.tsx:282-294 summary optional max2000, other placeholder
- Fix: Align placeholder, height and limits

## G2-7-020-033  [P2] GAP  facet F06  effort S
- Legacy: new.js:515-531 mentor required iff ACTIVE, otherwise optional searchable
- vNext now: project-create-control.tsx:295-339 optional until ACTIVE chosen, ACTIVE disabled
- Fix: Match conditional validation wording and dynamic label

## G2-7-020-036  [P2] GAP  facet F06  effort M
- Legacy: new.js:577-594 Add a whole class picker appends roster to selected students
- vNext now: project-create-control.tsx:344-355 Whole class selects current section roster
- Fix: Allow one-shot add to selection with subsequent manual removal

## G2-7-020-080  [P2] GAP  facet F16  effort M
- Legacy: new.js:401-409 Space wraps header action and vertical AntD Form
- vNext now: create/page.tsx:20-29 header; project-create-control.tsx:229-230 two columns at md
- Fix: Use legacy vertical form layout at 375/768/1280

## G2-7-020-083  [P2] GAP  facet F17  effort M
- Legacy: new.js:455-599 AntD Form.Item field validation messages
- vNext now: project-create-control.tsx:229-396 label wrappers and global alert errors
- Fix: Associate field validation errors to inputs and focus first error

## G2-7-020-087  [P2] GAP  facet F18  effort S
- Legacy: new.js:456,463 Workspace title / Campus Event Coordination
- vNext now: project-create-control.tsx:254-262 Project title / Campus placement portal
- Fix: Restore exact label and placeholder

## G2-7-020-088  [P2] GAP  facet F18  effort S
- Legacy: new.js:491-513 Template / Search by template title
- vNext now: project-create-control.tsx:231-251 Assigned template without search
- Fix: Restore label and placeholder

## G2-7-020-089  [P2] GAP  facet F18  effort S
- Legacy: new.js:515-531 Mentor / Required — search by faculty name
- vNext now: project-create-control.tsx:295-323 Primary mentor / Assign later
- Fix: Restore exact helper and conditional label

## G2-7-020-090  [P2] GAP  facet F18  effort S
- Legacy: new.js:559-590 Students / Or add a whole class / Pick a section to add its students
- vNext now: project-create-control.tsx:340-359 Students selected / Whole class / Clear
- Fix: Restore three old labels and controls

## G2-7-020-091  [P2] GAP  facet F18  effort S
- Legacy: new.js:596-599 Create workspace and :361 Workspace created toast
- vNext now: project-create-control.tsx:393-394 Create Project and :193-198 Project created
- Fix: Use Workspace naming for submit and toast

## G2-7-020-102  [P2] GAP  facet F21  effort M
- Legacy: new.js:186-246 remote integrations for templates/faculty/classes/learners
- vNext now: project-create-control.tsx:78-150 mentor/class/roster APIs, class-team-workspace-creator.tsx:61-119 roster/preflight
- Fix: Provide equivalent searchable integration for each field

## G2-7-020-012  [P3] GAP  facet F03  effort S
- Legacy: new.js:466-468 Summary textarea rows3 and example
- vNext now: project-create-control.tsx:282-294 different placeholder and no explicit three rows
- Fix: Match textarea height and example
