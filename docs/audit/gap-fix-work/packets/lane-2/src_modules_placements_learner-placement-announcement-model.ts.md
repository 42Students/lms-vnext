# Work packet: edit src/modules/placements/learner-placement-announcement-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-announcements.md

## G2-13-006-015  [P1] MISSING  facet F03  effort M
- Legacy: Announcement with jobId offers Open the drive link (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:79-83`)
- vNext now: New derives no jobId in learnerPlacementNoticeFeed; no Open the drive (`src/modules/placements/learner-placement-announcement-model.ts:48-61`)
- Fix: Expose verified jobId and link authorized drive details where original linked.

## G2-13-006-071  [P1] GAP  facet F22  effort L
- Legacy: Old announcement payload fields pinned, unread, updated, authorName, forYou, showUntil, jobId, linkUrl (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:54-83`)
- vNext now: New fields isPinned, createdAt, version, senderType, receiverType, buttonUrl; no unread/jobId (`src/modules/placements/learner-placement-announcement-model.ts:1-61`)
- Fix: Build schema/field migration crosswalk, restore read status + action job mapping.

## G2-13-006-073  [P1] GAP  facet F22  effort L
- Legacy: Legacy unread/read state in announcement source (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:56-68`)
- vNext now: New announcement feed loses per-membership unread state (`src/modules/placements/learner-placement-announcement-model.ts:48-61`)
- Fix: Connect per-member read receipt to New badge and mark-as-read.
