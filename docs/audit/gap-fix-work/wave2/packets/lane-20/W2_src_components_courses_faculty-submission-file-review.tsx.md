# Work packet (wave 2): edit src/components/courses/faculty-submission-file-review.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/course-submissions-modal.md

## G2-13-008-016  [P2] GAP  facet F04  effort L
- Legacy: Legacy PDF inline iframe height 520 with sandbox restrictions (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:95-108`)
- vNext now: New submitted files downloaded via signed Open file click; no iframe (`src/components/courses/faculty-submission-file-review.tsx:46-76`)
- Fix: Offer safe inline PDF preview with sandbox and fallback new-tab link.

## G2-13-008-057  [P2] GAP  facet F14  effort L
- Legacy: Old PDF preview inline if signed PDF URL (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:95-108`)
- vNext now: New files require click signed download-grant for new tab (`src/components/courses/faculty-submission-file-review.tsx:46-76`)
- Fix: Add authorized inline PDF preview without exposing signed URL to logs.

## G2-13-008-066  [P2] GAP  facet F17  effort S
- Legacy: Legacy iframe title Submitted assignment PDF preview and sandbox (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:95-105`)
- vNext now: New opens file separate tab (no in-page iframe) (`src/components/courses/faculty-submission-file-review.tsx:67-74`)
- Fix: Restore accessible preview title and safe fallback.

## G2-13-008-070  [P2] GAP  facet F18  effort S
- Legacy: Old file unresolved label Unable to load this file (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:396-408`)
- vNext now: New list errors show Unable to load this submitted file (`src/components/courses/faculty-submission-file-review.tsx:75-77`)
- Fix: Match failure copy for equivalent file-state.
