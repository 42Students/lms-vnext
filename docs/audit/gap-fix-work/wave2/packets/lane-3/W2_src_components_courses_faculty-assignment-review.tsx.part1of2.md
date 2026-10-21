# Work packet (wave 2): edit src/components/courses/faculty-assignment-review.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/course-submissions-modal.md, docs/audit/gap2/lane-2/assignment-controller.md, docs/audit/gap2/lane-3/student-assignment.md

## G2-13-008-001  [P2] GAP  facet F01  effort M
- Legacy: Faculty opens modal from selected syllabus assignment (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:130-157`)
- vNext now: FacultyAssignmentReview invoked for assigned course; View submissions button opens Drawer (`src/components/courses/faculty-assignment-review.tsx:471-551`)
- Fix: Retain modal-based nested syllabus action or route adapter preserving 780px overlay.

## G2-13-008-003  [P2] GAP  facet F01  effort S
- Legacy: Legacy assignment title uses contentTitle or content_title, default Assignment submissions (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:147-150`)
- vNext now: New Drawer title is always Assignment submissions (`src/components/courses/faculty-assignment-review.tsx:551-559`)
- Fix: Use selected assignment title as drawer heading; fallback exact legacy text.

## G2-13-008-004  [P2] GAP  facet F02  effort M
- Legacy: 780px centered Modal, destroyOnClose and no footer (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:257-267`)
- vNext now: New right Drawer with description and no 780px center geometry (`src/components/courses/faculty-assignment-review.tsx:551-559`)
- Fix: Match 780px modal size/overlay or document approved drawer change.

## G2-13-008-005  [P2] GAP  facet F02  effort L
- Legacy: Desktop splits student list left and main preview/grading right (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:296-336`)
- vNext now: New Drawer presents filter tabs, combo navigator and single selected card vertically (`src/components/courses/faculty-assignment-review.tsx:573-645`)
- Fix: Restore left roster with right preview pane on ≥768px.

## G2-13-008-008  [P2] MISSING  facet F03  effort M
- Legacy: Student avatars use tinted first/last initials from 6 deterministic palette colors (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:11-31`)
- vNext now: New student picker displays text names/status, no avatars (`src/components/courses/faculty-assignment-review.tsx:599-609`)
- Fix: Add tinted two-letter avatar to desktop list.

## G2-13-008-009  [P2] GAP  facet F03  effort S
- Legacy: Student selection row shows Graded or Pending badges (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:306-329`)
- vNext now: New select option shows Graded/Pending, detail badge gives full grade (`src/components/courses/faculty-assignment-review.tsx:602-609`)
- Fix: Restore chip on each visible student row, not only select option.

## G2-13-008-010  [P2] GAP  facet F03  effort M
- Legacy: Header count Students (gradedCount / total graded) from full loaded list (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:246-248`)
- vNext now: New label counts graded only on current page (`src/components/courses/faculty-assignment-review.tsx:599-608`)
- Fix: Compute full-assignment graded count from server aggregate and separately label page count.

## G2-13-008-011  [P2] MISSING  facet F03  effort S
- Legacy: Selected student shows active-row highlight (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:311-315`)
- vNext now: New selected select option but no left-row active highlight (`src/components/courses/faculty-assignment-review.tsx:601-609`)
- Fix: Restore active student row highlight and focus.

## G2-13-008-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy nav icon left/right and count n / N (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:359-378`)
- vNext now: New Previous student/Next student text buttons with count (`src/components/courses/faculty-assignment-review.tsx:611-623`)
- Fix: Use matching chevron icons and compact counter in picker area.

## G2-13-008-013  [P2] GAP  facet F03  effort S
- Legacy: Grade pending/Graded N pts chip is adjacent to grade input (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:456-463`)
- vNext now: New badge at student header, grade form below (`src/components/courses/faculty-assignment-review.tsx:313-329`)
- Fix: Position grade-status strip adjacent to editor for parity.

## G2-13-008-014  [P2] GAP  facet F04  effort S
- Legacy: Response name uses studentFirstName/LastName, fallback Student {studentId} (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:51-55`)
- vNext now: New displayName/email fallback Learner UUID prefix (`src/components/courses/faculty-assignment-review.tsx:36-43`)
- Fix: Use assigned learner name and Student fallback with context-safe identifier.

## G2-13-008-017  [P2] GAP  facet F04  effort M
- Legacy: Rich HTML response rendered through Interweave allowList (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:120-127`)
- vNext now: New rich content rendered as plain text, whitespace-pre-wrap (`src/components/courses/faculty-assignment-review.tsx:341-343`)
- Fix: Display sanitized rich markup for legacy submissions; never render untrusted raw HTML.

## G2-13-008-018  [P2] GAP  facet F04  effort L
- Legacy: Assets support WRITTEN_RESPONSE, PDF_UPLOAD, FILE_UPLOAD, REPOSITORY_LINK etc (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:380-425`)
- vNext now: New dispatch handles FILE/TEXT/LINK, separate submitted-files and links components (`src/components/courses/faculty-assignment-review.tsx:331-348`)
- Fix: Crosswalk all asset type combinations to multipart schema and render each label.

