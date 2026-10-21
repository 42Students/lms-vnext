# Work packet: edit src/modules/announcements/service.ts

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u014-announcement-search-controller.md, docs/audit/gap2/lane-2/admin-recycle-bin-controller.md, docs/audit/gap2/lane-2/announcement-controller.md, docs/audit/gap2/lane-3/l15-u021-announcement-model.md, docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md, docs/audit/gap2/lane-6/teacher-notifications.md

## G2-14-014-004  [P1] GAP  facet F01  effort M
- Legacy: Only global SA with no college or org scope can use /search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:45-53`
- vNext now: New SA page can list scoped college or organization under adminListScope `src/modules/announcements/service.ts:137-147` `src/app/(authenticated)/admin/announcements/page.tsx:33-80`
- Fix: Do not silently broaden global-only search; keep explicit selected scope and endpoint compatibility policy

## G2-14-014-014  [P1] GAP  facet F05  effort L
- Legacy: Legacy exact/prefix/word-start/contains/fuzzy scores with Levenshtein <=2 `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:129-187` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:311-351`
- vNext now: New case-insensitive substring title or message search `src/modules/announcements/service.ts:219-228`
- Fix: Implement tenant-safe ranked autosuggest with limited fuzzy fallback

## G2-14-014-022  [P1] GAP  facet F07  effort S
- Legacy: Legacy non-global search returns 403 GLOBAL-only text pointing to /api/v1 scoped APIs `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:45-53`
- vNext now: New admin list is scoped to college/org and does not use legacy 403 text `src/modules/announcements/service.ts:137-147`
- Fix: Set route-specific denial text without leaking global content

## G2-14-014-031  [P1] GAP  facet F10  effort M
- Legacy: Legacy GET stats returns cache.size of all undeleted across tenants `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:58-65` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchCache.java:36-44`
- vNext now: New scoped page has no global count `src/modules/announcements/service.ts:137-147` `src/modules/announcements/service.ts:193-252`
- Fix: Separate aggregate authorized global count from college-scoped metadata

## G2-14-014-033  [P1] GAP  facet F11  effort M
- Legacy: Legacy global search disallows org-scoped and college-scoped SA `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:45-53`
- vNext now: New SA adminListScope permits selected org/college `src/modules/announcements/service.ts:137-147`
- Fix: Decide whether global search is intentionally retired or offered only to true global SA

## G2-14-014-034  [P1] GAP  facet F11  effort M
- Legacy: Legacy /stats requires superadmin but does not require GLOBAL mode `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:58-65`
- vNext now: New adminListScope restricts data based on selected scope `src/modules/announcements/service.ts:137-147`
- Fix: Close global-count disclosure in scoped stats, preserve least privilege

## G2-2-023-029  [P1] GAP  facet F10  effort M
- Legacy: AdminRecycleBinController.java:200-215 selected handler candidates scans only isDeleted=true
- vNext now: src/modules/announcements/service.ts:193-218 supports deletedAt archive filter for announcements
- Fix: Implement generic per-model archived/status eligibility without false positives.

## G2-2-023-059  [P1] GAP  facet F22  effort M
- Legacy: AdminRecycleBinController.java:203-205 checks BaseModel.isDeleted Boolean
- vNext now: src/modules/announcements/service.ts:205-218 uses deletedAt; college service status ARCHIVED
- Fix: Map each table's deletion marker individually.

## G2-2-025-004  [P1] GAP  facet F01  effort M
- Legacy: AnnouncementController.java:219-260 /forLearner and 262-295 /fetchLearnerAnnouncements
- vNext now: src/modules/announcements/service.ts:193-218 admin list; recipient feed separate
- Fix: Match own-feed endpoints and admin read-by-student with server-verified target.

## G2-2-025-040  [P1] GAP  facet F11  effort M
- Legacy: AnnouncementController.java:467-509 scoped superadmin receiver must match college/org
- vNext now: src/modules/announcements/service.ts:137-145 adminScope context, resolveTarget active college
- Fix: Enforce deleted/unresolved target fail-closed, not return unscoped list.

## G2-15-021-048  [P1] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:23-29`
- vNext now: `src/modules/announcements/service.ts:50-123`
- Fix: ReceiverValue numeric and AnnouncementType mappings must be migrated to verified UUID college/program/department/class/membership before tenant-safe reads.

## G2-19-023-025  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- vNext now: `src/modules/announcements/service.ts:376-481`
- Fix: Legacy GET both reads and writes markRead for all visible rows; vNext SSR GET is read-only and separate POST writes one delivered in-app notice.

## G2-19-023-031  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:282-294`
- vNext now: `src/modules/announcements/service.ts:469-481`
- Fix: Legacy audiences ALL=all learners, vNext generic COLLEGE notices visible to all active members; TPO targeted audience enforcement reduces but source may differ.

## G2-6-008-017  [P1] GAP  facet F05  effort M
- Legacy: Old list sorted all records descending by source independent created timestamp `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:228-253` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:569-575`
- vNext now: New personal notification query cursor ordered createdAt/id, announcement separately pinned-first `src/app/(authenticated)/teacher/notifications/page.tsx:37-57` `src/modules/announcements/service.ts:472-481`
- Fix: Define combined sort precedence and stable source-id deduplication

## G2-6-008-019  [P1] GAP  facet F05  effort M
- Legacy: Old fetches every announcement page 100 at a time until totalRecords `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:412-437`
- vNext now: New announcement read max100, no subsequent paging in page `src/app/(authenticated)/teacher/notifications/page.tsx:47-50` `src/modules/announcements/service.ts:472-481`
- Fix: Expose older-announcements paging or documented cap instead of silently dropping history

## G2-6-008-059  [P1] GAP  facet F19  effort M
- Legacy: Old faculty fetchAllPages recursively reads unbounded announcement pages 100 `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:419-437`
- vNext now: New announcements `limit(100)` and no older links `src/modules/announcements/service.ts:472-481`
- Fix: Expose cursor-based historical announcement pagination, initial page cap 100

## G2-6-008-067  [P1] GAP  facet F22  effort L
- Legacy: Old faculty audience receiverType COLLEGE/DEPARTMENT/FACULTY plus NotificationTable personal `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:144-154`
- vNext now: New membership-scoped announcement resolver computes target visibility `src/modules/announcements/service.ts:376-481`
- Fix: Write target-row equivalence tests for college, department, faculty and personal audience visibility

## G2-15-021-018  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:49-50`
- vNext now: `src/modules/announcements/service.ts:193-221`
- Fix: Legacy delete bool mutates row and may return status DELETED, vNext soft-delete metadata and restore path with audit.

## G2-14-014-025  [P3] GAP  facet F08  effort S
- Legacy: Legacy search success response text Announcements retrieved `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:54-56`
- vNext now: New returns structured page without legacy text `src/modules/announcements/service.ts:239-251`
- Fix: Match old text only on backward compatible alias

## G2-14-014-026  [P3] GAP  facet F08  effort S
- Legacy: Legacy stats success text Stats retrieved `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:58-65`
- vNext now: New no equivalent stats success envelope `src/modules/announcements/service.ts:193-252`
- Fix: Use exact success copy if statistics alias retained
