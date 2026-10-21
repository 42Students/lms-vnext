# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/announcements/page.tsx (part 2 of 2)

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md

## G2-19-023-042  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:289-301`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:189-224`
- Fix: Old compact pinned-first feed and read chips, new larger heading/badge/content/actions cards.

## G2-19-023-045  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:289-301`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:192-209`
- Fix: Legacy 'Placement cell' plus forYou narrowed text, vNext 'Issued by Placement cell · For College/You' copy.

## G2-19-023-046  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:33-39`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:90-91`
- Fix: Legacy Announcements tab unread badge does not map to new 'Updates about you (N unread)' heading.
