# U007 — AdminAssignmentController gap audit v2

## File mapping and closure
- `LC` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java`
- `LL` = `docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js`
- `LF` = `docs/legacy-source/frontend/src/pages/college-admin/assignments.js`
- `LA` = `docs/legacy-source/frontend/src/api/Services/AdminAssignmentService.js`
- `LP` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LessonContentsRepository.java`
- `NC` = `src/app/(authenticated)/college/assignments/page.tsx`
- `NA` = `src/app/(authenticated)/admin/assignments/page.tsx`
- `NS` = `src/modules/courses/college-assessment-aggregate-service.ts`
- `NM` = `src/modules/courses/college-assessment-aggregate-model.ts`
- `NV` = `src/components/courses/college-assessment-aggregate.tsx`
- `NN` = `src/components/courses/admin-assessment-read-directory.tsx`
- `NR` = `src/components/courses/college-assignment-review.tsx`
- `NW` = `src/components/courses/college-assignment-actions.tsx`
- `NE` = `src/modules/courses/college-assessment-export-model.ts`
- `NB` = `src/db/schema/assessments.ts`

Closure: Spring GET oversight controller + LessonContentsRepository/AssignmentService and DTO; College Admin/Super Admin legacy assignment listing and API adapter, submissions modal, grade/publish/delete, CSV; vNext college/admin routes, scoped aggregate service and model, list UI, grading review/visibility, actions and CSV. All aliases in rows denote full path:1-based line evidence. U006 audits the separate assignment creation writer; this unit focuses list/oversight, not repeating its builder internal validation.

