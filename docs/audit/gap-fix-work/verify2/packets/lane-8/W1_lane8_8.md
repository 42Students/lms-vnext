# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-004-041 [P1] GAP facet F12 Business rules
- Files: (none, new feature)
- Legacy: Missing end-time falls back to start-time to derive MISSED (docs/legacy-source/frontend/src/pages/mentor/calendar.js:55-63)
- Expected fix: Use startsAt fallback if historical end missing.

## G2-5-007-018 [P1] GAP facet F04 Data formatting
- Files: (none, new feature)
- Legacy: Per-appointment status badge (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:513-535)
- Expected fix: Distinguish appointment state from parent round lifecycle.

## G2-5-008-015 [P1] GAP facet F04 Data formatting
- Files: src/modules/academics/college-structure-directory-service.ts
- Legacy: Program/batch missing name Name unavailable (ID X) (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:391-398)
- Expected fix: Show orphan records and explicit Name unavailable fallback.

## G2-5-008-076 [P1] GAP facet F22 Data/migrations
- Files: src/modules/academics/college-section-mutation-model.ts
- Legacy: Class entity programId,batchId,lower/upperLimit,description (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48)
- Expected fix: Document migration lower limit, ID mapping, period inference.

## G2-5-009-028 [P1] GAP facet F07 Validation/errors
- Files: (none, new feature)
- Legacy: Options unavailable shows Retry and says couldn't load classes/courses (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:487-490)
- Expected fix: Catch lookup failure inside page, provide scoped Retry.

## G2-5-010-020 [P1] GAP facet F05 Tables/lists
- Files: src/modules/academics/college-section-mutation-model.ts
- Legacy: Page size options 10/25/50/100, default25 preference saved (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:499-505)
- Expected fix: Set default 25, fix label and persist size.

## G2-5-010-055 [P1] GAP facet F13 States
- Files: src/components/academics/college-structure-directory.tsx
- Legacy: TableSkeleton8x8 initial loading, RefreshStatus on refetch (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:496-509)
- Expected fix: Implement loading skeleton + refresh with stale data.

## G2-5-010-079 [P1] GAP facet F23 Extra/dropped
- Files: (none, new feature)
- Legacy: Recurring modal integral to component (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:526-599)
- Expected fix: Restore entry modal for pixel-level clone.

## G2-5-014-002 [P1] GAP facet F01
- Files: src/modules/academics/section-service.ts
- Legacy: Legacy /search allows scoped program filter and global superadmin no-program discovery (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:71-108`)
- Expected fix: Add scoped cross-cohort search picker with explicit program filter

## G2-5-014-028 [P1] GAP facet F07
- Files: src/modules/academics/section-service.ts
- Legacy: Legacy absent tenant for non-global raises Tenant scope not available (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:51-63`)
- Expected fix: Fail closed on missing selected tenant; present exact recovery without leaking names

