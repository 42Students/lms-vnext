# Work packet: edit src/modules/announcements/validation.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u014-announcement-search-controller.md, docs/audit/gap2/lane-2/announcement-controller.md, docs/audit/gap2/lane-3/l15-u021-announcement-model.md

## G2-14-014-023  [P2] GAP  facet F07  effort S
- Legacy: Legacy empty query is valid for popular results `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-125`
- vNext now: New explicit empty q fails min1 validation `src/modules/announcements/validation.ts:65-79`
- Fix: Convert empty q to no filter and show suggestions

## G2-2-025-022  [P2] GAP  facet F07  effort M
- Legacy: AnnouncementCreateRequest.java:12-24 exact Receiver type/value/Title/Message required errors
- vNext now: src/modules/announcements/validation.ts:24-37 Zod generic min errors
- Fix: Show exact field validation copy and bound messages.

## G2-15-021-015  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:30-34`
- vNext now: `src/modules/announcements/validation.ts:24-28`
- Fix: Legacy blank/oversize title/message allowed at entity layer; vNext Zod required/limited with different API errors.