## G2-13-008-020  [P2] GAP  facet F04  effort S
- Legacy: Old rich text with no assets still displays htmlContent (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:448-454`)
- vNext now: New TEXT submission plain textContent; no HTML renderer (`src/components/courses/faculty-assignment-review.tsx:341-349`)
- Fix: Map migrated htmlContent safely to display.

## G2-13-008-021  [P2] GAP  facet F05  effort M
- Legacy: All submissions requested with `all: true` (legacy backend caps default to 50) (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:166-175`)
- vNext now: New paginated server filter with page navigation (`src/components/courses/faculty-assignment-review.tsx:514-533`)
- Fix: Clarify true total and first-page behavior; do not claim all selected when capped.

## G2-13-008-023  [P2] GAP  facet F05  effort M
- Legacy: Legacy previous/next traverses entire students array (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:248-255`)
- vNext now: New buttons traverse current page only (`src/components/courses/faculty-assignment-review.tsx:611-623`)
- Fix: Cross page boundaries automatically or visibly make Page context clear.

## G2-13-008-025  [P2] GAP  facet F06  effort S
- Legacy: Grade input numeric integer step=1, min=0, max assignment points or 1000 fallback (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:464-485`)
- vNext now: New numeric Points maxPoints and 0..10000 Zod schema (`src/components/courses/faculty-assignment-review.tsx:355-370`)
- Fix: Clamp to positive assignment max, use 1000 fallback only when unknown and display `/ N` suffix.

## G2-13-008-026  [P2] GAP  facet F06  effort S
- Legacy: Legacy `Grade points` placeholder, only editable after Edit grade (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:469-492`)
- vNext now: New input always editable; Save privately and Submit grade controls (`src/components/courses/faculty-assignment-review.tsx:355-406`)
- Fix: Disable grade input for published row until Edit grade clicked or document revised editor state.

## G2-13-008-028  [P2] GAP  facet F06  effort S
- Legacy: Legacy on grade value change rejects outside [0,max] immediately (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:479-485`)
- vNext now: New accepts raw text until save validation (`src/components/courses/faculty-assignment-review.tsx:359-369`)
- Fix: Match immediate bounded input behavior and clear error message.

## G2-13-008-029  [P2] GAP  facet F06  effort S
- Legacy: Legacy Submit grade primary, Edit grade secondary (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:488-492`)
- vNext now: New Submit grade/Save privately/Publish grade buttons (`src/components/courses/faculty-assignment-review.tsx:394-423`)
- Fix: Make Submit grade primary save+publish default; advanced private saving secondary.

## G2-13-008-042  [P2] GAP  facet F10  effort M
- Legacy: GET `/api/v1/assignment/fetchSubmissions?lessonContentId` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AssignmentController.java:171-199`)
- vNext now: New GET faculty/assignments/{assignmentId}/submissions with deliveryId/filter/page (`src/components/courses/faculty-assignment-review.tsx:519-528`)
- Fix: Crosswalk legacy lessonContentId to assignmentId and verify complete submission view.

## G2-13-008-045  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET supports page,size, default caps first 50 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AssignmentController.java:171-199`)
- vNext now: New paginates and validates scope response (`src/components/courses/faculty-assignment-review.tsx:514-533`)
- Fix: Ensure every learner reachable and full counts aggregated correctly.

## G2-13-008-049  [P2] GAP  facet F12  effort S
- Legacy: Legacy immediately publishes grade in Submit grade click (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:529-536`)
- vNext now: New Submit grade save+publish flow with extra confirmation; private save allowed (`src/components/courses/faculty-assignment-review.tsx:177-232`)
- Fix: Default to immediate publish while retaining private draft as explicit secondary choice.

## G2-13-008-050  [P2] GAP  facet F12  effort S
- Legacy: Legacy edited grade input toggled back read-only after success (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:535-547`)
- vNext now: New onUpdated reload causes selected card remount; editor remains editable (`src/components/courses/faculty-assignment-review.tsx:629-641`)
- Fix: Match post-submit locked editor state, while preserving change control.

## G2-13-008-053  [P2] GAP  facet F13  effort S
- Legacy: Old 240px spinner when initial submission list loading (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:269-273`)
- vNext now: New LoadingState Loading submissions… (`src/components/courses/faculty-assignment-review.tsx:589-589`)
- Fix: Match 240px centered spinner/density.

## G2-13-008-055  [P2] GAP  facet F13  effort S
- Legacy: Old Select a student to view their submission if none selected (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:448-454`)
- vNext now: New automatically picks first item, no unselected prompt (`src/components/courses/faculty-assignment-review.tsx:533-535`)
- Fix: Retain fallback when selected ID becomes invalid.

