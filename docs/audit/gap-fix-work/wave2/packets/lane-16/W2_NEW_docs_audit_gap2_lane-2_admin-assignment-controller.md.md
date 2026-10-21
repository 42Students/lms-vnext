# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/admin-assignment-controller.md

37 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-assignment-controller.md

## G2-2-007-001  [P2] GAP  facet F01  effort S
- Legacy: LC:43-48 GET /api/v1/admin/assignments; LF:25-28 content group shell /college-admin/assignments
- vNext now: NC:17-44 /college/assignments; NA:15-63 /admin/assignments
- Fix: Maintain navigation alias/redirect for existing deep links; preserve shell placement.

## G2-2-007-003  [P2] GAP  facet F02  effort S
- Legacy: LL:384-430 title, selectors/actions, table and pagination, modals
- vNext now: NV:75-205 heading, create section, filters, summary tiles, records; NN:31-116 card directory
- Fix: Reproduce old table/filter/CTA hierarchy without discarding current auth.

## G2-2-007-004  [P2] GAP  facet F02  effort S
- Legacy: LL:401-423 filters left and create/export right immediately above table
- vNext now: NA:50-60 create before card directory and export at bottom
- Fix: Move create/export to legacy top action row.

## G2-2-007-005  [P2] GAP  facet F03  effort S
- Legacy: LL:416-418 Create Assignment, Export CSV (page) buttons
- vNext now: NV:85-99 Export CSV plus additional View quizzes/Course catalogue; NP under leading
- Fix: Restore exact two primary actions at top; optional links elsewhere.

## G2-2-007-006  [P2] GAP  facet F03  effort S
- Legacy: LL:361-379 Submissions/Publish grades/Edit/Delete per-row
- vNext now: NN:76-106 edit, disclose submissions, transitions, offering-builder link
- Fix: Make grading/publishing/edit/delete primary row actions in legacy order.

## G2-2-007-007  [P2] GAP  facet F03  effort S
- Legacy: LL:385-425 compact AntD Table with 7 columns
- vNext now: NN:63-107 article cards, not table; NV:205-318 desktop table
- Fix: Super Admin should use same compact table as legacy; preserve accessible mobile cards.

## G2-2-007-008  [P2] GAP  facet F04  effort S
- Legacy: LC:117-128 id,title,courseId,lessonId,description,classId,facultyId,points,deadline,updatedAt
- vNext now: NS:97-108 result has id,title,courseName/courseCode,lessonName,offering,status,dueAt,deliveryId,points; omits facultyId,updatedAt
- Fix: Provide assignment creator/updated timestamp or confirm deliberate omission.

## G2-2-007-010  [P2] GAP  facet F04  effort S
- Legacy: LC:120-122 lessonId needed for edit fixed selector
- vNext now: NW:81-95 loads assignment settings; NN:103-105 offering builder link
- Fix: Supply lesson/section identity to edit builder without a second ambiguous selection.

## G2-2-007-011  [P2] GAP  facet F04  effort S
- Legacy: LL:343-357 columns Title,Course,Scope,Points,Deadline,Submissions
- vNext now: NN:65-75 title/course/lesson/audience/points/due/submissions separate blocks
- Fix: Align field order and legacy badge wording.

## G2-2-007-012  [P2] GAP  facet F05  effort S
- Legacy: LC:93-98 filters collegeId required, optional courseId,classId,page,size
- vNext now: NM:7-19 q,status,courseCode,periodCode,cohortCode,programCode,scope,duePresence,window,page
- Fix: Restore select-based course/section exact filter and preserve new facets separately.

## G2-2-007-014  [P2] GAP  facet F05  effort S
- Legacy: LL:269-282 resets page 1 on filter changes, GET page-1, 20 per page
- vNext now: NM:3 pageSize25, page1-based, NS:121-125 offset page-1
- Fix: Restore 20-per-page and reset page on course/section change.

