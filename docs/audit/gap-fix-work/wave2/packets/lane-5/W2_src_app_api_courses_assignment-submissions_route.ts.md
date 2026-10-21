# Work packet (wave 2): edit src/app/api/courses/assignment-submissions/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md

## G2-2-026-001  [P2] GAP  facet F01  effort M
- Legacy: AssignmentController.java:38-42 exposes `/api/v1/assignment` for the learner/faculty submission lifecycle.
- vNext now: src/app/api/courses/assignments/[assignmentId]/submit/route.ts:17-43 uses resource UUID POST; `assignment-submissions/route.ts:10-28` exposes GET.
- Fix: Document old/new contract mapping for clients; keep compatible redirects or migrate all call sites.

## G2-2-026-003  [P2] GAP  facet F01  effort M
- Legacy: AssignmentController.java:171-199 GET `/fetchSubmissions?lessonContentId=` with optional 0-based `page,size`.
- vNext now: assignment-submissions/route.ts:10-28 GET `assignmentId,deliveryId`; `faculty-assignment-submissions-model.ts:6-11` uses 1-based page.
- Fix: Map lesson-content identity to assignment/delivery and reconcile 0-versus-1-based pagination.
