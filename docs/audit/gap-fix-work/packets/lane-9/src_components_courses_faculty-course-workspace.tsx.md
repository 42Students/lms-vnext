# Work packet: edit src/components/courses/faculty-course-workspace.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-18-001-032  [P1] GAP  facet F05  effort S
- Legacy: Legacy Blueprint filters lower-case `all,lectures,resources,assessments,live-sessions` and retain page while switching. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:90-98`, `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:402-411`
- vNext now: vNext link filters upper-case ALL,LECTURES,RESOURCES,ASSESSMENTS,LIVE, invalid default ALL. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:17-20`, `src/components/courses/faculty-course-workspace.tsx:518-529`
- Fix: Accept both old lower-case variants and vNext enums; canonicalize links without discarding user filter.

## G2-18-001-049  [P1] GAP  facet F09  effort L
- Legacy: Legacy syllabus opens modal for video/YouTube/resource/live/quiz, with 760px or 1120px widths and independent assignment drawer. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:1174-1210`
- vNext now: vNext shows YouTube preview inline and content editors nested under each item; no equivalent top-level roadmap content viewer. `src/components/courses/faculty-course-workspace.tsx:138-173`, `src/components/courses/faculty-course-workspace.tsx:618-696`
- Fix: Provide one item-activation preview with legacy viewer and the 760/1120 sizing; assignment as distinct drawer.

## G2-18-001-065  [P1] GAP  facet F12  effort S
- Legacy: Legacy content filter accepts `live-sessions` and renders scheduled state labels Live now/Ended. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:90-98`, `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:1100-1107`
- vNext now: vNext filter enum uses `LIVE`, contentType LIVE_CLASS, no matched existing live-sessions query. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:17-20`, `src/components/courses/faculty-course-workspace.tsx:563-572`
- Fix: Map legacy filter key and verify live session status semantics.
