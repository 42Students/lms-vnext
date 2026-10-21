# Work packet (wave 2): edit src/app/(authenticated)/college/live-classes/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-005  [P2] GAP  facet F02  effort M
- Legacy: Video/Live old two equal columns (`Col lg=12`) with create card and Existing Content card (`LessonContent.js:1144-1147,1571-1575`).
- vNext now: New vertical PageHeader, authoring section, aggregate (`college/videos/page.tsx:33-44`; `college/live-classes/page.tsx:26-40`).
- Fix: Restore side-by-side cards at lg and stacked mobile composition.

## G2-18-007-009  [P3] GAP  facet F03  effort S
- Legacy: Old Live H1 `Live classes`, help `Schedule a live class with a meeting link on a lesson.` (`LessonContent.js:111-114,1131-1147`).
- vNext now: New title `Live Classes` plus saved sessions note (`college/live-classes/page.tsx:26-28`).
- Fix: Match sentence case and exact authoring helper text.
