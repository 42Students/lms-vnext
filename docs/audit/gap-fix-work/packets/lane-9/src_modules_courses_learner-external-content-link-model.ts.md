# Work packet: edit src/modules/courses/learner-external-content-link-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/pdf-viewer-modal.md

## G2-19-008-027  [P1] GAP  facet F11  effort M
- Legacy: Legacy frame sandbox allows same-origin and scripts `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:23-24`
- vNext now: vNext course external URL validator rejects credentials and non-http schemes `src/modules/courses/learner-external-content-link-model.ts:3-10`
- Fix: Use allowlisted signed storage URL and least-privilege iframe sandbox; avoid same-origin+scripts where untrusted.
