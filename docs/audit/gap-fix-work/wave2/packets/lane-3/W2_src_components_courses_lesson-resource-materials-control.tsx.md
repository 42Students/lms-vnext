# Work packet (wave 2): edit src/components/courses/lesson-resource-materials-control.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md, docs/audit/gap2/lane-19/pdf-viewer-modal.md

## G2-17-008-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:147-182 — Materials list unboxed rows with trailing Open button.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:77-104 — Nested bordered material cards.
- Fix: Convert to legacy compact rows, icon/title/caption/action.

## G2-17-008-006  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:30-43 — File extension icon mapping pdf,image,spreadsheet,word,presentation,archive.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:83-103 — Rows lack file-type icons.
- Fix: Add mapped per-extension icons and generic fallback.

## G2-17-008-013  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:45-51 — Caption shows Link/File or rounded KB/1-decimal MB.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:84-93 — No material size caption.
- Fix: Format sizeBytes to match legacy labels.

## G2-17-008-014  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:155-159 — Title fallback originalName then Material 1, Material 2.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:85-86 — Renders material.title only.
- Fix: Fallback missing titles for imported records.

## G2-17-008-017  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:162-176 — Per material only Open, no row click.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:83-103 — Link open only; per-link editing where enabled.
- Fix: Keep simple Open navigation for learner, separate editor actions.

## G2-17-008-018  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:162-176 — Unsafe/missing material link renders `Unavailable`.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:88-93 — Invalid LINK shows no fallback text.
- Fix: Render Unavailable label for filtered unsafe links.

## G2-17-008-021  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:253-255 — Link title optional; default URL prefix if absent.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:107-113 — Link title mandatory.
- Fix: Permit blank title and derive fallback.

## G2-17-008-023  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:243-245 — Parent notes textarea rows3, placeholder `Context for learners`; carries HTML.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:115-118 — Per-link notes rows2 and 2000 max.
- Fix: Restore parent notes field and HTML preservation.

## G2-17-008-033  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:132-137 — Resource remove Popconfirm title and retention description.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:54-56 — Child remove uses basic window.confirm.
- Fix: Use legacy full Resource confirm; do not confuse child remove.

## G2-17-008-051  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:85-91 — One failed grant closes blank tab without blocking other files.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:36-45 — Whole metadata load can fail, but no per-file grant.
- Fix: Keep other rows accessible on single item failure.

## G2-17-008-058  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:171-176 — Open button right aligned after caption.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:84-103 — Open link inline under title; FILE no CTA.
- Fix: Match trailing Open button placement on mobile/desktop.

## G2-17-008-060  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:171-175 — Open buttons use material title in aria-label.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:88-90 — Generic Open link lacks material-specific label.
- Fix: Use title-specific accessible name.

## G2-17-008-065  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:133-135 — Remove Resource dialog says files retained.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:56 — Child link confirmation says students no longer see material.
- Fix: Differentiate archive vs link remove and preserve exact copy.

## G2-17-008-010  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:147-150 — Heading `Materials` plus count only.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:78-80 — `Materials (N/20)` with loading indicator.
- Fix: Show count separately and limit as helper.

## G2-17-008-049  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:147-182 — If no notes/materials, Empty says `No Resource materials`.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:80-82 — Says `No additional materials.`
- Fix: Reinstate exact empty copy for viewer.

## G2-17-008-062  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:149-150 — `Materials` heading with numeric count.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:79 — `Materials (N/20)`.
- Fix: Restore heading/count wording.

## G2-17-008-063  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:182 — Empty `No Resource materials`.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:82 — `No additional materials.`
- Fix: Use legacy empty message.

## G2-19-008-008  [P3] GAP  facet F03  effort S
- Legacy: Legacy fallback link caption `Open / Download` `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:26-35`
- vNext now: vNext submitted file caption `Download`; link resources use `Open link` `src/components/courses/assignment-file-open-control.tsx:94-97` `src/components/courses/lesson-resource-materials-control.tsx:88-90`
- Fix: Use exact Open / Download label in PDF fallback only.
