# Work packet (wave 2): edit src/modules/announcements/visibility-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l15-u021-announcement-model.md

## G2-15-021-020  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:52-68`
- vNext now: `src/modules/announcements/visibility-model.ts:1-10`
- Fix: Legacy admin can inspect upcoming/expired regardless of recipient visibility; vNext list visibility filter default and selected state may rearrange.
