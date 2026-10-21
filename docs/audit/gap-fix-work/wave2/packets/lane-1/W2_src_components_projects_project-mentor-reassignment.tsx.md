# Work packet (wave 2): edit src/components/projects/project-mentor-reassignment.tsx

29 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-projects-workspaces-reassign-mentor.md, docs/audit/gap2/lane-7/u021-college-admin-mentor-reassignment.md

## G2-6-028-004  [P2] GAP  facet F02  effort M
- Legacy: Page section order: header; load-error alert; Mentor workload card; Filter by current mentor card; Select workspaces card; mentor-options alert; Reassign to new mentor card (reassign-mentor.js:355-440).
- vNext now: PageHeader and nav; collapsible Mentor workload; collapsible Filters/search; select workspaces and reassign sections (project-admin-reassign-mentor-page.tsx:71-151; project-mentor-reassignment.tsx:185-254).
- Fix: Use legacy ordered separate sections and default expansion, matching card titles and spacing.

## G2-6-028-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy filter and workspaces each separate Card; bottom form Card uses SwapOutlined extra icon (reassign-mentor.js:390-431).
- vNext now: vNext Filters disclosure and two border-bottom sections; no SwapOutlined (project-admin-reassign-mentor-page.tsx:96-132; project-mentor-reassignment.tsx:187-254).
- Fix: Clone card boundaries, header chrome, extra swap icon, and fixed panel ordering.

## G2-6-028-012  [P2] GAP  facet F04  effort S
- Legacy: Faculty options: firstName+lastName, fallback mobile or Faculty {id} (reassign-mentor.js:44-51).
- vNext now: Mentor candidate displayName, email, fallback Mentor (project-admin-reassign-mentor-page.tsx:82-88,123-125; project-mentor-reassignment.tsx:281-288).
- Fix: Match full-name fallback rules without revealing private contact beyond role permissions.

## G2-6-028-048  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty workload says No project workspaces available for this college; filter empty says No active workspaces match this filter (reassign-mentor.js:374-425).
- vNext now: vNext empty selection says No non-archived workspaces are available, workload disclosure has no empty text (project-admin-reassign-mentor-page.tsx:79-95; project-mentor-reassignment.tsx:209-213).
- Fix: Restore distinct empty messages and correct filter context.

## G2-6-028-056  [P2] GAP  facet F18  effort S
- Legacy: Legacy card titles Filter by current mentor, Select workspaces, Reassign to new mentor (reassign-mentor.js:390-431).
- vNext now: vNext collapsible Filters plus section Reassign to mentor (project-admin-reassign-mentor-page.tsx:96-132; project-mentor-reassignment.tsx:250-254).
- Fix: Use exact legacy section headings and title order.

## G2-7-021-007  [P2] GAP  facet F02  effort M
- Legacy: reassign-mentor.js:414-432 Select workspaces AntD Table Card
- vNext now: project-mentor-reassignment.tsx:185-248 scrollable checkbox list and other actions
- Fix: Restore three-column semantic table and ten-row pagination

## G2-7-021-008  [P2] GAP  facet F02  effort M
- Legacy: reassign-mentor.js:435-509 Reassign to new mentor Card with explanation, form and result
- vNext now: project-mentor-reassignment.tsx:250-393 form, collapsed impact details, result and dialogs
- Fix: Keep impact paragraph visible above form and result alert below

## G2-7-021-011  [P2] GAP  facet F03  effort M
- Legacy: reassign-mentor.js:301-334 Workspace/Current mentor/Status table and skip tag
- vNext now: project-mentor-reassignment.tsx:214-245 custom checkbox rows with inline status badge
- Fix: Match table header, mentor text, status color and skip tag

## G2-7-021-013  [P2] GAP  facet F03  effort M
- Legacy: reassign-mentor.js:445-471 New mentor searchable Select plus Role label AutoComplete
- vNext now: project-mentor-reassignment.tsx:254-304 separate Search mentors input, static select and Input
- Fix: Restore searchable target Select and one suggested role label

## G2-7-021-014  [P2] GAP  facet F03  effort S
- Legacy: reassign-mentor.js:480-494 primary Reassign selected disabled when none and icon in section heading
- vNext now: project-mentor-reassignment.tsx:325-340 Reassign N workspace(s) and no Swap icon
- Fix: Match button label, icon and disabled states

## G2-7-021-015  [P2] GAP  facet F03  effort S
- Legacy: reassign-mentor.js:498-508 closable inline success or warning Alert
- vNext now: project-mentor-reassignment.tsx:344-369 plain result section and failure Dialog
- Fix: Restore closable result alert with full counts

## G2-7-021-024  [P2] GAP  facet F05  effort M
- Legacy: reassign-mentor.js:420-427 selectable workspace table pageSize10, keeps selections across pages
- vNext now: project-mentor-reassignment.tsx:214-248 scrollable list current page, selected across pages via matchingWorkspaces
- Fix: Provide ten-row table with checkbox select across pages