## G2-2-007-015  [P2] GAP  facet F05  effort S
- Legacy: LC:106-108 backend page default 0, size20, cap100
- vNext now: NM:3 fixed25, NM:18 page max1000
- Fix: If old API clients need size, support bounded page size max100.

## G2-2-007-018  [P2] GAP  facet F06  effort S
- Legacy: LC:99-100 rejects nonpositive collegeId with error body
- vNext now: NC:20-21 requires membership; NA:32-35 selects scope in header
- Fix: Use scoped context and map missing/invalid college to legacy-visible warning.

## G2-2-007-019  [P2] GAP  facet F06  effort S
- Legacy: LL:404-413 searchable course/class selects, allow clear
- vNext now: NN:34-60 separate search text/status/course code, non-searchable audience enum
- Fix: Restore selectable course and section widgets with loading/disabled states.

## G2-2-007-027  [P2] GAP  facet F09  effort S
- Legacy: LL:87-157 Submissions Modal width 760 and paged student list
- vNext now: NN:79-84 Disclosure with CollegeAssignmentReview and faculty review controls
- Fix: Restore centered submissions dialog or document open inline review change.

## G2-2-007-028  [P2] GAP  facet F09  effort S
- Legacy: LL:365-377 Popconfirm publish/delete with reasons
- vNext now: NW:50-55 native window.confirm
- Fix: Use accessible shared confirmation dialog with exact copy.

## G2-2-007-029  [P2] GAP  facet F09  effort S
- Legacy: LL:427-430 AdminAssignmentBuilderModal on create/edit
- vNext now: NA:52-54 inline CollegeAssignmentCreate and NN:77 actions
- Fix: Restore builder modal parity with tabbed resources and keyboard focus management.

## G2-2-007-030  [P2] GAP  facet F10  effort S
- Legacy: LC:91-149 single GET list returns response nested data.content totals/size/page flags
- vNext now: NS:47-127 server service returns items,total,page/size plus derived stats
- Fix: Publish versioned API schema and migrate consumers expecting PageResponseDTO.

## G2-2-007-031  [P2] GAP  facet F10  effort S
- Legacy: LA:20-38 fetch submissions/update grade/publish one/publish all routes
- vNext now: NR:29-70 learner submissions paged then POST /api/courses/assignment-submissions/{id}/publish
- Fix: Preserve whole-assignment publishing intent; account for multiple Section deliveries.

## G2-2-007-033  [P2] GAP  facet F10  effort S
- Legacy: LL:316-326 deletion calls deleteLessonContent
- vNext now: NW:50-55 assignment transition ARCHIVE
- Fix: Map legacy soft-delete and submission safety; preserve archived rows as intended.

## G2-2-007-034  [P2] GAP  facet F11  effort S
- Legacy: LC:102-110 requirePerformAdminActionForCollege and requireAccessClass
- vNext now: NS:53-73 requirePermission courses.read with active membership/SuperAdmin scope
- Fix: Verify read vs admin mutation permission and selected-class rights when adding exact section filter.

## G2-2-007-036  [P2] GAP  facet F11  effort S
- Legacy: LC:47 @CrossOrigin localhost/42lms wildcard with credentials
- vNext now: NC/NA:server components; credentialed cross-origin REST endpoint not exposed
- Fix: Do not reopen CORS without need; document REST contract change.

## G2-2-007-039  [P2] GAP  facet F12  effort S
- Legacy: LL:361-379 actions disabled based on stats totalGraded and concurrency
- vNext now: NR:91-94 Publish grades only for status PUBLISHED; no zero-graded disable
- Fix: Disable publish when no graded eligible submissions; provide tooltip Nothing graded yet.

## G2-2-007-041  [P2] MISSING  facet F13  effort S
- Legacy: LL:391-400 course/section load failures independently retry
- vNext now: NN:34-60 SSR filters; no independent course/class fetch or retry
- Fix: Add discrete option load error states if implementing select filters.

