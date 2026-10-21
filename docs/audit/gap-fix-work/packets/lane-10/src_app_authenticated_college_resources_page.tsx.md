# Work packet: edit src/app/(authenticated)/college/resources/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-001  [P1] GAP  facet F01  effort M
- Legacy: Single `/college-admin/lesson-content` route chooses Resources for `type=resources`, otherwise shared Video/Live Lessons view; defaults Video (`college-admin/lesson-content.js:34-38`; `LessonContent.js:102-125`).
- vNext now: Separate `/college/videos`, `/college/resources`, `/college/live-classes` routes (`college/videos/page.tsx:13-45`; `college/resources/page.tsx:14-44`; `college/live-classes/page.tsx:14-41`).
- Fix: Legacy-path redirect preserving `type=video\|live-classes\|resources`; default Videos.

## G2-18-007-062  [P1] GAP  facet F13  effort M
- Legacy: Old failed refresh retains current rows, `Couldn't refresh resources` warning and Retry (`AdminResources.js:137-169,363-373`).
- vNext now: New SSR list failure cannot preserve last-good client rows (`college/resources/page.tsx:33-38`).
- Fix: Cache last scoped rows and show nonblocking error/Retry.

## G2-18-007-045  [P2] GAP  facet F08  effort M
- Legacy: Old Resource error `Could not load courses` and `Could not load lessons` separate Alerts (`AdminResources.js:89-133,329-334`).
- vNext now: New options error causes failure of server page, not isolated child Alert (`college/resources/page.tsx:33-38`; `college-content-authoring-service.ts:11-42`).
- Fix: Render partial page with legacy dependency alerts and refresh action.
