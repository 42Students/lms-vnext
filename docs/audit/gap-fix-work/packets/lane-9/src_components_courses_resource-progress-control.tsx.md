# Work packet: edit src/components/courses/resource-progress-control.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md, docs/audit/gap2/lane-18/syllabus-liveclass.md

## G2-17-008-032  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/components/Course/Syllabus/MarkCompleteButton.jsx:33-37 — Completion updates current progress callback; errors AntD toast.
- vNext now: src/components/courses/resource-progress-control.tsx:62-68 — On success router.refresh; on error inline alert.
- Fix: Provide same immediate status/error feedback.

## G2-18-008-026  [P2] GAP  facet F07  effort S
- Legacy: Old progress failed saving calls Ant message with backend message or `Could not mark this as complete. Please try again.` (`MarkCompleteButton.jsx:28-41`).
- vNext now: New fetch error appears inline via courseApiError and generic exception fallback (`resource-progress-control.tsx:55-68,82-88`).
- Fix: Restore toast or preserve inline error plus legacy exact fallback; test 403 and offline.
