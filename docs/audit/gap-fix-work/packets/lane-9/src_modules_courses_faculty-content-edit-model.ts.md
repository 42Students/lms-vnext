# Work packet: edit src/modules/courses/faculty-content-edit-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/youtube.md

## G2-12-008-022  [P2] GAP  facet F08  effort S
- Legacy: Delete toasts `YouTube video deleted successfully` and `Failed to delete` (2s) `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:183-188`
- vNext now: No player-local toast; shared authoring save receipt `src/modules/courses/faculty-content-edit-model.ts:79-97`
- Fix: Restore exact deletion toast and duration
