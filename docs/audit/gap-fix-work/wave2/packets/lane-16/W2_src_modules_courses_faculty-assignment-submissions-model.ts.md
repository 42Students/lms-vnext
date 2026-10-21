# Work packet (wave 2): edit src/modules/courses/faculty-assignment-submissions-model.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md, docs/audit/gap2/lane-3/student-assignment.md

## G2-2-026-003  [P2] GAP  facet F01  effort M
- Legacy: AssignmentController.java:171-199 GET `/fetchSubmissions?lessonContentId=` with optional 0-based `page,size`.
- vNext now: assignment-submissions/route.ts:10-28 GET `assignmentId,deliveryId`; `faculty-assignment-submissions-model.ts:6-11` uses 1-based page.
- Fix: Map lesson-content identity to assignment/delivery and reconcile 0-versus-1-based pagination.

## G2-2-026-012  [P2] GAP  facet F03  effort M
- Legacy: viewSubmissionsModal.jsx:345-378 has mobile student select and Previous/Next controls with count.
- vNext now: faculty-assignment-submissions-model.ts:34-39 paginates 20 and :41-49 uses page navigation.
- Fix: Preserve within-modal previous/next student navigation and mobile picker, not only page links.

## G2-2-026-021  [P2] GAP  facet F05  effort M
- Legacy: AssignmentController.java:183-198 returns page/size only when both supplied; otherwise capped first 50 array.
- vNext now: faculty-assignment-submissions-model.ts:6-11 and :34-39 defaults page 1, size 20, object envelope.
- Fix: Align default page size and array vs paged response semantics at client boundary.

## G2-2-026-078  [P2] GAP  facet F17  effort S
- Legacy: viewSubmissionsModal.jsx:363-377 Previous/Next buttons have aria-labels and disabled boundary rules.
- vNext now: faculty-assignment-submissions-model.ts:41-49 provides page URL navigation, not identical per-row controls.
- Fix: Preserve accessible previous/next student controls with boundary disabled state.

## G2-3-016-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:627-640`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-83`
- vNext now: `src/modules/courses/faculty-assignment-submissions-model.ts:41-70`, `src/components/courses/faculty-assignment-review.tsx:100-131`
- Fix: Legacy report reads lessonContentId and bulk grade publisher routes by lesson content, vNext faculty report uses assignmentId+deliveryId and per-submission API. Preserve deep-link redirect and bulk publish parity.

## G2-3-016-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:627-640`, `753-778`
- vNext now: `src/modules/courses/faculty-assignment-submissions-model.ts:23-39`, `src/components/courses/faculty-assignment-review.tsx:59-88`
- Fix: Legacy grade reporting can show one flat list with submission stats and grade controls; vNext paginates 20 items, summary/filter/order differ. Align report surface hierarchy.

## G2-3-016-012  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:627-640`, `678-694`
- vNext now: `src/modules/courses/faculty-assignment-submissions-model.ts:3-39`, `src/modules/courses/assignment-submission-service.ts:603-670`
- Fix: Legacy list submissions by lesson content and per learner createdAt DESC pageable, vNext standard read sorts submittedAt ASC and faculty report later can sort NEWEST/OLDEST; align default sort and page count.

## G2-3-016-013  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:753-778`
- vNext now: `src/modules/courses/faculty-assignment-submissions-model.ts:23-39`
- Fix: Legacy stats total eligible roster, submitted, graded, ungraded, not submitted; vNext pagination/filter model operates submitted rows only. Ensure report computes missing roster and counts before filtering.

## G2-3-016-014  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:633-640`
- vNext now: `src/modules/courses/faculty-assignment-submissions-model.ts:34-39`
- Fix: Legacy uses pageable from controller (source allows paging), vNext fixes pageSize20 and page1 default. Match effective legacy page defaults where visible.

## G2-3-016-044  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:627-640`
- vNext now: `src/modules/courses/faculty-assignment-submissions-model.ts:23-39`, `src/modules/courses/assignment-submission-service.ts:603-670`
- Fix: Legacy supports Pageable and roster-backed totals, vNext listAssignmentSubmissions loads all then filters/sorts in memory and slices 20. Add SQL-level page/count for large classes.
