# Work packet: edit src/components/courses/assignment-submission-control.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/all-assignments.md, docs/audit/gap2/lane-2/assignment-controller.md

## G2-12-007-022  [P1] GAP  facet F06  effort M
- Legacy: Submission methods written response, PDF upload, arbitrary file upload, repository link, external link can combine `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:66-76`
- vNext now: Submission control supports typed text/link/file paths; multipart depends on env `src/components/courses/assignment-submission-control.tsx:17-70`
- Fix: Compare multi-asset submit semantics and preserve allowed methods

## G2-12-007-036  [P1] GAP  facet F10  effort S
- Legacy: POST submitAssignment payload plus saveContentProgress completed true `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:509-516`
- vNext now: vNext assignment actions submit with client refresh; no content progress in caller `src/components/courses/assignment-submission-control.tsx:190-320`
- Fix: Confirm/update course lesson completion progress on submit

## G2-2-026-009  [P1] GAP  facet F02  effort L
- Legacy: SubmitAssignmentModal.jsx:207-253 displays eligible written response, PDF, file, repository, external link sections simultaneously.
- vNext now: assignment-submission-control.tsx:235-314 chooses one of TEXT, LINK or FILE with FilterChip controls.
- Fix: Restore simultaneous multi-method authoring and dynamic repeated asset sections where eligible.

## G2-12-007-026  [P2] GAP  facet F07  effort S
- Legacy: Submit fails if no valid deadline, past deadline, uploading, or no assets; exact toasts `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:473-508`
- vNext now: Input validation via form/model, inline errors `src/components/courses/assignment-submission-control.tsx:190-320`
- Fix: Map four validation and warning messages precisely

## G2-12-007-028  [P2] GAP  facet F08  effort S
- Legacy: Submit toast `Assignment submitted successfully.` and fallback Failed to submit assignment `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:509-528`
- vNext now: Submission success/error shown inline and via router refresh `src/components/courses/assignment-submission-control.tsx:190-320`
- Fix: Match success/error toast copy

## G2-2-026-040  [P2] GAP  facet F08  effort S
- Legacy: SubmitAssignmentModal.jsx:510-519 success toast `Assignment submitted successfully.` for 2s and closes drawer.
- vNext now: assignment-submission-control.tsx:216-219 shows persistent success Alert, does not close inline form.
- Fix: Mirror legacy success toast duration/closure where submission drawer is used.
