# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-3-026-067 [P1] MISSING facet F18
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:146-151`
- Expected fix: Legacy One more step wording for PENDING_HR is not represented in vNext; implement pending state and copy.

## G2-3-026-081 [P1] MISSING facet F23
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:188-192`
- Expected fix: Legacy accepts typed company email when TPO lead has none; vNext intentionally requires persisted email, but no owner-approved drop reason found.

## G2-3-026-082 [P1] MISSING facet F23
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:146-153`
- Expected fix: Legacy existing-account pending consent view omitted without stated owner decision; do not silently treat this as finished parity.

## G2-4-014-042 [P1] GAP facet F11
- Files: src/modules/colleges/service.ts
- Legacy: All routes require authenticated principal, with global Super Admin orgless access. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:38-63`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:86-98`)
- Expected fix: Map roles and global/selected org/college scoping for all endpoints.

## G2-4-014-047 [P1] GAP facet F12
- Files: src/modules/colleges/service.ts
- Legacy: Cache stores all nondeleted colleges and excludes isDeleted true. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:102-115`)
- Expected fix: Confirm archived status exactly maps isDeleted, no deleted leaks.

## G2-4-014-078 [P1] GAP facet F22
- Files: src/modules/colleges/service.ts
- Legacy: Legacy isDeleted flag excludes archived at cache load. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:102-115`)
- Expected fix: Confirm migration of isDeleted semantics and archive/restore consistency.

## G2-4-032-051 [P1] GAP facet F15
- Files: src/modules/notifications/zeptomail-email.ts
- Legacy: DEV_MAIL_ALLOW nonprod mail recipients, rejects undefined template (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:36-40,114-125`)
- Expected fix: Apply dev allowlist per event and explicit configured provider template validation.

## G2-4-033-025 [P1] GAP facet F10
- Files: src/modules/notifications/zeptomail-email.ts, src/modules/messaging/providers.ts
- Legacy: Legacy ZeptoMail send overload supports senderName, replyTo, fromAddress `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:99-109`
- Expected fix: Extend per-message sender/reply-to safely for college-scoped placements mail.

## G2-4-033-032 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy upload video max 5GiB and accepts mp4/webm/mov/m4v `docs/architecture/file-and-video-storage.md:15`
- Expected fix: Either add multipart or show exact reduced limit preselection; never promise 5GiB.

## G2-14-027-015 [P1] GAP facet F06
- Files: src/modules/courses/teaching-assignment-batch-service.ts
- Legacy: Legacy course list can include multiple arbitrary courseIds across department `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:38-48`
- Expected fix: Partition old bulk requests by class/term with explicit partial failure reporting.

## G2-14-027-025 [P1] GAP facet F10
- Files: src/modules/courses/teaching-assignment-batch-service.ts
- Legacy: POST /createBulk flattens all faculty/course lists, saves all entities `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:75-87`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:77-95`
- Expected fix: Support explicit multi-faculty workflow or document intentional limitation.

## G2-4-017-035 [P1] GAP facet F08
- Files: src/modules/projects/readiness-override-service.ts
- Legacy: Legacy readiness override persisted with actor/note/time. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:107-117`)
- Expected fix: Ensure long-lived override state and latest event history survive retention/compaction.

## G2-4-017-071 [P1] GAP facet F22
- Files: src/modules/projects/readiness-override-service.ts
- Legacy: Legacy readiness override fields on workspace row. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:107-117`)
- Expected fix: Ensure audit retention cannot unexpectedly reset active override.

## G2-4-023-002 [P1] GAP facet F01
- Files: src/modules/placements/tpo-companies-view-service.ts, src/app/(authenticated)/tpo/companies/page.tsx
- Legacy: GET /search?q used to search curated and known global companies with college context (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:47-50`)
- Expected fix: Expose a scoped global curated/company discovery query for drive company selection.

## G2-4-023-017 [P1] GAP facet F05
- Files: src/modules/placements/tpo-companies-view-service.ts
- Legacy: Legacy search function returns matches from curated list plus known companies (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:22-24,47-50`)
- Expected fix: Index canonical company search by name/domain; preserve search relevance and no duplicate names.

## G2-4-028-021 [P1] MISSING facet F06
- Files: src/app/(authenticated)/tpo/team/page.tsx
- Legacy: Remove flow checks ownership impact before submit (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:79-86`)
- Expected fix: Restore impact gated removal and reassignment.

## G2-4-028-058 [P1] GAP facet F22
- Files: src/modules/placements/tpo-settings-people-service.ts
- Legacy: Settings TeamPeople has writable team member model (`docs/legacy-source/frontend/src/pages/tpo/settings.js:152`)
- Expected fix: Register underlying assignment schema and mutation services.

## G2-5-001-022 [P1] GAP facet F07 Validation and errors
- Files: src/app/(authenticated)/college/attendance/page.tsx
- Legacy: Options failure alert 'Couldn't load classes/courses for this college' with retry; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:487-490
- Expected fix: Catch options fetch failure, show inline error and Retry without replacing whole page.

## G2-5-005-071 [P1] GAP facet F23 Extra/dropped
- Files: (none, new feature)
- Legacy: Legacy day cards only for events (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:74-124)
- Expected fix: Switch default wide layout back to legacy agenda or place as separate opt-in.

## G2-5-007-072 [P1] GAP facet F23 Extra/dropped
- Files: (none, new feature)
- Legacy: Wrapper callback discards applicationId despite child supplying it (docs/legacy-source/frontend/src/pages/superadmin/calendar.js:12-18)
- Expected fix: Fix both application ID propagation and current route deep-link.

## G2-5-009-054 [P1] GAP facet F14 Exports
- Files: (none, new feature)
- Legacy: CSV Student, day1..N; empty if no class; ratio multi-session (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:451-463)
- Expected fix: Export screen-equivalent values and exact columns.

## G2-5-010-002 [P1] GAP facet F01 Purpose/entry/navigation
- Files: src/components/academics/college-section-lifecycle-action.tsx
- Legacy: Legacy Edit/Schedule/Delete inline row navigation (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:407-425)
- Expected fix: Restore full Edit, recurring Schedule, guarded Delete.

## G2-5-013-018 [P1] GAP facet F06
- Files: src/modules/placements/tpo-drive-edit-service.ts
- Legacy: Legacy extension modifies importantDates labeled Application deadline then re-derives applicationDeadline (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:45-50`)
- Expected fix: Synchronize deadline important-date list and canonical field during extension

## G2-5-013-035 [P1] GAP facet F10
- Files: src/modules/placements/tpo-drive-edit-service.ts
- Legacy: Legacy updateJob edits current job with version conflict check (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:641-660`)
- Expected fix: Match allowed edits for PUBLISHED jobs or explicitly preserve approved restriction with UI notice

## G2-5-013-036 [P1] GAP facet F10
- Files: src/modules/placements/tpo-drive-edit-service.ts
- Legacy: Legacy extendApplicationDeadline special method preserves importantDates derived field (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:591-638`)
- Expected fix: Implement atomic deadline+importantDates consistency
