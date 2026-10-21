# Work packet: edit src/components/courses/faculty-submission-file-review.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/course-submissions-modal.md

## G2-13-008-082  [P1] GAP  facet F22  effort L
- Legacy: Old submissionAssets array supports multiple links/files/written parts (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:75-77`)
- vNext now: New assignments support separate submissionFiles and links, with TEXT type (`src/components/courses/faculty-submission-file-review.tsx:14-35`)
- Fix: Crosswalk asset type/status IDs/multiple parts and migration into normalized attachments.
