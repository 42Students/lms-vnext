# Work packet: edit src/components/tpo/tpo-bulk-action-panel.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md, docs/audit/gap2/lane-8/tpo-applicant-controller.md

## G2-14-001-041  [P1] GAP  facet F10  effort L
- Legacy: Legacy Actions window covers drive overrides, message, After college, debar/lift, verify/sendback, prep and note; vNext general picker narrower and split controls — `docs/legacy-source/frontend/src/components/tpo/students/StudentActions.jsx:62-83,94-107,302-356`
- vNext now: `src/components/tpo/tpo-bulk-action-panel.tsx:25-41`; `src/app/(authenticated)/tpo/students/page.tsx:971-1020`
- Fix: Unify all 11 with precise per-action skip and undo semantics

## G2-8-023-063  [P1] MISSING  facet F20  effort M
- Legacy: Legacy undo group is outbox-controlled, late notices cannot be cancelled (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:160-175).
- vNext now: New application bulk runAuditId is null so Undo never exposed for applications (src/modules/placements/tpo-bulk-action-confirm-service.ts:122-129; src/components/tpo/tpo-bulk-action-panel.tsx:248-250).
- Fix: Document exact undo lifetime and implement safe reversible application actions.
