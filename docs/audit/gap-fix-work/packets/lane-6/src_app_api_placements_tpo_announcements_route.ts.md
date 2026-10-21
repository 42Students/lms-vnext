# Work packet: edit src/app/api/placements/tpo/announcements/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-announcements.md, docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-11-005-130  [P1] GAP  facet F22  effort L
- Legacy: Legacy tpo announcements and unread-by persisted on SQL backend `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:208`
- vNext now: vNext announcement/recipient write service uses Drizzle and separate audience tables `src/app/api/placements/tpo/announcements/route.ts:7`
- Fix: Map historical recipients, read receipts and schedule statuses

## G2-11-005-131  [P1] GAP  facet F22  effort M
- Legacy: Legacy DTO `body`,`linkLabel`,`linkUrl`,`pinned`,`audience`,`when` `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:75`
- vNext now: vNext `message`,`buttonLabel`,`buttonUrl`,`pinned`,`sendAt`,`audience` `src/app/api/placements/tpo/announcements/route.ts:13`
- Fix: Document lossless field/status migration

## G2-12-023-025  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:28-30`
- vNext now: `src/app/api/placements/tpo/announcements/route.ts:32-50`
- Fix: Legacy p() assumes authenticated principal and p().getCollegeId; vNext catches authorization/Zod and returns coded form errors with 403/409/503.
