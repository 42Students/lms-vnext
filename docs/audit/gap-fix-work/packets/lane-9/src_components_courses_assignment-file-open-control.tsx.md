# Work packet: edit src/components/courses/assignment-file-open-control.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/pdf-viewer-modal.md

## G2-19-008-017  [P1] GAP  facet F07  effort M
- Legacy: Legacy `<iframe>` no onError handler; fallback text always hidden by CSS `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:16-27` `docs/legacy-source/frontend/src/styles/pages/_courses.scss:4929-4939`
- vNext now: vNext download errors display Alert with Retry `src/components/courses/assignment-file-open-control.tsx:77-78` `src/components/courses/assignment-file-open-control.tsx:101-105`
- Fix: Add PDF load failure detection and reveal functional fallback; use tested cross-origin load limitations.

## G2-19-008-023  [P1] GAP  facet F10  effort L
- Legacy: Legacy iframe open performs browser GET to pdfUrl; no JS API write `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:16-25`
- vNext now: vNext signed file uses POST `/api/courses/assignment-submission-files/{id}/download-grant` with `disposition:attachment` `src/components/courses/assignment-file-open-control.tsx:51-65`
- Fix: Introduce view-only grant with inline disposition and authorized GET / signed URL; do not repurpose attachment grant.

## G2-19-008-028  [P1] GAP  facet F12  effort M
- Legacy: Legacy PDF modal accepts any pdfUrl, no extension/MIME/file-size limit in component `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:4-25`
- vNext now: vNext file list gated on fileStatus `usable` for Download `src/components/courses/assignment-file-open-control.tsx:89-97`
- Fix: Server-check MIME application/pdf, scan/READY status, size and expiration before exposing preview.

## G2-19-008-032  [P1] GAP  facet F13  effort M
- Legacy: Legacy fallback CSS `display:none` even after browser fails iframe `docs/legacy-source/frontend/src/styles/pages/_courses.scss:4929-4939`
- vNext now: vNext errors Alert and Retry independent of iframe `src/components/courses/assignment-file-open-control.tsx:101-105`
- Fix: Unhide PDF fallback on explicit preview error or provide always-visible Open/Download alternative.

## G2-19-008-040  [P1] GAP  facet F17  effort M
- Legacy: Legacy Open / Download anchor reachable via keyboard but hidden by `.fallback{display:none}` `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:28-35` `docs/legacy-source/frontend/src/styles/pages/_courses.scss:4929-4931`
- vNext now: vNext Download is focusable Button only when file usable `src/components/courses/assignment-file-open-control.tsx:89-97`
- Fix: Keep keyboard-visible fallback link available when iframe fails; never hide sole recovery action.

## G2-19-008-019  [P2] GAP  facet F08  effort S
- Legacy: Legacy fallback static sentence `Unable to display the document inline.` `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:26-27`
- vNext now: vNext file errors use `File download failed. Try again.` or server message `src/components/courses/assignment-file-open-control.tsx:77-78`
- Fix: Use exact PDF-specific fallback text when inline renderer cannot display.
