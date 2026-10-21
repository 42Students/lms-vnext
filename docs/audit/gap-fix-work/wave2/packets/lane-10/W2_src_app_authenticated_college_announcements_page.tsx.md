# Work packet (wave 2): edit src/app/(authenticated)/college/announcements/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u014-announcement-search-controller.md

## G2-14-014-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy announcement createdAt LocalDateTime `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:42-47`
- vNext now: New timestamptz and en-IN IST read time `src/db/schema/db10-announcements.ts:42-43` `src/app/(authenticated)/college/announcements/page.tsx:93-112`
- Fix: Specify UTC/IST historical timestamp import