## G2-13-008-056  [P2] GAP  facet F13  effort M
- Legacy: Old optional stale warning preserves list and Retry (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:286-294`)
- vNext now: New clears rows and pagination before reload (`src/components/courses/faculty-assignment-review.tsx:514-516`)
- Fix: Preserve last loaded list with explicit warning.

## G2-13-008-062  [P2] GAP  facet F16  effort S
- Legacy: Legacy student list hidden under max-width:767 and mobile Select shown (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:335-356`)
- vNext now: New Select shown on desktop/mobile, no left student list (`src/components/courses/faculty-assignment-review.tsx:599-609`)
- Fix: Hide redundant desktop picker when restored desktop roster; ensure mobile combo.

## G2-13-008-063  [P2] GAP  facet F16  effort M
- Legacy: Old modal 780px, mobile-safe wrap class (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:257-267`)
- vNext now: New Drawer full panel, mobile scroll container (`src/components/courses/faculty-assignment-review.tsx:551-560`)
- Fix: Compare widths 375,768,1280 and keyboard focus containment.

## G2-13-008-067  [P2] GAP  facet F18  effort S
- Legacy: Legacy list header Students (g/N graded) (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:300-303`)
- vNext now: New Students (g/N graded on this page) (`src/components/courses/faculty-assignment-review.tsx:600-603`)
- Fix: Use assignment-wide totals in header.

## G2-13-008-073  [P2] GAP  facet F19  effort M
- Legacy: Old single submission list reused as student nav, no extra API page reads (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:246-255`)
- vNext now: New each filter/page change calls API and resets selected row (`src/components/courses/faculty-assignment-review.tsx:514-535`)
- Fix: Preserve student selection across paging when still present.

## G2-13-008-084  [P2] GAP  facet F23  effort M
- Legacy: Old PDF iframe shown inline, no feedback field (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:95-108`)
- vNext now: New secure file download and Feedback field, no embedded preview (`src/components/courses/faculty-assignment-review.tsx:373-391`)
- Fix: Restore optional secure preview and original grading emphasis.

## G2-2-026-010  [P2] GAP  facet F02  effort M
- Legacy: viewSubmissionsModal.jsx:258-336 shows 780px modal, left student list, right picker/preview/grade.
- vNext now: faculty-assignment-review.tsx:12-27 imports Drawer and Tabs; student-grade card starts :59.
- Fix: Compare and reproduce 780px submissions-modal hierarchy, list/avatar/preview/editor pane.

## G2-2-026-018  [P2] GAP  facet F04  effort S
- Legacy: viewSubmissionsModal.jsx:51-56 builds first/last student name, falls back `Student <id>`.
- vNext now: faculty-assignment-review.tsx:36-43 falls back to email then `Learner <UUID prefix>`.
- Fix: Restore privacy-safe old fallback wording and verify first/last display ordering.

## G2-2-026-044  [P2] GAP  facet F09  effort M
- Legacy: viewSubmissionsModal.jsx:258-266 modal width780 centered, destroyOnClose, blocks close while saving.
- vNext now: faculty-assignment-review.tsx:14-18 imports Drawer; :89-98 holds saving and publishing state.
- Fix: Reproduce modal geometry and escape/close lock during grade mutation.

## G2-2-026-060  [P2] GAP  facet F12  effort M
- Legacy: AssignmentServiceImpl.java:520-550 explicitly evaluates legacy offsetless deadline in Asia/Kolkata.
- vNext now: assignment-submission-service.ts:225-235 uses Date object stored timestamptz; `faculty-assignment-review.tsx:46-56` formats en-IN Asia/Kolkata.
- Fix: Audit conversion of old offsetless due_date to true IST instant before import.

## G2-3-016-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:627-640`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-83`
- vNext now: `src/modules/courses/faculty-assignment-submissions-model.ts:41-70`, `src/components/courses/faculty-assignment-review.tsx:100-131`
- Fix: Legacy report reads lessonContentId and bulk grade publisher routes by lesson content, vNext faculty report uses assignmentId+deliveryId and per-submission API. Preserve deep-link redirect and bulk publish parity.

## G2-3-016-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:627-640`, `753-778`
- vNext now: `src/modules/courses/faculty-assignment-submissions-model.ts:23-39`, `src/components/courses/faculty-assignment-review.tsx:59-88`
- Fix: Legacy grade reporting can show one flat list with submission stats and grade controls; vNext paginates 20 items, summary/filter/order differ. Align report surface hierarchy.

## G2-3-016-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:47-51`, `60-82`
- vNext now: `src/components/courses/faculty-assignment-review.tsx:72-88`, `src/modules/courses/assignment-submission-service.ts:79-102`
- Fix: Legacy independent numeric graded flag and explicit publication bit; vNext gradingStatus and gradePublished determine badge/action. Map labels `Not graded`, `Graded`, `Published` exactly.

## G2-3-016-043  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:564-568`, `722-736`, `827-858`
- vNext now: `src/components/courses/faculty-assignment-review.tsx:114-116`, `src/modules/courses/assignment-submission-service.ts:472-474`
- Fix: Legacy messages Already submitted for this assignment, Submission not found, Points obtained cannot be negative, Cannot publish grade; vNext uses error codes and regrade prompt. Match visible strings.
