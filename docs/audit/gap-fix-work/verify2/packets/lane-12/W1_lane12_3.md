# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-13-013-030 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/lessons/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:82-93` stats only when global superadmin (collegeId and orgId null)
- Expected fix: Add global readonly stats permission separate from selected-college course management

## G2-18-021-007 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Seven DTO properties jobId,jobTitle,companyName,label,date,eventType,type (DTO:15-29)
- Expected fix: Crosswalk all seven fields; preserve label/type separately from generated display title

## G2-19-026-011 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: PUT one node allows null enabled to clear override and nullable locked to leave lock unchanged (controller:94-130; ModuleAccessUpdateRequest:8-21)
- Expected fix: Ensure editing enabled preserves existing lock absent explicit lock change; clearing override deletes both

## G2-14-002-094 [P1] GAP facet F22
- Files: src/modules/admin-ui/super-admin-scoped-people-service.ts
- Legacy: Legacy learner flat entity fields, vNext users+membership+profiles+enrollments normalized; projection loses some old columns — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:535-578`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-957`
- Expected fix: Create explicit field-by-field mapping including null and multi-section behavior

## G2-15-001-002 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: Course card targets `/teacher/courses/{slug\|\|id}/home?cls={classId}` and adds `ref=course` absent slug (courseListingUtils.js:7-30).
- Expected fix: Ensure legacy bookmarks/slug and cls links redirect to the exact authorized delivery; document mapping and 404 behaviour.

## G2-15-004-061 [P1] GAP facet F19
- Files: src/app/(authenticated)/learn/projects/page.tsx
- Legacy: Legacy API filtering before pagination (`ProjectWorkspaceController.java:91-101`)
- Expected fix: Preserve total, page size and stable filtered page via DB

## G2-15-006-061 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: Legacy course GET for one selected semester, 48 cards and client search (CoursesContent.jsx:117-126,283-288)
- Expected fix: Bound listing DB calls to selected period/page; avoid O(all historic courses) expensive workspace expansion

## G2-15-008-066 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy completion progress authority getLessonContentProgress and learner submitted assignment list (syllabusDetail.js:119-137,494-515)
- Expected fix: Compare cutoff/rounding and authoritative read flags; avoid marking missing API data complete

## G2-16-005-044 [P1] GAP facet F10
- Files: src/app/(authenticated)/tracker/logs/page.tsx
- Legacy: `SuperAdminLogsController.java:201-234`: deploy marker, health, digest and Telegram endpoints.
- Expected fix: Expose deploy markers, health comparisons and digest where supported or document dropped integration.

## G2-16-021-016 [P1] GAP facet F10
- Files: src/modules/activity/service.ts
- Legacy: AdminAuditLog.java:25-61 writes actor IP/UA/action/entity/payload.
- Expected fix: Ensure all old mutation points emit event parity incl login/privileged action.

## G2-16-022-004 [P1] MISSING facet F03
- Files: src/components/tpo/tpo-public-join-link-card.tsx
- Legacy: TpoPublicLinkController.java:39-51 GET,new/save toggles.
- Expected fix: Add Post directly toggle.

## G2-16-022-025 [P1] GAP facet F14
- Files: src/components/tpo/tpo-public-join-link-card.tsx
- Legacy: CollegePublicLinkService.java:67-80 existing token re-shown.
- Expected fix: Restore safe reuse or explicit new-link recovery.

## G2-17-006-018 [P1] GAP facet F06
- Files: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:73-75 preserves query exactly during numeric→slug replace.
- Expected fix: If old URLs supported, preserve the exact tab/query across ID conversion.

## G2-18-012-026 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Legacy CRUD service supports findById/fetch/class/course/recipient and write endpoints (`NotificationService.java:13-57`).
- Expected fix: Publish explicit API parity matrix for authoring/admin and recipient feeds.

