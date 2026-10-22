# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-025-012 [P1] GAP facet F04
- Files: src/modules/colleges/public-signin-policy-service.ts
- Legacy: Legacy loginMethods default EMAIL_PHONE, optionally PHONE_EMAIL, EMAIL_ONLY, PHONE_ONLY; CollegeBranding.java:38-50
- Expected fix: Map mode, order, and disabled option into signin policy migration

## G2-15-009-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx
- Legacy: Multi-class faculty selector uses classId and shallow ?cls navigation (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:60-73`)
- Expected fix: Add multi-section class switcher and preserve dirty draft + deep-link session

## G2-15-004-060 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: Legacy DB-backed server page25 plus 350ms requests for current slice (ProjectsContent.jsx:168-178,205-214)
- Expected fix: Push filtered page and attention aggregation to indexed SQL

## G2-15-006-057 [P1] GAP facet F17
- Files: (none, new feature)
- Legacy: Legacy locked course aria-disabled with readable tooltip reason (CoursesContent.jsx:549-560)
- Expected fix: Make disabled reason announced, avoid focusable broken navigation

## G2-15-008-065 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy lesson content table has active/enabled, quiz V2 separate, class-specific sorted content (syllabusDetail.js:451-466)
- Expected fix: Prove no hidden/inactive or orphan content leaks and all valid quiz rows appear once

## G2-16-005-005 [P1] GAP facet F02
- Files: src/app/(authenticated)/tracker/logs/page.tsx
- Legacy: `logs.js:554-640`: Logs title/actions, health strip, since-last-visit banner, control strip and toggles, summary.
- Expected fix: Rebuild legacy vertical section hierarchy and make Live logs first-class rather than collapsed behind Known errors.

## G2-17-019-041 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: docs/planning/database-parity-db06-history-contract.md:166-170 — Draft explicitly unregistered until readiness.
- Expected fix: No parity claim until migrations and live tests.

## G2-18-006-028 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: Old independent course fetch error `Failed to load course data` + `Calendar events may be incomplete. Please try refreshing the page.` (`ClassScheduleContent.jsx:387-397`).
- Expected fix: Keep grid with partial course-warning fallback.

## G2-19-003-050 [P1] GAP facet F14
- Files: src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Legacy export 10 columns learnerId,name,rollNumber,video and quiz counts, percent `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:212-225`
- Expected fix: Compare exported columns; restore rollNumber and class/course boundaries.

## G2-19-001-020 [P1] GAP facet F05
- Files: src/components/admin/super-admin-student-bulk-access.tsx
- Legacy: Legacy page selection preserved across filtering/pagination `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1578-1583`
- Expected fix: Implement durable ID selection across paginated search results and full selection count.

## G2-19-001-054 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/students/page.tsx, src/components/admin/super-admin-student-bulk-access.tsx
- Legacy: Legacy impersonate/module-access only for superadmin (loginUser id 0 + FACULTY), while other roster actions shown `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:52-56`,600-603,1008-1027
- Expected fix: Check role identification parity and ensure privileged extras remain narrower than ordinary learner management.

## G2-19-001-091 [P1] GAP facet F23
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy allowed destructive delete, impersonation, OTP unlock and profile/audit overlays `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:966-1085`
- Expected fix: Get owner approval for intentional drops; otherwise restore each as individually listed in F03/F09/F10.

## G2-19-001-092 [P1] GAP facet F23
- Files: src/components/admin/super-admin-student-bulk-access.tsx
- Legacy: Legacy bulk toggle offers Placements and Projects `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1534-1543`
- Expected fix: Owner decision needed: preserve historic per-student Placement override or supply safe college-scope migration/message.

## G2-19-015-012 [P1] GAP facet F05
- Files: src/modules/tenant-domains/repository.ts
- Legacy: Legacy activeByCollege query excludes soft-deleted records `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:139-146` `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:7-7`
- Expected fix: Migrate tombstoned domains without allowing accidental reuse before policy settled.

## G2-19-015-025 [P1] GAP facet F10
- Files: src/modules/tenant-domains/service.ts, src/modules/tenant-domains/dns-verifier.ts
- Legacy: Legacy domain verify checks `_42lms-verify.<host>` or `<host>` with token/42lms-verification value `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:58-85`
- Expected fix: Plan old TXT record compatibility during no-migration onboarding/host transfer.

## G2-2-006-057 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LM:17-70 lesson_contents row stores content_data JSON, classId, facultyId, active/enabled, deadline wall-clock, version
- Expected fix: Write field-level migration mapping and preserve versions, audience, content resource payload.

## G2-2-010-004 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: LF:133-151 College Admin fields tagged Read-only and Reload icon
- Expected fix: Restrict College Admin to read-only as legacy or obtain explicit new write-permission decision.

## G2-2-012-034 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LC:140-152 pending ended last7 days, markedAt null, total exact
- Expected fix: Query full rolling 7 days bounded with accurate COUNT(*) instead of silently truncated total.

## G2-2-014-026 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LC:139-144 audit once COURSE_BULK_STATUS_UPDATE if updated>0
- Expected fix: Add summary COURSE_BULK_STATUS_UPDATE event with original requested/updated/failed counts.

## G2-2-018-046 [P1] GAP facet F13
- Files: src/app/(authenticated)/admin/lessons/page.tsx
- Legacy: Lessons.js:460-465 partial failure blocks destructive bulk even when stale prior data shown
- Expected fix: Tie bulk action disabled state to completeness of source query.

## G2-2-002-017 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LC:16-17 property hasText for r2.account.id, ignores credentials and bucket
- Expected fix: Document new all-or-nothing readiness invariant and ensure all provisioning guides reflect it.

## G2-2-001-066 [P1] MISSING facet F21
- Files: (none, new feature)
- Legacy: LI:253-264 agent and importer event types/status provenance
- Expected fix: Add import, agent_update, file_changed/deleted event types with actorKind/source file.

## G2-20-015-025 [P1] GAP facet F14
- Files: (none, new feature)
- Legacy: Stores URLs not file blob, accepts 1..10 image refs [D:11-13,S:66-94]
- Expected fix: Integrate upload grant/complete and authorized read URLs before profile gallery launch

## G2-3-028-018 [P1] MISSING facet F04
- Files: src/modules/colleges/validation.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CollegeDTO.java:38-41`
- Expected fix: Legacy optional collegeChairId and collegeViceChairId have no fields in vNext basic college mutation. Map to role links or explicit decision.

## G2-3-028-019 [P1] MISSING facet F04
- Files: src/modules/colleges/validation.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CollegeDTO.java:43-55`
- Expected fix: Legacy accepts domainHost/domainPrimary with college input; vNext requires separate domain setup. Ensure complete accessible workflow.
