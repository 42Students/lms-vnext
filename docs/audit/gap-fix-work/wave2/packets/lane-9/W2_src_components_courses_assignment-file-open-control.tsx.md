# Work packet (wave 2): edit src/components/courses/assignment-file-open-control.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/pdf-viewer-modal.md

## G2-19-008-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy modal lives in syllabus page component path, not a page default export `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:1-5` `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:42`
- vNext now: vNext private file action anchored to assignment submission record `src/components/courses/assignment-file-open-control.tsx:18-20` `src/components/courses/assignment-file-open-control.tsx:84-100`
- Fix: Add learner-course PDF preview trigger only for authorized PDF material; retain separate download.

## G2-19-008-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy visible iframe fill plus fallback text/action markup `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:15-36`
- vNext now: vNext assignment file action is `Download` button; no Preview/Viewer button `src/components/courses/assignment-file-open-control.tsx:88-98`
- Fix: Add icon/label for PDF Preview alongside Download when rendition is safe.

## G2-19-008-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy PDF displayed from caller-supplied `pdfUrl` as iframe src with no internal filename/title field `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:4-18`
- vNext now: vNext file list shows originalName and file size, and grants by fileId `src/components/courses/assignment-file-open-control.tsx:89-97` `src/components/courses/assignment-file-open-control.tsx:51-65`
- Fix: Populate dialog accessible title from document filename while keeping iframe title legacy as PDF Viewer.

## G2-19-008-024  [P2] GAP  facet F10  effort S
- Legacy: Legacy fallback anchor performs external GET in new tab `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:28-35`
- vNext now: vNext creates temporary download anchor with referrerPolicy no-referrer `src/components/courses/assignment-file-open-control.tsx:67-76`
- Fix: Keep opening fallback in separate tab; add no-referrer and short TTL.

## G2-19-008-033  [P2] GAP  facet F14  effort M
- Legacy: Legacy iframe view is not a file upload or import; fallback Open / Download link `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:16-35`
- vNext now: vNext assignment submitted-files list download grant, no PDF inline upload `src/components/courses/assignment-file-open-control.tsx:84-98`
- Fix: Add inline preview access while retaining separate secure download.

## G2-19-008-046  [P2] GAP  facet F21  effort M
- Legacy: Legacy integrates browser native iframe PDF renderer and external opener, no worker or plugin import `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:16-35`
- vNext now: vNext file access delegates to private storage grant API, no in-modal renderer `src/components/courses/assignment-file-open-control.tsx:51-76`
- Fix: Allow browser native PDF rendering via short-lived signed URL only after authorization.

## G2-19-008-008  [P3] GAP  facet F03  effort S
- Legacy: Legacy fallback link caption `Open / Download` `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:26-35`
- vNext now: vNext submitted file caption `Download`; link resources use `Open link` `src/components/courses/assignment-file-open-control.tsx:94-97` `src/components/courses/lesson-resource-materials-control.tsx:88-90`
- Fix: Use exact Open / Download label in PDF fallback only.

## G2-19-008-042  [P3] GAP  facet F18  effort S
- Legacy: Legacy `Unable to display the document inline.` and `Open / Download` `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:26-35`
- vNext now: vNext submitted-file errors `File download failed. Try again.` and Download `src/components/courses/assignment-file-open-control.tsx:77-78` `src/components/courses/assignment-file-open-control.tsx:94-97`
- Fix: Restore exact fallback copy on PDF preview failures.
