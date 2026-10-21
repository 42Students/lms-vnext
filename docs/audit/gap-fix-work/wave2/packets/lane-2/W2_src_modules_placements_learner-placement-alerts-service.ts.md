# Work packet (wave 2): edit src/modules/placements/learner-placement-alerts-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-announcements.md, docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md

## G2-13-006-022  [P2] GAP  facet F05  effort S
- Legacy: Legacy update order is API array (no additional sort) (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:62-71`)
- vNext now: New alerts DB sorted createdAt desc then id (`src/modules/placements/learner-placement-alerts-service.ts:24-40`)
- Fix: Confirm old overview sort and preserve if different.

## G2-19-023-048  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:304-309`
- vNext now: `src/modules/placements/learner-placement-alerts-service.ts:44-59`
- Fix: Legacy DB COUNT all unread placement notices, new personal alert count indexed in-app notifications, no same independent college notice count.
