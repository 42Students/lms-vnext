# Work packet: edit src/modules/announcements/tpo-placement-write-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md, docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-12-023-012  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:37-76`
- vNext now: `src/modules/announcements/tpo-placement-write-service.ts:16-37`
- Fix: Legacy Audience ALL means learners in college and defaults PLACEMENTS in old composer, while vNext COLLEGE audience includes active college memberships beyond learners; inspect notification target eligibility.

## G2-19-031-047  [P3] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:613-621` — Announcement title/body server uses Give the announcement a title and Keep it under 8000 characters.
- vNext now: `src/modules/announcements/tpo-placement-write-service.ts:16-36` — Zod validation messages do not all match legacy phrasing.
- Fix: Render field-level exact copy; preserve draft.
