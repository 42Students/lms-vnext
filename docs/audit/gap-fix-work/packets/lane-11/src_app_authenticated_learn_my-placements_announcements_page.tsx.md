# Work packet: edit src/app/(authenticated)/learn/my-placements/announcements/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-announcements.md, docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md

## G2-13-006-010  [P1] GAP  facet F03  effort M
- Legacy: Announcement New tag only when API unread true (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:56-70`)
- vNext now: New New Badge whenever created less than seven days ago (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:192-197`)
- Fix: Determine unread from real read receipt; avoid false New status.

## G2-13-006-021  [P1] GAP  facet F05  effort M
- Legacy: Legacy updates list shows all placement overview notices except PLACEMENT_ANNOUNCEMENT (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:38-39`)
- vNext now: New loads most recent 20 persisted in_app_notifications (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:76-79`)
- Fix: Map overview notice sources fully; do not hide older action updates silently.

## G2-13-006-031  [P1] GAP  facet F08  effort M
- Legacy: Opening announcements dispatches placement-announcements-read event (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:31-36`)
- vNext now: New server read does not automatically mark viewed notices read (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:58-79`)
- Fix: Trigger authorized per-notice read acknowledgment on view and keep unread badge count in sync.

## G2-13-006-044  [P1] GAP  facet F12  effort S
- Legacy: Legacy new flag based on unread state (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:56-68`)
- vNext now: New New based on recency <7 days not read state (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:192-197`)
- Fix: Use durable unread state, recency optional as separate metadata.

## G2-13-006-053  [P1] GAP  facet F15  effort M
- Legacy: Old load dispatches custom read event for announcement bell count (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:31-36`)
- vNext now: New explicit per-notice TpoNoticeAcknowledge and unread counts from notifications (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:209-209`)
- Fix: Test bell count after opening list/marking read, ensure same notification source.

## G2-13-006-064  [P1] GAP  facet F19  effort M
- Legacy: Old fetches all announcements and entire overview notices; all displayed (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:31-40`)
- vNext now: New announcements paginated to 15 and personal alerts limited to 20 (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:70-79`)
- Fix: Avoid hiding old notices and action updates without obvious history links/counters.

## G2-13-006-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy malformed API response becomes empty array, not parsing exception (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:31-40`)
- vNext now: New service uses parsed membership and optional source fallback availability (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:58-78`)
- Fix: Distinguish bad payload from valid empty; give retry on incomplete data.

## G2-13-006-028  [P2] GAP  facet F07  effort S
- Legacy: Any failed announcement or overview fetch sets error true; partial list still displayed (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:31-40`)
- vNext now: New independent warnings for college notices vs personal alerts (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:170-181`)
- Fix: Preserve partial results but exact error semantics.

## G2-13-006-030  [P2] GAP  facet F08  effort S
- Legacy: One shared red error alert Couldn't load everything with Retry (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:51-51`)
- vNext now: New warnings College notices temporarily unavailable and Personal alerts temporarily unavailable (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:170-181`)
- Fix: Restore legacy banner wording for cross-source error while retaining source-specific details.

## G2-19-023-018  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:27-29`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:52-59`
- Fix: Legacy non-learner gets []/unread0 rather than forbidden, vNext throws AuthorizationError placements.read.

## G2-19-023-022  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:35-39`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:84-91`
- Fix: Legacy {unread:n} JSON, vNext overview counts personal notification events; message and scope differ.
