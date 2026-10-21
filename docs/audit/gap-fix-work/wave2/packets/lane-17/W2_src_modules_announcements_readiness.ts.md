# Work packet (wave 2): edit src/modules/announcements/readiness.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-14/u014-announcement-search-controller.md

## G2-10-002-049  [P2] GAP  facet F11  effort S
- Legacy: Legacy super-admin pages remain visible despite module disabled `docs/legacy-source/frontend/src/components/admin/SuperAdminGroupShell.jsx:12-17`
- vNext now: New runtime DB gate returns announcements unavailable message when flag off `src/app/(authenticated)/admin/announcements/page.tsx:50-63` `src/modules/announcements/readiness.ts:1-13`
- Fix: Differentiate module access from missing DB migration and keep superadmin navigation visible

## G2-14-014-043  [P2] GAP  facet F14  effort S
- Legacy: Legacy refresh reloads DB cache, not import `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchCache.java:59-63`
- vNext now: New runtime readiness depends on registered migration and env gate `src/modules/announcements/readiness.ts:1-13`
- Fix: Document operator readiness procedure instead of refresh control

## G2-14-014-058  [P2] GAP  facet F21  effort S
- Legacy: Legacy PostConstruct loads cache and POST refresh reloads `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchCache.java:20-25` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchCache.java:59-63`
- vNext now: New no cache job, direct Drizzle access and readiness flag `src/modules/announcements/service.ts:193-252` `src/modules/announcements/readiness.ts:1-13`
- Fix: Document removal of cache job and operator recovery path
