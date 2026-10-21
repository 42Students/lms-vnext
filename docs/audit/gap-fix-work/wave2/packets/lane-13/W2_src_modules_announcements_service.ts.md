# Work packet (wave 2): edit src/modules/announcements/service.ts

32 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u014-announcement-search-controller.md, docs/audit/gap2/lane-2/admin-recycle-bin-controller.md, docs/audit/gap2/lane-2/announcement-controller.md, docs/audit/gap2/lane-3/l15-u021-announcement-model.md, docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md

## G2-14-014-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy public-path controller requires auth, mounted /api/v2/announcements/search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:18-23` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:33-55`
- vNext now: New admin announcement list uses separate authenticated API and pages `src/modules/announcements/service.ts:193-252` `src/app/(authenticated)/admin/announcements/page.tsx:33-80`
- Fix: Document new list route as replacement and provide scoped legacy adapter only if callers remain

## G2-14-014-002  [P2] GAP  facet F01  effort M
- Legacy: GET /stats returns global totalAnnouncements to any superadmin `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:58-65`
- vNext now: New list reports filtered page and no matching global stats in mapped service `src/modules/announcements/service.ts:193-252`
- Fix: Provide authorized statistics read with clear tenancy semantics

## G2-14-014-006  [P2] GAP  facet F02  effort S
- Legacy: Legacy result wrapper code/message/data `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:54-55`
- vNext now: New cursor-based items/nextCursor result rather than wrapped search DTO array `src/modules/announcements/service.ts:239-251`
- Fix: Define compatibility response DTO and adapter

## G2-14-014-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy empty search returns popular cached items ordered usage counts `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-125` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:194-219`
- vNext now: New empty q yields latest createdAt desc id desc `src/modules/announcements/service.ts:219-243`
- Fix: Choose popularity rank for autosuggest, recency for admin history

## G2-14-014-030  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET search calls cache.search and returns success wrapper `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:41-56`
- vNext now: New DB-backed admin list with filtered query and cursor `src/modules/announcements/service.ts:193-252`
- Fix: Adapt search field and rank without changing scoped reads

## G2-14-014-032  [P2] GAP  facet F10  effort S
- Legacy: Legacy POST refresh rebuilds from AnnouncementRepository.findAll `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:67-73` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchCache.java:36-63`
- vNext now: New reads directly and uses create/update DB transactions `src/modules/announcements/service.ts:156-190` `src/modules/announcements/service.ts:193-252`
- Fix: Replace cache invalidation with consistent read-after-write

## G2-14-014-038  [P2] GAP  facet F12  effort M
- Legacy: Legacy fuzzy search uses max edit distance2 at query length>=3 `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:163-179`
- vNext now: New exact substring query behavior `src/modules/announcements/service.ts:219-229`
- Fix: Add typo tolerance only to authorized autocomplete

## G2-14-014-050  [P2] GAP  facet F18  effort S
- Legacy: Legacy stats exact key totalAnnouncements `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:58-65`
- vNext now: New admin list exposes items and nextCursor instead `src/modules/announcements/service.ts:239-251`
- Fix: Expose expected stats key if old clients still connect

## G2-14-014-054  [P2] GAP  facet F19  effort M
- Legacy: Legacy empty query sorts cached usage popularity `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:194-219`
- vNext now: New newest-first createdAt desc id desc `src/modules/announcements/service.ts:239-243`
- Fix: Differentiate autosuggest rank from history default ordering

## G2-14-014-058  [P2] GAP  facet F21  effort S
- Legacy: Legacy PostConstruct loads cache and POST refresh reloads `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchCache.java:20-25` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchCache.java:59-63`
- vNext now: New no cache job, direct Drizzle access and readiness flag `src/modules/announcements/service.ts:193-252` `src/modules/announcements/readiness.ts:1-13`
- Fix: Document removal of cache job and operator recovery path

## G2-2-023-037  [P2] GAP  facet F12  effort M
- Legacy: AdminRecycleBinController.java:259-266 only `isDeleted=true` row may be restored
- vNext now: src/modules/announcements/service.ts:316-343 delete status tied to deletedAt/version
- Fix: Implement idempotent invalid-state response for active/deleted transition.

## G2-2-023-041  [P2] GAP  facet F13  effort M
- Legacy: AdminRecycleBinController.java:259-266 not-found/not-deleted errors
- vNext now: src/modules/announcements/service.ts:316-343 idempotent delete; restore behavior separate
- Fix: Distinguish already active vs missing and show reload action.

## G2-2-023-057  [P2] GAP  facet F21  effort M
- Legacy: AdminRecycleBinController.java:61-74 nine repositories, scoped resolver and audit
- vNext now: src/modules/organizations/service.ts, colleges/service.ts, announcements/service.ts separate implementations
- Fix: Centralize registry dispatch; delegate to domain-specific restore services rather than generic bool update.

