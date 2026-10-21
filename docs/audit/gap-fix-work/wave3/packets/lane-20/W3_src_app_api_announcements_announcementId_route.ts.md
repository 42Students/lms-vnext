# Work packet (wave 3): edit src/app/api/announcements/[announcementId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

## G2-19-024-026  [P1] MISSING  facet F10  effort L
- Legacy: PUT updates title/body/pinned/CTA/showUntil for one source broadcast, not audience; DELETE soft deletes one broadcast; PlacementAnnouncementService.java:391-404
- vNext now: Generic PATCH/DELETE by notice ID, no dedicated broadcast-group write in read broadcaster; announcements/[announcementId]/route.ts:14-50
- Fix: Add scoped group edit/delete, version check and fan-out rollback across college notices.