## All 23 facets
| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-007-001 | F01 | LC:43-48 GET /api/v1/admin/assignments; LF:25-28 content group shell /college-admin/assignments | NC:17-44 /college/assignments; NA:15-63 /admin/assignments | GAP | P2 | Maintain navigation alias/redirect for existing deep links; preserve shell placement. | S |
| G2-2-007-002 | F01 | LC:35-41 college-wide oversight not faculty-specific | NS:47-73 resolves college and scopes all assignments | MATCH | P3 | No fix. | S |
| G2-2-007-003 | F02 | LL:384-430 title, selectors/actions, table and pagination, modals | NV:75-205 heading, create section, filters, summary tiles, records; NN:31-116 card directory | GAP | P2 | Reproduce old table/filter/CTA hierarchy without discarding current auth. | S |
| G2-2-007-004 | F02 | LL:401-423 filters left and create/export right immediately above table | NA:50-60 create before card directory and export at bottom | GAP | P2 | Move create/export to legacy top action row. | S |
| G2-2-007-005 | F03 | LL:416-418 Create Assignment, Export CSV (page) buttons | NV:85-99 Export CSV plus additional View quizzes/Course catalogue; NP under leading | GAP | P2 | Restore exact two primary actions at top; optional links elsewhere. | S |
| G2-2-007-006 | F03 | LL:361-379 Submissions/Publish grades/Edit/Delete per-row | NN:76-106 edit, disclose submissions, transitions, offering-builder link | GAP | P2 | Make grading/publishing/edit/delete primary row actions in legacy order. | S |
| G2-2-007-007 | F03 | LL:385-425 compact AntD Table with 7 columns | NN:63-107 article cards, not table; NV:205-318 desktop table | GAP | P2 | Super Admin should use same compact table as legacy; preserve accessible mobile cards. | S |
| G2-2-007-008 | F04 | LC:117-128 id,title,courseId,lessonId,description,classId,facultyId,points,deadline,updatedAt | NS:97-108 result has id,title,courseName/courseCode,lessonName,offering,status,dueAt,deliveryId,points; omits facultyId,updatedAt | GAP | P2 | Provide assignment creator/updated timestamp or confirm deliberate omission. | S |
| G2-2-007-009 | F04 | LC:129-137 per-assignment stats with fallback stats:null if error | NS:180-197 batched submission count, NS:199-240 eligibility & grade counts; errors currently propagate | GAP | P1 | Isolate per-assignment stats failures so one bad row does not blank directory. | S |
| G2-2-007-010 | F04 | LC:120-122 lessonId needed for edit fixed selector | NW:81-95 loads assignment settings; NN:103-105 offering builder link | GAP | P2 | Supply lesson/section identity to edit builder without a second ambiguous selection. | S |
| G2-2-007-011 | F04 | LL:343-357 columns Title,Course,Scope,Points,Deadline,Submissions | NN:65-75 title/course/lesson/audience/points/due/submissions separate blocks | GAP | P2 | Align field order and legacy badge wording. | S |
| G2-2-007-012 | F05 | LC:93-98 filters collegeId required, optional courseId,classId,page,size | NM:7-19 q,status,courseCode,periodCode,cohortCode,programCode,scope,duePresence,window,page | GAP | P2 | Restore select-based course/section exact filter and preserve new facets separately. | S |
| G2-2-007-013 | F05 | LL:403-413 course autocomplete then class select disabled until course selected | NV:129-151 course-code input, audience broad enum, no per-class picker | MISSING | P1 | Add specific section picker constrained to selected course. | S |
| G2-2-007-014 | F05 | LL:269-282 resets page 1 on filter changes, GET page-1, 20 per page | NM:3 pageSize25, page1-based, NS:121-125 offset page-1 | GAP | P2 | Restore 20-per-page and reset page on course/section change. | S |
| G2-2-007-015 | F05 | LC:106-108 backend page default 0, size20, cap100 | NM:3 fixed25, NM:18 page max1000 | GAP | P2 | If old API clients need size, support bounded page size max100. | S |
| G2-2-007-016 | F05 | LL:423 Table initial order data from repository, no client sort | NS:121-124 orders dueAt DESC,title ASC,id ASC | UNKNOWN | P2 | Read LP findAssignmentsByCollegePaged ORDER BY and verify exact sort; do not invent legacy default. | S |
| G2-2-007-017 | F05 | LL:408-413 class options sorted alphabetically, class filter exact ID | NM:13 scope SHARED/SECTION not exact section ID | GAP | P1 | Add class/sectionId exact filtering across assignments and stats. | S |
| G2-2-007-018 | F06 | LC:99-100 rejects nonpositive collegeId with error body | NC:20-21 requires membership; NA:32-35 selects scope in header | GAP | P2 | Use scoped context and map missing/invalid college to legacy-visible warning. | S |
| G2-2-007-019 | F06 | LL:404-413 searchable course/class selects, allow clear | NN:34-60 separate search text/status/course code, non-searchable audience enum | GAP | P2 | Restore selectable course and section widgets with loading/disabled states. | S |
| G2-2-007-020 | F06 | LL:114-128 grade InputNumber min0 max assignment.points | NR:13-104 subreview uses scoped FacultyAssignmentReview | UNKNOWN | P2 | Inspect FacultyAssignmentReview score validation and test max points before claiming exact parity. | S |
| G2-2-007-021 | F07 | LC:100 'collegeId must be a positive integer' | NA:32-35 'Select a college to continue'; NC:21 missing scope component | GAP | P3 | Keep accessible missing-scope state; document changed error body. | S |
| G2-2-007-022 | F07 | LC:81-88 rejects cross-scoped superadmin with two distinct messages | NS:53-59 scoped superadmin only; authorization errors generic | GAP | P2 | Map college-vs-org denial safely and do not disclose other college data. | S |
| G2-2-007-023 | F07 | LC:150-152 catch all returns 500 'Failed to fetch assignments' | NA:42-48 'Assignments unavailable' and Retry | GAP | P2 | Keep full error details in logs and scoped retry UI; preserve consistent generic message. | S |
| G2-2-007-024 | F08 | LC:149 success 'Assignments fetched successfully' | NS:47-127 internal service; NC:37-43 SSR result without success message | GAP | P3 | N/A toast for list retrieval; API contract changed. | S |
| G2-2-007-025 | F08 | LL:295-313 publish all result counts + individual failed students in warning Modal | NR:29-70 publishes per Section, returns published/failed counts inline | GAP | P2 | Align failures report and per-college cross-section semantics. | S |
| G2-2-007-026 | F08 | LL:316-326 delete toast 'Assignment deleted' or 'Failed to delete assignment' | NW:67-69 'Assignment deleted.' or generic error | GAP | P3 | Restore exact toast copy. | S |
| G2-2-007-027 | F09 | LL:87-157 Submissions Modal width 760 and paged student list | NN:79-84 Disclosure with CollegeAssignmentReview and faculty review controls | GAP | P2 | Restore centered submissions dialog or document open inline review change. | S |
| G2-2-007-028 | F09 | LL:365-377 Popconfirm publish/delete with reasons | NW:50-55 native window.confirm | GAP | P2 | Use accessible shared confirmation dialog with exact copy. | S |
| G2-2-007-029 | F09 | LL:427-430 AdminAssignmentBuilderModal on create/edit | NA:52-54 inline CollegeAssignmentCreate and NN:77 actions | GAP | P2 | Restore builder modal parity with tabbed resources and keyboard focus management. | S |
| G2-2-007-030 | F10 | LC:91-149 single GET list returns response nested data.content totals/size/page flags | NS:47-127 server service returns items,total,page/size plus derived stats | GAP | P2 | Publish versioned API schema and migrate consumers expecting PageResponseDTO. | S |
| G2-2-007-031 | F10 | LA:20-38 fetch submissions/update grade/publish one/publish all routes | NR:29-70 learner submissions paged then POST /api/courses/assignment-submissions/{id}/publish | GAP | P2 | Preserve whole-assignment publishing intent; account for multiple Section deliveries. | S |
| G2-2-007-032 | F10 | LC:129-137 catch stats exception individually, return stats:null | NS:180-197 group query failure rejects whole directory | GAP | P1 | Make counts best-effort per row or distinguish total query failure from row failure. | S |
| G2-2-007-033 | F10 | LL:316-326 deletion calls deleteLessonContent | NW:50-55 assignment transition ARCHIVE | GAP | P2 | Map legacy soft-delete and submission safety; preserve archived rows as intended. | S |
| G2-2-007-034 | F11 | LC:102-110 requirePerformAdminActionForCollege and requireAccessClass | NS:53-73 requirePermission courses.read with active membership/SuperAdmin scope | GAP | P2 | Verify read vs admin mutation permission and selected-class rights when adding exact section filter. | S |
| G2-2-007-035 | F11 | LC:73-89 superadmin with college/org scope cannot query elsewhere | NS:53-59 uses selected adminScope college | MATCH | P3 | No change; keep selected scope server-derived. | S |
| G2-2-007-036 | F11 | LC:47 @CrossOrigin localhost/42lms wildcard with credentials | NC/NA:server components; credentialed cross-origin REST endpoint not exposed | GAP | P2 | Do not reopen CORS without need; document REST contract change. | S |
| G2-2-007-037 | F12 | LC:35-41 college-wide list plus graded stats; not faculty-only | NS:47-127 college scoped, NS:180-235 aggregate stats | MATCH | P3 | No change. | S |
| G2-2-007-038 | F12 | LC:132-137 orphan/stale class stats failure isolated as Unavailable | NS:180-240 counts join authorized/current roster; no per-row fallback | GAP | P1 | Render Unavailable for broken per-row statistics instead of claiming zero. | S |
| G2-2-007-039 | F12 | LL:361-379 actions disabled based on stats totalGraded and concurrency | NR:91-94 Publish grades only for status PUBLISHED; no zero-graded disable | GAP | P2 | Disable publish when no graded eligible submissions; provide tooltip Nothing graded yet. | S |
| G2-2-007-040 | F13 | LF:11-21 'Admin not assigned to a college' warning | NC:21 uses CollegeCourseMissingScope; unknown exact wording | UNKNOWN | P2 | Inspect scoped missing-component wording live; ensure same contact-administrator guidance. | S |
| G2-2-007-041 | F13 | LL:391-400 course/section load failures independently retry | NN:34-60 SSR filters; no independent course/class fetch or retry | MISSING | P2 | Add discrete option load error states if implementing select filters. | S |
| G2-2-007-042 | F13 | LL:421-425 'Assignments could not be loaded', Retry and 'No assignments found for this college' | NA:42-48 failure with Retry, NN:108 empty matches | GAP | P3 | Use exact legacy empty/error wording by context. | S |
| G2-2-007-043 | F13 | LL:93-99 'Unable to load submissions', Retry, 'No submissions yet' | NR:37-70 error as 'Could not load all submissions...' | GAP | P2 | Provide row-level submissions retry and exact zero-state copy. | S |
| G2-2-007-044 | F14 | LL:329-340 exports current PAGE CSV `assignments-college-<id>-page-<page>.csv`, 8 columns | NE:4-23 exports up to 1000 filtered records, 12 columns including UTC timestamp | GAP | P2 | Offer page-only CSV with exact filename,column headings,IST formatted deadline. | S |
| G2-2-007-045 | F14 | LL:418 disabled Export CSV (page) on empty assignments | NV:87-90 export link available regardless of rows | GAP | P3 | Disable empty export or present clear empty export message. | S |
| G2-2-007-046 | F15 | LC:91-154 list read does not send notifications/email | NS:47-127 list read no outgoing provider writes | MATCH | P3 | N/A event dispatch for list. | S |
| G2-2-007-047 | F15 | LL:295-313 publish grades triggers learner result visibility | NR:48-65 POST publish per submission, version token | MATCH | P3 | Preserve grade publication notifications per underlying service; validate externally. | S |
| G2-2-007-048 | F16 | LL:361 fixed actions right on md; 423 Table horizontal x max-content | NN:63-107 cards responsive, NV:214-318 mobile cards | GAP | P2 | Compare desktop fixed-actions table/mobile overflow; preserve accessible mobile presentation. | S |
| G2-2-007-049 | F17 | LL:112-130 numeric input aria-label `Points for <name>` and confirm | NR:88-90 FacultyAssignmentReview delegated; direct code not in current closure | UNKNOWN | P2 | Inspect delegated review accessibility and keyboard controls before declaring match. | S |
| G2-2-007-050 | F17 | LL:372-377 accessible Edit/Delete aria labels include assignment title | NW:75-103 plain Edit/Delete buttons inside per-card context | GAP | P3 | Ensure repeated controls have assignment-specific accessible label. | S |
| G2-2-007-051 | F18 | LL:384-418 exact 'Create Assignment', 'Export CSV (page)', 'All courses','All scopes' | NA:59-60 'Export'; NN:47 'Course code'; NN:50 'Audience' | GAP | P3 | Restore exact copy, placeholders and CTA names. | S |
| G2-2-007-052 | F18 | LL:355-357 submitted/graded chips; no status column | NN:67 StatusBadge and :73-75 raw submission count; no combined chips | GAP | P3 | Restore combined `n/m submitted` and `n graded` chips. | S |
| G2-2-007-053 | F19 | LC:50-52 cap100 to bound N+1 per-record stats calls | NS:180-197 batched grouped counts, NM:3 25/page | EXTRA | P3 | Keep efficient batching; document changed paging contract. | S |
| G2-2-007-054 | F19 | LC:106-108 size min100; totalElements/pageFlags always returned | NM:18 page max1000, NS:119-125 fixed25 and total count | GAP | P2 | Support bounded variable pageSize only if external API clients require it. | S |
| G2-2-007-055 | F20 | LL:263-287 request token guards stale filter request results | NC/NA:server render per navigation; no client request races in directory | EXTRA | P3 | Keep SSR race avoidance, maintain URL search contract. | S |
| G2-2-007-056 | F20 | LC:129-137 stats exception isolates row | NS:180-240 aggregate/grouped counts can throw and reject entire page | GAP | P1 | Provide partial stats fallback or explicit degraded mode with rows intact. | S |
| G2-2-007-057 | F20 | LL:329-340 exports local IST wall-clock with formatWallClock | NE:15-23 exports UTC ISO due date | GAP | P2 | Emit IST date+time matching legacy CSV, not UTC ISO. | S |
| G2-2-007-058 | F21 | LC:58 AssignmentService per-ID stats, LP repo paged assignments query | NS:75-127 Drizzle scoped joins; NS:180-235 grouped counts | EXTRA | P3 | Keep centralized/batched DB query and scoped joins. | S |
| G2-2-007-059 | F21 | LC:91-154 no external provider/job calls | NS:47-127 no external provider/job calls | MATCH | P3 | N/A background sync or integration. | S |
| G2-2-007-060 | F22 | LC:115-129 LessonContents fields and stats DTO contract | NB:26-74 separate courseAssignments, NB:137-200 assignmentSubmissions | GAP | P2 | Map historic assignment & submission identities/fields through migration contract. | S |
| G2-2-007-061 | F22 | LC:140-148 PageResponseDTO has content,totalElements,totalPages,size,number,first,last | NS:47-127 internal result items,total,page/pageSize/totalPages | GAP | P2 | Document paged REST JSON schema break for any remaining clients. | S |
| G2-2-007-062 | F23 | LL:384-425 compact table, no separate summary tiles nor status filter | NV:195-203 summary tiles + status/due filters | EXTRA | P3 | Keep additional insights if approved but restore overall legacy hierarchy. | S |
| G2-2-007-063 | F23 | LL:408-413 exact selected Section filter | NM:13 only SHARED/SECTION broad scope | MISSING | P1 | Implement exact class filter rather than treating presence as identity. | S |
| G2-2-007-064 | F23 | LL:427-430 full edit builder and submissions modal | NN:76-106 inline Disclosure and offering editor navigation | GAP | P2 | Record changed workflow; restore detail/modal if strict clone. | S |

## Unit summary
- Rows: 64; verdicts GAP 47; MATCH 6; MISSING 3; UNKNOWN 4; EXTRA 4; severities P2 39; P3 18; P1 7.
- **High-priority A (P1):** Exact class/Section selection/filter disappeared (only shared vs Section scope), and grading/oversight of a selected section requires consistent authorized drilldown (F05/F23).
- **High-priority B (P1):** One legacy stats lookup could fail without blanking the entire assignment page. New batched aggregate query has no per-row failure isolation and risks losing available assignments on counts failure (F04/F10/F12/F20).
- **High-priority C (P2):** Legacy compact table, create/edit and 760px submissions modal, page-only 8-column IST CSV, action/button labels and 20-row pagination have been restructured (F02/F03/F09/F14).

### UNKNOWN / live checks
- Legacy repository default SQL/JPA ORDER BY needs direct query inspection before a precise sort verdict; the controller contains no explicit Order spec.
- Delegated FacultyAssignmentReview keyboard grade editor, published grade visible semantics, and old missing-scope component need live review. No pixel-level screenshot was used; dimensions are source contract only.
- Confirm distinct stats vs eligible roster counts on real data and whether batched query failures are handled by outer route error page.