## G2-2-007-043  [P2] GAP  facet F13  effort S
- Legacy: LL:93-99 'Unable to load submissions', Retry, 'No submissions yet'
- vNext now: NR:37-70 error as 'Could not load all submissions...'
- Fix: Provide row-level submissions retry and exact zero-state copy.

## G2-2-007-044  [P2] GAP  facet F14  effort S
- Legacy: LL:329-340 exports current PAGE CSV `assignments-college-<id>-page-<page>.csv`, 8 columns
- vNext now: NE:4-23 exports up to 1000 filtered records, 12 columns including UTC timestamp
- Fix: Offer page-only CSV with exact filename,column headings,IST formatted deadline.

## G2-2-007-048  [P2] GAP  facet F16  effort S
- Legacy: LL:361 fixed actions right on md; 423 Table horizontal x max-content
- vNext now: NN:63-107 cards responsive, NV:214-318 mobile cards
- Fix: Compare desktop fixed-actions table/mobile overflow; preserve accessible mobile presentation.

## G2-2-007-054  [P2] GAP  facet F19  effort S
- Legacy: LC:106-108 size min100; totalElements/pageFlags always returned
- vNext now: NM:18 page max1000, NS:119-125 fixed25 and total count
- Fix: Support bounded variable pageSize only if external API clients require it.

## G2-2-007-057  [P2] GAP  facet F20  effort S
- Legacy: LL:329-340 exports local IST wall-clock with formatWallClock
- vNext now: NE:15-23 exports UTC ISO due date
- Fix: Emit IST date+time matching legacy CSV, not UTC ISO.

## G2-2-007-060  [P2] GAP  facet F22  effort S
- Legacy: LC:115-129 LessonContents fields and stats DTO contract
- vNext now: NB:26-74 separate courseAssignments, NB:137-200 assignmentSubmissions
- Fix: Map historic assignment & submission identities/fields through migration contract.

## G2-2-007-061  [P2] GAP  facet F22  effort S
- Legacy: LC:140-148 PageResponseDTO has content,totalElements,totalPages,size,number,first,last
- vNext now: NS:47-127 internal result items,total,page/pageSize/totalPages
- Fix: Document paged REST JSON schema break for any remaining clients.

## G2-2-007-064  [P2] GAP  facet F23  effort S
- Legacy: LL:427-430 full edit builder and submissions modal
- vNext now: NN:76-106 inline Disclosure and offering editor navigation
- Fix: Record changed workflow; restore detail/modal if strict clone.

## G2-2-007-042  [P3] GAP  facet F13  effort S
- Legacy: LL:421-425 'Assignments could not be loaded', Retry and 'No assignments found for this college'
- vNext now: NA:42-48 failure with Retry, NN:108 empty matches
- Fix: Use exact legacy empty/error wording by context.

## G2-2-007-045  [P3] GAP  facet F14  effort S
- Legacy: LL:418 disabled Export CSV (page) on empty assignments
- vNext now: NV:87-90 export link available regardless of rows
- Fix: Disable empty export or present clear empty export message.

## G2-2-007-050  [P3] GAP  facet F17  effort S
- Legacy: LL:372-377 accessible Edit/Delete aria labels include assignment title
- vNext now: NW:75-103 plain Edit/Delete buttons inside per-card context
- Fix: Ensure repeated controls have assignment-specific accessible label.

## G2-2-007-051  [P3] GAP  facet F18  effort S
- Legacy: LL:384-418 exact 'Create Assignment', 'Export CSV (page)', 'All courses','All scopes'
- vNext now: NA:59-60 'Export'; NN:47 'Course code'; NN:50 'Audience'
- Fix: Restore exact copy, placeholders and CTA names.

## G2-2-007-052  [P3] GAP  facet F18  effort S
- Legacy: LL:355-357 submitted/graded chips; no status column
- vNext now: NN:67 StatusBadge and :73-75 raw submission count; no combined chips
- Fix: Restore combined `n/m submitted` and `n graded` chips.