## G2-7-021-030  [P2] GAP  facet F06  effort S
- Legacy: reassign-mentor.js:446-456 New mentor required, error Select a mentor
- vNext now: project-mentor-reassignment.tsx:268-289 mentor Select with empty placeholder, button disabled
- Fix: Render field error and exact placeholder Search by mentor name

## G2-7-021-031  [P2] GAP  facet F06  effort S
- Legacy: reassign-mentor.js:459-471 roleLabel optional AutoComplete default suggestion Project Mentor and max80
- vNext now: project-mentor-reassignment.tsx:52-53 default Project Mentor, :292-301 max120 plain Input
- Fix: Set 80-char limit and leave blank by default, support suggestion

## G2-7-021-034  [P2] GAP  facet F06  effort S
- Legacy: reassign-mentor.js:480-494 Reassign selected disabled when no selection or mentor options error
- vNext now: project-mentor-reassignment.tsx:325-333 disabled no selection or no mentor, ignores mentor options error
- Fix: Disable mutation on failed mentor candidate validation

## G2-7-021-044  [P2] GAP  facet F09  effort M
- Legacy: reassign-mentor.js:481-495 anchored Popconfirm Reassign X of Y selected workspace(s)...?
- vNext now: project-mentor-reassignment.tsx:371-375 ConfirmDialog full modal
- Fix: Align trigger style and confirm label Reassign

## G2-7-021-045  [P2] GAP  facet F09  effort S
- Legacy: reassign-mentor.js:435-443 effect description visible before action
- vNext now: project-mentor-reassignment.tsx:306-318 Reassignment impact collapsed details
- Fix: Expand impact by default with legacy explanation

## G2-7-021-046  [P2] GAP  facet F09  effort M
- Legacy: reassign-mentor.js:280-285 showProjectErrorMessage modal named N reassignment(s) failed
- vNext now: project-mentor-reassignment.tsx:376-392 failure Dialog with Retry failed workspaces
- Fix: Maintain named failure dialog/count and implement actionable retry

## G2-7-021-062  [P2] GAP  facet F13  effort S
- Legacy: reassign-mentor.js:428-429 No active workspaces match this filter
- vNext now: project-mentor-reassignment.tsx:209-212 No non-archived workspaces are available
- Fix: Differentiate filtered-empty and college-empty texts

## G2-7-021-070  [P2] GAP  facet F16  effort M
- Legacy: reassign-mentor.js:381-427 AntD compact tables 10 rows paged
- vNext now: project-mentor-reassignment.tsx:214-246 scroll region height22rem and no table headings
- Fix: Render responsive semantic table, avoid hiding columns

## G2-7-021-071  [P2] GAP  facet F17  effort M
- Legacy: reassign-mentor.js:336-339 AntD Table rowSelection header checkbox and tab order
- vNext now: project-mentor-reassignment.tsx:214-228 individual Checkbox and separate Select all
- Fix: Restore header select-all semantics and screen-reader count

## G2-7-021-072  [P2] GAP  facet F17  effort M
- Legacy: reassign-mentor.js:464-470 AutoComplete suggestions and role tooltip
- vNext now: project-mentor-reassignment.tsx:292-303 Input no suggestion/tooltip
- Fix: Add labelled autocomplete option and tooltip semantics

## G2-7-021-076  [P2] GAP  facet F18  effort S
- Legacy: reassign-mentor.js:435 Reassign to new mentor / :446 New mentor
- vNext now: project-mentor-reassignment.tsx:250-271 Reassign to mentor / New primary mentor
- Fix: Match both labels and icon

## G2-7-021-077  [P2] GAP  facet F18  effort S
- Legacy: reassign-mentor.js:455 Search by mentor name
- vNext now: project-mentor-reassignment.tsx:256-264 Name or email
- Fix: Restore target picker placeholder

## G2-7-021-078  [P2] GAP  facet F18  effort S
- Legacy: reassign-mentor.js:491 Reassign selected
- vNext now: project-mentor-reassignment.tsx:336-339 Reassign N workspace(s)
- Fix: Match primary CTA text

## G2-7-021-087  [P2] GAP  facet F20  effort M
- Legacy: reassign-mentor.js:241-248 failure names resolve against full project list
- vNext now: project-mentor-reassignment.tsx:355-365 resolves against current page only
- Fix: Resolve off-page failure IDs via known selection metadata

## G2-7-021-096  [P2] GAP  facet F23  effort S
- Legacy: reassign-mentor.js:435-443 full impact paragraph always visible
- vNext now: project-mentor-reassignment.tsx:306-318 impact hidden in details
- Fix: Preserve conspicuous consequences before destructive reassignment

## G2-7-021-020  [P3] GAP  facet F04  effort S
- Legacy: reassign-mentor.js:310-325 display primary mentor name or project.mentor/em dash fallback
- vNext now: project-mentor-reassignment.tsx:229-237 current mentorName or Unassigned
- Fix: Align mentor display fallback/placeholder

## G2-7-021-032  [P3] GAP  facet F06  effort S
- Legacy: reassign-mentor.js:462 tooltip role label replacement of Project Mentor
- vNext now: project-mentor-reassignment.tsx:292-303 input no helper tooltip
- Fix: Restore role-label tooltip and optional intent
