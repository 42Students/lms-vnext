# Work packet (wave 2): edit src/components/courses/learner-roadmap-item-dialog.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u008-syllabus-detail.md, docs/audit/gap2/lane-18/syllabus-liveclass.md, docs/audit/gap2/lane-19/pdf-viewer-modal.md

## G2-15-008-005  [P2] GAP  facet F02  effort M
- Legacy: Lesson head title h4 under nav, no global lesson-card modal (syllabusDetail.js:284-327)
- vNext now: VNext content items default list and open per-item Dialog (learner-course-workspace.tsx:778-921; learner-roadmap-item-dialog.tsx:22-40)
- Fix: Use same inline card/list treatment for selected lesson; keep modal as optional advanced preview

## G2-15-008-051  [P2] GAP  facet F16  effort L
- Legacy: Legacy one-column responsive `.learn-lesson-contents`, header row/bottom controls, inline content list (syllabusDetail.js:259-441)
- vNext now: VNext roadmap disclosure/dialog, tablet/mobile expandable outline (learner-course-workspace.tsx:691-970; learner-roadmap-item-dialog.tsx:22-40)
- Fix: Match legacy 1280/768/375 content list/readability and persistent nav

## G2-15-008-053  [P2] GAP  facet F17  effort M
- Legacy: Legacy back button has aria-label backLabel, bottom aria-label Lesson navigation (syllabusDetail.js:265-269,412-427)
- vNext now: VNext course navigation aria-label Course navigation and roadmap modal buttons (courseTab/page.tsx:164-170; learner-roadmap-item-dialog.tsx:24-40)
- Fix: Add lesson navigation landmark and descriptive previous/next focus targets

## G2-15-008-056  [P2] GAP  facet F18  effort S
- Legacy: Legacy `Loading lesson content…`, `No lesson content yet`, `Previous lesson`, `Next lesson`, `Add content` (syllabusDetail.js:105-109,265-281,358-371)
- vNext now: VNext `Learning Path`, `Open ›`, `Create lessons and add content to show the learner roadmap.` (learner-course-workspace.tsx:683-691,710-713; learner-roadmap-item-dialog.tsx:34-37)
- Fix: Restore selected-lesson exact labels, leave overarching roadmap name for tab only

## G2-18-008-001  [P2] GAP  facet F01  effort M
- Legacy: Old live viewer is an imported syllabus content component, not standalone route (`syllabus/liveclass.js:57-66`); launched from Learning Path content row (`syllabus.js:1174-1207`).
- vNext now: New learner item opens LearnerRoadmapItemDialog from course workspace, kind Content (`learner-roadmap-item-dialog.tsx:9-40`; `learner-course-workspace.tsx:160-164`).
- Fix: Keep legacy Learning Path row/modal entry without introducing separate page; verify anchor/deeplink handling.

## G2-18-008-033  [P2] GAP  facet F09  effort M
- Legacy: Old LIVE_CLASS component itself no modal; rendered within reusable Syllabus centered content modal (`syllabus/liveclass.js:57-66`; `syllabus.js:1180-1207`).
- vNext now: New roadmap opens Dialog with title `Content: {title}` and caption (`learner-roadmap-item-dialog.tsx:23-40`).
- Fix: Match old modal title/width (760px live), rather than generic prefixed content title.

## G2-19-008-011  [P2] MISSING  facet F04  effort M
- Legacy: Legacy iframe minHeight75vh and width/height 100% `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:19-22`
- vNext now: vNext roadmap item dialog generic body and no embedded iframe `src/components/courses/learner-roadmap-item-dialog.tsx:36-40`
- Fix: Render responsive PDF viewer iframe with same effective min height in specific PDF flow.

## G2-19-008-007  [P3] GAP  facet F03  effort S
- Legacy: ModalContainer adds `Got it` footer by default `docs/legacy-source/frontend/src/components/Global/ModalContainer/ModalContainer.jsx:44-70`
- vNext now: vNext Dialog renders footer only if passed; roadmap item Dialog passes none `src/components/ui/dialog.tsx:26-26` `src/components/ui/dialog.tsx:54` `src/components/courses/learner-roadmap-item-dialog.tsx:36-40`
- Fix: Include legacy Got it footer action for PDF viewer or explicitly remove on owner-approved design.

## G2-19-008-010  [P3] GAP  facet F04  effort S
- Legacy: Legacy frame fixed title `PDF Viewer` `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:16-18`
- vNext now: vNext learner dialog title generated as kind + `: ` + item title `src/components/courses/learner-roadmap-item-dialog.tsx:36-38`
- Fix: Set iframe title PDF Viewer; use descriptive dialog heading with file name.

## G2-19-008-022  [P3] GAP  facet F09  effort S
- Legacy: Legacy opens via prop controlled state and explicit `onClose` `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:4-11`
- vNext now: vNext LearnerRoadmapItemDialog opens on button, text `Open ›` `src/components/courses/learner-roadmap-item-dialog.tsx:21-36`
- Fix: Ensure PDF viewer opens from authorized PDF row and closes back to exact row button.

## G2-19-008-041  [P3] GAP  facet F18  effort S
- Legacy: Legacy literal iframe title PDF Viewer `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:18-18`
- vNext now: vNext learner roadmap dialog title `<Kind>: <title>` `src/components/courses/learner-roadmap-item-dialog.tsx:36-38`
- Fix: Preserve PDF Viewer accessible frame title and document-specific dialog title.
