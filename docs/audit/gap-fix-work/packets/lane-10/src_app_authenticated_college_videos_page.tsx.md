# Work packet: edit src/app/(authenticated)/college/videos/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-001  [P1] GAP  facet F01  effort M
- Legacy: Single `/college-admin/lesson-content` route chooses Resources for `type=resources`, otherwise shared Video/Live Lessons view; defaults Video (`college-admin/lesson-content.js:34-38`; `LessonContent.js:102-125`).
- vNext now: Separate `/college/videos`, `/college/resources`, `/college/live-classes` routes (`college/videos/page.tsx:13-45`; `college/resources/page.tsx:14-44`; `college/live-classes/page.tsx:14-41`).
- Fix: Legacy-path redirect preserving `type=video\|live-classes\|resources`; default Videos.

## G2-18-007-058  [P1] GAP  facet F12  effort L
- Legacy: Old video tab admits VIDEO and YOUTUBE, live-only LIVE_CLASS (`LessonContent.js:92-125`).
- vNext now: New catalogue can list both formats but authoring only YOUTUBE (`college-content-aggregate-service.ts:122-125`; `college/videos/page.tsx:32-37`).
- Fix: Make VIDEO write possible or mark explicitly unsupported with migration strategy.

## G2-18-007-064  [P1] GAP  facet F13  effort M
- Legacy: Old video dependency errors show Courses/Faculty/Lessons/Sections unavailable with Retry (`LessonContent.js:1148-1155`).
- vNext now: New server options error flows outside inline authoring; only No lessons message handled (`college/videos/page.tsx:32-37`; `college-content-authoring-control.tsx:153-158`).
- Fix: Add independent dependency error states/retry in authoring card.
