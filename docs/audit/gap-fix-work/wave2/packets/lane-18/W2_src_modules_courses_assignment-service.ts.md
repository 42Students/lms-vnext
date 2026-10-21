# Work packet (wave 2): edit src/modules/courses/assignment-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md

## G2-13-027-013  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AssignmentContentWriteService.java:285-298 — assignment title 1-255; due future required
- vNext now: src/modules/courses/assignment-service.ts:207-269,403-419 — draft create accepts nullable due, publish requires future due
- Fix: Keep draft vs published distinction and show exact deadline messages.

## G2-13-027-026  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AssignmentContentWriteService.java:246-272 — once submissions exist, assignment scope, points, deadline, instructions frozen
- vNext now: src/modules/courses/assignment-service.ts:303-312 — update rejects any submissions
- Fix: Document full vs partial edit freeze policy and exact UI affordance.
