# Work packet: edit src/app/(authenticated)/college/live-classes/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-001  [P1] GAP  facet F01  effort M
- Legacy: Single `/college-admin/lesson-content` route chooses Resources for `type=resources`, otherwise shared Video/Live Lessons view; defaults Video (`college-admin/lesson-content.js:34-38`; `LessonContent.js:102-125`).
- vNext now: Separate `/college/videos`, `/college/resources`, `/college/live-classes` routes (`college/videos/page.tsx:13-45`; `college/resources/page.tsx:14-44`; `college/live-classes/page.tsx:14-41`).
- Fix: Legacy-path redirect preserving `type=video\|live-classes\|resources`; default Videos.
