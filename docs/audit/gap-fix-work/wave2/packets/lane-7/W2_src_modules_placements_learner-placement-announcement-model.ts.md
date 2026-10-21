# Work packet (wave 2): edit src/modules/placements/learner-placement-announcement-model.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-announcements.md, docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md

## G2-13-006-011  [P2] GAP  facet F03  effort M
- Legacy: Announcement updated Tag if updated flag or updatedAt truthy (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:56-70`)
- vNext now: New Updated badge iff version >1 and updatedAt>createdAt (`src/modules/placements/learner-placement-announcement-model.ts:48-60`)
- Fix: Preserve event-specific updated truth; avoid date-based false negatives.

## G2-13-006-016  [P2] GAP  facet F04  effort S
- Legacy: Announcement title uses a.title, text body uses a.body (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:63-78`)
- vNext now: New maps title and message, from announcement service (`src/modules/placements/learner-placement-announcement-model.ts:48-53`)
- Fix: Ensure body→message migration and Unicode/newline fidelity.

## G2-13-006-041  [P2] GAP  facet F11  effort M
- Legacy: Legacy announcement can include audience For you based on API payload (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:56-77`)
- vNext now: New allowed receiver types mapped to College/Dept/Program/Class/You labels (`src/modules/placements/learner-placement-announcement-model.ts:25-33`)
- Fix: Verify audience label exactly matches stored targeting including student-group cases.

## G2-13-006-068  [P2] GAP  facet F20  effort M
- Legacy: Old announcement list tolerates missing authorName/sentAt/showUntil (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:72-76`)
- vNext now: New requires valid createdAt and skips invalid publication timestamp (`src/modules/placements/learner-placement-announcement-model.ts:48-60`)
- Fix: Treat invalid dates visibly as unavailable, do not silently hide previously displayed notices.

## G2-13-006-075  [P2] MISSING  facet F23  effort M
- Legacy: Legacy auto-linkifies HTTPS in body and provides Open the drive (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:14-20`)
- vNext now: New body plain and excludes direct jobId-derived link (`src/modules/placements/learner-placement-announcement-model.ts:48-61`)
- Fix: Restore both safe inline body links and authorized job links.

## G2-19-023-010  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:289-294`
- vNext now: `src/modules/placements/learner-placement-announcement-model.ts:48-60`
- Fix: Legacy `body`, sentAt/createdAt, updatedAt, jobId/forYou/linkLabel/linkUrl/unread; vNext message, createdAt, update, sender/audience label and https CTA.

## G2-19-023-012  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:295-301`
- vNext now: `src/modules/placements/learner-placement-announcement-model.ts:25-33`
- Fix: Legacy hide generic ALL/PLACEMENTS forYou label, vNext audienceLabel displays College/You etc.

## G2-19-023-051  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:289-294`
- vNext now: `src/modules/placements/learner-placement-announcement-model.ts:48-60`
- Fix: Legacy UTC sentAt and updateAt; vNext IST day display and seven-day New time differ near midnight.
