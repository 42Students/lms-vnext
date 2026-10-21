# Work packet (wave 2): edit src/app/api/courses/assignments/[assignmentId]/submit/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md

## G2-2-026-001  [P2] GAP  facet F01  effort M
- Legacy: AssignmentController.java:38-42 exposes `/api/v1/assignment` for the learner/faculty submission lifecycle.
- vNext now: src/app/api/courses/assignments/[assignmentId]/submit/route.ts:17-43 uses resource UUID POST; `assignment-submissions/route.ts:10-28` exposes GET.
- Fix: Document old/new contract mapping for clients; keep compatible redirects or migrate all call sites.

## G2-2-026-002  [P2] GAP  facet F01  effort M
- Legacy: AssignmentController.java:143-169 `POST /submit` with JSON lesson_content_id/student_id.
- vNext now: assignments/[assignmentId]/submit/route.ts:17-43 reads `assignmentId` from route, accepts `deliveryId` in body, returns `{submission}` 201.
- Fix: Update request adapter, response envelope and HTTP-success expectations; make delivery context explicit.