## G2-5-014-049 [P1] GAP facet F11
- Files: src/modules/academics/section-service.ts
- Legacy: Legacy refresh restricted to superadmin requireSuperAdmin (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:231-239`)
- Expected fix: Never use section management permission as replacement for cache refresh privilege

## G2-5-017-024 [P1] GAP facet F09
- Files: src/components/projects/super-admin-template-rollback-control.tsx
- Legacy: Legacy Popconfirm warns publication state travels with snapshot `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:118-138,205-232`
- Expected fix: Align warning to actual rollback semantics and explain publication-state difference.

## G2-5-021-004 [P1] GAP facet F03
- Files: src/modules/academics/college-batch-promotion-service.ts
- Legacy: Legacy batch currentStudents server-computed from primary SECTION class `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:85-91`
- Expected fix: Count only intended cohort/section membership, avoid double-count.

## G2-5-021-018 [P1] GAP facet F06
- Files: src/modules/academics/cohort-service.ts
- Legacy: Legacy create DTO startDate/endDate, name/program/status/year `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:73-103`
- Expected fix: Provide date/academic year mapping, status/default equivalence.

## G2-5-025-002 [P1] GAP facet F01
- Files: src/app/api/academics/semesters/route.ts, src/app/api/academics/semesters/[semesterId]/route.ts
- Legacy: Legacy GET semester by ID, by program, fetchAll, fetchAllPaged. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:264-332,653-686`
- Expected fix: Ensure deep-linked semester GET, per-program read and paged listing are exposed to clients or documented replacements.

## G2-5-025-012 [P1] GAP facet F04
- Files: src/modules/academics/college-term-mapping-model.ts, src/db/schema/academic-terms.ts
- Legacy: Legacy mapping fields semester_id, course_id, is_mandatory, credits, course_order, course_ids. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/SemesterCourseDTO.java:12-26`
- Expected fix: Bridge isMandatory↔type and courseOrder↔displayOrder, retain defaults.

## G2-5-025-019 [P1] GAP facet F06
- Files: src/modules/academics/college-term-mapping-model.ts, src/modules/academics/college-term-mapping-service.ts
- Legacy: Legacy mapping add allows optional credits/isMandatory/courseOrder; defaults 3,true,max+1. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:33-65`
- Expected fix: Preserve optional defaults and consider 0/11..30 existing credits.

## G2-5-031-016 [P1] GAP facet F05
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx
- Legacy: Legacy table paginates 25 per page with horizontal scroll1080. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:469-475`
- Expected fix: Implement server pagination 25 default with filters and count.

## G2-6-015-007 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Application source up to 50 chars (JobApplication.java:48-53).
- Expected fix: Add granular source code mapping to preserve LINKEDIN/DIRECT_LINK analytics.

## G2-6-019-019 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy not-specified fields unchanged on PUT (LearnerProfileServiceImpl.java:954-972).
- Expected fix: Distinguish omitted from explicit clear; do not erase preferences when older profile payload excludes section.

## G2-11-020-028 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Board allowed drop actions Contacted, Not now, Invite, Create drive (index.js:476-487,560-575).
- Expected fix: Restore the four allowed drop outcomes and locked hints, with confirmation.

## G2-11-026-016 [P1] GAP facet F08
- Files: (none, new feature)
- Legacy: POST create returns HTTP200 with BugReportResponse object (PublicBugTrackerController.java:31-35).
- Expected fix: Align full response metadata and status for legacy client compatibility.

## G2-12-011-021 [P1] GAP facet F09
- Files: (none, new feature)
- Legacy: On opening drawer auto-mark read if all unread visible; hiddenUnread prevents (RecruiterNotificationBell.jsx:76-91).
- Expected fix: Restore conditional auto-read only when all unread loaded and no hidden count.

## G2-12-011-045 [P1] GAP facet F23
- Files: src/components/hr/hr-recruiter-bell.tsx
- Legacy: Badge separate unreadTotal and shown unread; read all hidden only explicit (RecruiterNotificationService.java:139-153).
- Expected fix: Restore hidden-unread accounting and conditional auto mark.

## G2-15-024-001 [P1] MISSING facet F01
- Files: src/app/e2e/superadmin-login/page.tsx
- Legacy: POST /api/v1/superadmin/e2e/seed only action (SuperAdminE2eController.java:17-20,37-48).
- Expected fix: Add tightly gated dev-only deterministic seed endpoint or documented migration/setup substitute.

## Lane-12 fast verification triage (2026-10-22)

Confirmed via cited vNext code (OK, limited to described behavior): G2-5-014-002, G2-12-011-045.

DEFERRED — deeper implementation/API/migration review required; these are NOT verified or fixed: G2-5-004-041, G2-5-007-018, G2-5-008-015, G2-5-008-076, G2-5-009-028, G2-5-010-020, G2-5-010-055, G2-5-010-079, G2-5-014-028, G2-5-014-049, G2-5-017-024, G2-5-021-004, G2-5-021-018, G2-5-025-002, G2-5-025-012, G2-5-025-019, G2-5-031-016, G2-6-015-007, G2-6-019-019, G2-11-020-028, G2-11-026-016, G2-12-011-021, G2-15-024-001.
This packet has been triaged, not certified parity-complete; no unverified row is claimed OK.
