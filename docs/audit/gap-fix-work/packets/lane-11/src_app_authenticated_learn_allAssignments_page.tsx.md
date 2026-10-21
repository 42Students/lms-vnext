# Work packet: edit src/app/(authenticated)/learn/allAssignments/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/all-assignments.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md

## G2-12-007-043  [P1] GAP  facet F12  effort M
- Legacy: Submission can contain several assets of different kinds `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:66-76,392-471`
- vNext now: Normalized overview exposes single submissionType TEXT/LINK/FILE and one URL/text `src/app/(authenticated)/learn/allAssignments/page.tsx:42-59`
- Fix: Ensure combined submission asset history not lost

## G2-12-007-073  [P1] GAP  facet F22  effort S
- Legacy: Legacy submission payload assets array (file/link/text multiple kinds) `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:392-471`
- vNext now: Page mapped a single submissionType and URL/text `src/app/(authenticated)/learn/allAssignments/page.tsx:43-51`
- Fix: Preserve multipart asset lookup and display history

## G2-15-031-020  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:69-89`
- vNext now: `src/app/(authenticated)/learn/allAssignments/page.tsx:63-74`
- Fix: Legacy neutral error/unknown submission status wording vs new cards; never silently infer not submitted.
