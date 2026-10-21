# Work packet (wave 2): edit src/modules/courses/assignment-file-readiness.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/all-assignments.md

## G2-12-007-023  [P2] GAP  facet F06  effort S
- Legacy: File max50MB, PDFs pdf-only; upload presign folder assignments `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:20-22,535-548`
- vNext now: Environment R2 guard controls file uploads; size/type validated downstream `src/modules/courses/assignment-file-readiness.ts:2-13`
- Fix: Verify 50MB/pdf-only validation and specific message

## G2-12-007-037  [P2] GAP  facet F10  effort S
- Legacy: Presign file upload followed by submission asset DTO `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:535-548`
- vNext now: R2 readiness gating; actual submit storage different normalized schema `src/modules/courses/assignment-file-readiness.ts:2-13`
- Fix: Document full upload/edit/delete graph

## G2-12-007-051  [P2] GAP  facet F14  effort S
- Legacy: Upload assignment files max50MB via R2 presign `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:20-22,535-560`
- vNext now: R2 flags guard feature until credentials configured `src/modules/courses/assignment-file-readiness.ts:2-13`
- Fix: Preserve allowed resource types and upload feedback

## G2-12-007-070  [P2] GAP  facet F21  effort S
- Legacy: Legacy uploadToR2 uses assignments folder and scoped lessonContentId `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:535-548`
- vNext now: New private R2 feature flag gates all assignment files `src/modules/courses/assignment-file-readiness.ts:2-13`
- Fix: Document signed storage route parity and object lifecycle
