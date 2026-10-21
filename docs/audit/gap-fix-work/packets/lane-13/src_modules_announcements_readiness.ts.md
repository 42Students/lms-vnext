# Work packet: edit src/modules/announcements/readiness.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u014-announcement-search-controller.md

## G2-14-014-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy cache load catches errors and leaves empty/stale list `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchCache.java:36-47`
- vNext now: New DB read can fail and readiness gate deactivates page `src/modules/announcements/readiness.ts:1-13` `src/app/(authenticated)/college/announcements/page.tsx:34-65`
- Fix: Display retryable database error distinct from no announcements
