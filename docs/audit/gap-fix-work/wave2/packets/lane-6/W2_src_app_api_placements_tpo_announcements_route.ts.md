# Work packet (wave 2): edit src/app/api/placements/tpo/announcements/route.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-announcements.md, docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-11-005-071  [P2] GAP  facet F10  effort S
- Legacy: POST /api/v1/tpo/announcements JSON title/body/pinned/audience `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:209`
- vNext now: POST /api/placements/tpo/announcements HTML FormData with title/message/pinned/audience `src/app/api/placements/tpo/announcements/route.ts:9`
- Fix: Map body/message field and response statuses

## G2-11-005-133  [P2] GAP  facet F22  effort S
- Legacy: Legacy SEND state supports delayed Undo `docs/legacy-source/frontend/src/pages/tpo/announcements.js:54`
- vNext now: vNext createTpoNotice returns id and redirection `src/app/api/placements/tpo/announcements/route.ts:33`
- Fix: Verify committed delivery/frozen audience recipients

## G2-12-023-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:50-71`
- vNext now: `src/app/api/placements/tpo/announcements/route.ts:9-36`
- Fix: Legacy POST create, PUT/{id}, DELETE/{id}, POST/{id}/undo; vNext POST form create plus separate /edit and /lifecycle POST actions with UUID and version.

## G2-12-023-014  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:64-76`
- vNext now: `src/app/api/placements/tpo/announcements/route.ts:14-30`
- Fix: Legacy Draft body/email/notify/tellAgain fields; vNext FormData message/pinned/buttonLabel/buttonUrl, no email toggle in create.

## G2-12-023-034  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:33-53`
- vNext now: `src/app/api/placements/tpo/announcements/route.ts:9-36`
- Fix: Legacy JSON REST GET/POST with direct DTO responses; vNext server read and same-origin FormData POST with action redirects.
