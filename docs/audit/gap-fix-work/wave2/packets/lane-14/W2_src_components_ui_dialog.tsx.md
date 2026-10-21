# Work packet (wave 2): edit src/components/ui/dialog.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/pdf-viewer-modal.md, docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md, docs/audit/gap2/lane-3/mobile-responsive-contract.md

## G2-19-008-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy ModalContainer outer modal contains one `.ln-pdf-viewer-modal__body` with iframe and fallback block `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:6-38`
- vNext now: vNext generic Dialog includes header/close, ScrollCue content, optional footer; no PDF-specific inner viewer `src/components/ui/dialog.tsx:39-55`
- Fix: Create PDF-viewer-specific dialog body preserving single frame + fallback positioning.

## G2-19-008-004  [P2] GAP  facet F02  effort S
- Legacy: Legacy viewer width 100% max 1400px `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:12-13`
- vNext now: vNext default modal max 36rem absent explicit max-w override `src/components/ui/dialog.tsx:32-44`
- Fix: Override PDF dialog width to min(100vw,1400px); keep narrow default for other dialogs.

## G2-19-008-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy Modal body maxHeight 80vh, padding 24px unless class overrides `docs/legacy-source/frontend/src/components/Global/ModalContainer/ModalContainer.jsx:26-31` `docs/legacy-source/frontend/src/styles/pages/_courses.scss:1424-1440`
- vNext now: vNext Dialog content ScrollCue p6/md canvas padding and max-height visual viewport minus 3rem `src/components/ui/dialog.tsx:44-54`
- Fix: Apply legacy PDF-specific 80vh desktop body, padding0 and single scroll container.

## G2-19-008-014  [P2] GAP  facet F06  effort M
- Legacy: Props `open`, `onClose`, `pdfUrl`; no input field or direct submit `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:4-11`
- vNext now: vNext Dialog `open`, `onOpenChange`, title, dismissible; no PDF URL prop `src/components/ui/dialog.tsx:11-26`
- Fix: Define typed securePdfUrl/origin + open callbacks rather than accepting arbitrary external URL.

## G2-19-008-021  [P2] GAP  facet F09  effort M
- Legacy: Legacy width100%, max1400 and frame height at least75vh `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:12-22`
- vNext now: vNext default max36rem and viewport-limited scroll `src/components/ui/dialog.tsx:32-45`
- Fix: Create dedicated wide PDF modal, not generic compact item dialog.

## G2-19-008-036  [P2] GAP  facet F16  effort M
- Legacy: Legacy mobile modal full 100dvh with safe-area padding `docs/legacy-source/frontend/src/styles/pages/_courses.scss:1464-1479` `docs/legacy-source/frontend/src/styles/components/_learn-mobile.scss:3301-3318`
- vNext now: vNext Dialog centered with maxHeight viewport minus3rem, mobile scroll body `src/components/ui/dialog.tsx:44-54`
- Fix: Use fullscreen safe-area PDF dialog under 768px, with one scroll region.

## G2-19-008-037  [P2] GAP  facet F16  effort M
- Legacy: Legacy iframe mobile height calc(100dvh-112px-safe areas) `docs/legacy-source/frontend/src/styles/components/_learn-mobile.scss:3390-3399`
- vNext now: vNext no PDF iframe, generic ScrollCue limits content height `src/components/ui/dialog.tsx:44-54`
- Fix: Apply mobile PDF frame height exactly, with landscape browser testing.

## G2-19-008-038  [P2] GAP  facet F17  effort M
- Legacy: Legacy iframe has title PDF Viewer `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:16-18`
- vNext now: vNext Dialog aria-labelledby heading, but no file iframe `src/components/ui/dialog.tsx:39-49`
- Fix: Add titled iframe inside properly named Dialog; test focus navigation into viewer.

## G2-19-008-045  [P2] GAP  facet F20  effort M
- Legacy: Legacy CSS imposes iframe minHeight75vh despite 80vh modal body causing potential overflow `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:21-21` `docs/legacy-source/frontend/src/styles/pages/_courses.scss:1435-1441`
- vNext now: vNext `Dialog` content capped visual viewport and scrolled `src/components/ui/dialog.tsx:44-54`
- Fix: Avoid double scroll while maintaining observed frame height; verify real 375/768/1280 layouts.

## G2-2-037-025  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:377-412 Ant Modal confirmation
- vNext now: src/components/ui/dialog.tsx:26-56 native dialog centered with custom footer
- Fix: Match modal widths, header/footer spacing, danger/button order and ESC handling.

## G2-3-033-035  [P2] GAP  facet F09  effort M
- Legacy: `docs/design/old-lms-shell.css:73-85`
- vNext now: `src/components/ui/dialog.tsx:33-54`
- Fix: Legacy Ant modals centered inset and sizes depend content; vNext default max36rem, 16px margin and measured webview height, verify dialog geometry.

## G2-19-008-007  [P3] GAP  facet F03  effort S
- Legacy: ModalContainer adds `Got it` footer by default `docs/legacy-source/frontend/src/components/Global/ModalContainer/ModalContainer.jsx:44-70`
- vNext now: vNext Dialog renders footer only if passed; roadmap item Dialog passes none `src/components/ui/dialog.tsx:26-26` `src/components/ui/dialog.tsx:54` `src/components/courses/learner-roadmap-item-dialog.tsx:36-40`
- Fix: Include legacy Got it footer action for PDF viewer or explicitly remove on owner-approved design.

## G2-19-008-015  [P3] GAP  facet F06  effort S
- Legacy: Default footer Got it closes via onClose `docs/legacy-source/frontend/src/components/Global/ModalContainer/ModalContainer.jsx:63-69`
- vNext now: vNext dialog has header close but no default footer `src/components/ui/dialog.tsx:51-54`
- Fix: Add close footer matching legacy keyboard order when displayed.

## G2-19-008-029  [P3] GAP  facet F12  effort S
- Legacy: Legacy iframe allows fullscreen `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:23-23`
- vNext now: vNext generic Dialog no fullscreen viewer, only modal `src/components/ui/dialog.tsx:39-55`
- Fix: Preserve allowFullScreen for trusted PDF viewer or explicit fullscreen control.