## G2-18-004-024 [P1] GAP facet F05
- Files: src/app/(authenticated)/learn/notifications/page.tsx, src/components/activity/learner-notifications-inbox.tsx
- Legacy: Legacy category counts based on complete fetched data (class notices up to 2000) not viewport. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-391`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:560-567`
- Expected fix: Use full counts via SQL or label preview count accurately, offer unlimited cursor history.

## G2-18-004-027 [P1] GAP facet F05
- Files: src/app/(authenticated)/learn/notifications/page.tsx, src/components/activity/learner-notifications-inbox.tsx
- Legacy: Legacy source notices are class and college announcements fetched separately, merged. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-409`
- Expected fix: Audit class broadcast delivery parity: ensure class/course notices are fanned out to learner user IDs.

## G2-18-004-034 [P1] GAP facet F07
- Files: src/app/(authenticated)/learn/notifications/page.tsx, src/components/activity/learner-notifications-inbox.tsx
- Legacy: Legacy class notifications failing alone says `Couldn't load class notifications`; other notices remain. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:403-408`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:646-656`
- Expected fix: If class notices separate, preserve partial failure warning with Retry.

## G2-18-004-045 [P1] GAP facet F09
- Files: src/components/activity/learner-notifications-inbox.tsx
- Legacy: Legacy detail footer context CTA uses window.open noopener noreferrer for external assessment. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:72-83`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:715-734`
- Expected fix: Offer safe approved assessment link with noreferrer and explicit external origin display.

## G2-18-004-047 [P1] GAP facet F10
- Files: src/app/(authenticated)/learn/notifications/page.tsx, src/components/activity/learner-notifications-inbox.tsx
- Legacy: Legacy GET classId class notifications paged 200 x up to10, max2000. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-391`
- Expected fix: Add paginated history with accurate counts and preserve up to2000 listing equivalence where needed.

## G2-18-004-071 [P1] GAP facet F15
- Files: src/app/(authenticated)/learn/notifications/page.tsx, src/components/activity/learner-notifications-inbox.tsx
- Legacy: Legacy broadcast is SSE-pushed after create and updated/deleted notification changes. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:145-163`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:218-249`
- Expected fix: Add scoped polling or push refresh compatible with SSE arrival expectations.

## G2-18-004-084 [P1] GAP facet F19
- Files: src/app/(authenticated)/learn/notifications/page.tsx, src/components/activity/learner-notifications-inbox.tsx
- Legacy: Legacy class notice fetch loops at most 10 pages x200, can be ~2,000 rows. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-391`
- Expected fix: Show cap and total count; cursor-paginate or virtualize long inbox.

## G2-19-013-009 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-scoped-people-service.ts
- Legacy: Legacy FacultySearchDTO fields id, firstName,lastName,uniqueId,contactMail,mobile,facultyType,deptId,orgId,collegeId `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchDTO.java:20-32`
- Expected fix: Map exact faculty entity fields to UUID memberships without dropping required institution IDs.

## G2-19-013-058 [P1] GAP facet F22
- Files: src/modules/admin-ui/super-admin-scoped-people-service.ts
- Legacy: Legacy FacultySearchDTO numeric faculty/college/dept IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchDTO.java:20-32`
- Expected fix: Map faculty primary key to membership UUID; validate one user across colleges.

## G2-19-013-059 [P1] GAP facet F22
- Files: src/modules/admin-ui/super-admin-scoped-people-service.ts
- Legacy: Legacy faculty type enum and first/last contact fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchDTO.java:20-32`
- Expected fix: Reconcile faculty title/type and contact normalization in migration.

## G2-19-019-071 [P1] GAP facet F23
- Files: src/app/(authenticated)/college/faculty-assignment/page.tsx, src/app/(authenticated)/admin/faculty-assignment/page.tsx
- Legacy: Old page offers change faculty, course, class, batch, semester, year and active in one edit modal. `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-592`
- Expected fix: Do not mark editing parity satisfied until every old field can be changed or a supported transition is documented.