## G2-2-023-062  [P2] GAP  facet F23  effort M
- Legacy: AdminRecycleBinController.java:279-285 restore activity and result
- vNext now: src/modules/announcements/service.ts:316-343 delete logic; dedicated undo UI
- Fix: Add audit-causality and explicit cascade warning to implementation checklist.

## G2-2-025-064  [P2] GAP  facet F21  effort M
- Legacy: AnnouncementController.java:36-55 references AnnouncementService/AccessControl/ScopeResolution/Audit
- vNext now: src/modules/announcements/service.ts:1-32 direct Drizzle, permission policy and activity
- Fix: Complete mapping of all legacy admin/feed endpoints and audit events.

## G2-15-021-012  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:52-59`
- vNext now: `src/modules/announcements/service.ts:193-221`
- Fix: Legacy recipient-facing time filters distinct from admin list; vNext admin server visibility filters LIVE/SCHEDULED/EXPIRED/DELETED and cursors.

## G2-15-021-021  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:19-47`
- vNext now: `src/modules/announcements/service.ts:156-191`
- Fix: Legacy JPA `save` populates timestamps, vNext create announcement service validates target and inserts event in transaction.

## G2-15-021-022  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:49-50`
- vNext now: `src/modules/announcements/service.ts:193-221`
- Fix: Legacy boolean soft delete, vNext row CAS/version and metadata, generic announcement lifecycle differs.

## G2-15-021-023  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:23-29`
- vNext now: `src/modules/announcements/service.ts:50-123`
- Fix: Legacy receiverValue references many possible tables without FK, vNext resolveTarget enforces active target college/program/dept/class/membership.

## G2-15-021-024  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:36-40`
- vNext now: `src/modules/announcements/service.ts:124-136`
- Fix: Legacy arbitrary senderType string, vNext derived role from verified request context, never arbitrary caller.

## G2-15-021-027  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:52-59`
- vNext now: `src/modules/announcements/service.ts:203-221`
- Fix: Old admin list displays scheduled/expired rows but defaults likely no explicit filter; vNext admin visibility filters and cursor pagination.

## G2-15-021-028  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:23-29`
- vNext now: `src/modules/announcements/service.ts:50-123`
- Fix: Old orphan target receiverValue may be displayable, vNext rejects target if college/program/section/membership inactive.

## G2-15-021-031  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:14-73`
- vNext now: `src/modules/announcements/service.ts:156-191`
- Fix: Legacy entity only stores announcement, vNext service adds activity event / notification delivery under standardized event processing.

## G2-15-021-040  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:42-47`
- vNext now: `src/modules/announcements/service.ts:193-221`
- Fix: Legacy legacy recipients query model vs new cursor-based administrative directory/pagination, benchmark cold-start.

## G2-15-021-044  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:23-29`
- vNext now: `src/modules/announcements/service.ts:50-123`
- Fix: Legacy receiver foreign-key resolution implicit numeric ID, vNext query actively validates normalized target and associated college.

## G2-15-021-049  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:36-40`
- vNext now: `src/modules/announcements/service.ts:124-136`
- Fix: Legacy senderType string+senderId long to derived user roles, require author ID resolution, not blind type cast.

## G2-19-023-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- vNext now: `src/modules/announcements/service.ts:376-481`
- Fix: Legacy one feed of placement-cell notices, vNext generic college notices plus personal placement alerts.

## G2-19-023-013  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:286-294`
- vNext now: `src/modules/announcements/service.ts:469-481`
- Fix: Legacy unbounded pinned then sentAt then id; new SQL limit100 pinned then createdAt and UI filters/pagination 15.

## G2-19-023-029  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:282-294`
- vNext now: `src/modules/announcements/service.ts:376-479`
- Fix: Legacy audience=STUDENTS/recipient subset and sentAt only, new membership recipient/receiver types include college/program/class/learner and storage readiness.

## G2-19-023-030  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:27-29`
- vNext now: `src/modules/announcements/service.ts:376-381`
- Fix: Legacy principal me.getCollegeId/me.getId, vNext active membership and platform user status, reads empty if suspended/inactive.

## G2-19-023-032  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:282-284`
- vNext now: `src/modules/announcements/service.ts:474-479`
- Fix: Legacy `sent_at IS NOT NULL` excludes unsent drafts; vNext scheduledAt null immediately visible from createdAt, so creation/publish lifecycle matters.

## G2-19-023-047  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:286-294`
- vNext now: `src/modules/announcements/service.ts:469-481`
- Fix: Legacy queries all eligible student notices then marks read in batch, new list caps100 and local UI paginates15.
