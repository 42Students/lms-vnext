# Work packet: edit src/components/courses/learner-course-discussion.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/classroom-controller.md, docs/audit/gap2/lane-3/l12-u009-course-classroom-discussion.md, docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md

## G2-2-033-030  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:336-353 sends and refreshes silently, error toast
- vNext now: src/components/courses/learner-course-discussion.tsx:293-327 POST optimistic local update / error inline
- Fix: Verify sent confirmation, scroll-to-bottom, draft reset order and retry if refresh fails.

## G2-12-009-027  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:350-351`
- vNext now: `src/components/courses/learner-course-discussion.tsx:320-324`
- Fix: Legacy post error toast uses backend response or Failed to post message.; vNext moderationError alert inline, stale reply 409 has specific recovery.

## G2-12-009-028  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:366-367`
- vNext now: `src/components/courses/learner-course-discussion.tsx:389-392`
- Fix: Legacy pin errors toast Failed to update pin state.; vNext error inline and optimistic version validation.

## G2-12-009-029  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:390-392`
- vNext now: `src/components/courses/learner-course-discussion.tsx:345-349`
- Fix: Legacy delete errors toast Failed to delete message. and keeps modal open; vNext inline Discussion deletion failed/Api error and confirm close behavior.

## G2-12-009-030  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:342-348`
- vNext now: `src/components/courses/learner-course-discussion.tsx:301-319`
- Fix: Legacy posts then refreshes full thread and focuses textarea; vNext submits then refetches current page, includes reply target reset.

## G2-19-031-051  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:349-350` — Classroom send failure says Failed to post message.
- vNext now: `src/components/courses/learner-course-discussion.tsx:321-323` — New shows inline friendly API error.
- Fix: Align toast wording for classroom post.

## G2-2-033-029  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:349-353 toast 'Failed to post message.'
- vNext now: src/components/courses/learner-course-discussion.tsx:320-323 moderationError inline
- Fix: Match error placement/toast lifecycle, preserve unsent draft.

## G2-2-033-031  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:363-368 failed pin uses toast 'Failed to update pin state.'
- vNext now: src/components/courses/learner-course-discussion.tsx:389-391 inline 'Discussion moderation failed.'
- Fix: Match legacy pin failure text and toast position/duration.

## G2-2-033-032  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:390-394 failed delete toast 'Failed to delete message.'
- vNext now: src/components/courses/learner-course-discussion.tsx:348 inline 'Discussion deletion failed.'
- Fix: Match error copy/placement and hold modal until error cleared.

## G2-2-033-033  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:230-240 stale refresh says 'Could not refresh the discussion. Showing the last messages we loaded.'
- vNext now: src/components/courses/learner-course-discussion.tsx:407-415 adds 'Discussion refresh failed.' prefix and 'Retry discussion refresh'
- Fix: Keep exact two-part Ant warning title/detail and simple Retry CTA.

## G2-2-037-020  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:230-240 refresh warning separate title/detail
- vNext now: src/components/courses/learner-course-discussion.tsx:407-415 prefixed combined warning
- Fix: Restore exact title/description and Retry label.
