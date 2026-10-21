# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-025-033 [P1] GAP facet F07
- Files: src/modules/placements/recruiter-profile-details-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:249-251 — Bad phone returns INVALID_MOBILE + exact 10-digit message.
- Expected fix: Validate truly 10 digits and show source message

## G2-10-014-003 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx, src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:120-121; docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:322-342 — BeforeNavigate consults dirty JobForm, including tab transitions.
- Expected fix: Intercept unsaved navigation.

## G2-10-014-073 [P1] MISSING facet F20
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:322-342 — Browser unload and navigation dirty guard.
- Expected fix: Guard dirty state.

## G2-10-030-043 [P1] GAP facet F12
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:99-105,763-771,796-803 — deadline validator permits unchanged expired dates in edit.
- Expected fix: Allow editing unrelated fields after deadline without forcing future date.

## G2-17-030-013 [P1] GAP facet F04
- Files: src/components/placements/placement-operations-overview.tsx, src/modules/placements/tpo-operations-service.ts
- Legacy: ActiveTotal from filtered `status=active` size60 and allTotal from size1 count; DrivesLanding.js:98-125
- Expected fix: Document metric status filters, archive inclusion and equality of active/closed/all totals before cloning KPIs.

## G2-19-024-013 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: New to ALL default, SOME requires picked college IDs, edit locks existing targets; superadmin/announcements.js:87-96,43-52
- Expected fix: Implement broadcast-wide edit with immutable college target set, preserve old radio/default and missing-target validation.

## G2-13-013-003 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/lessons/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:82-102` search side routes stats and refresh, global/root entry
- Expected fix: Replace privileged stats/refresh with equivalent global lesson index administration action

## G2-15-006-013 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy learner course normalization handles id/slug/name/image, isElective/slotName, active/enabled/locked, academic setup (courseListingUtils.js:75-123)
- Expected fix: Provide complete course DTO crosswalk for lock status, elective slot, legacy slug and unavailable text

## G2-17-002-063 [P1] GAP facet F13
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:391-393 staffing fail shows warning 'Faculty staffing warnings unavailable', retains mappings and Retry.
- Expected fix: Isolate staffing read failure, preserve curriculum table with explicit warning.

## G2-19-004-083 [P1] GAP facet F22
- Files: src/modules/placements/learner-career-calendar-model.ts
- Legacy: Legacy calendar exam events and application deadline are separate job/calendar tables `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:81-100`
- Expected fix: Add read-only projections joining approved calendar block and application-deadline tables.

## G2-19-002-023 [P1] GAP facet F05
- Files: src/modules/courses/super-admin-content-directory-service.ts
- Legacy: Legacy selected section enables sortable cross-type full syllabus rows `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1080-1107`
- Expected fix: Provide full cross-type section order view, with off-tab mutation disabled.

## G2-2-008-023 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LC:73-83 authenticated principal and whole-assignment authorizer before repository query
- Expected fix: Add first-class whole-assignment bulk permission guard.

## G2-2-023-023 [P1] MISSING facet F07
- Files: src/modules/colleges/service.ts
- Legacy: AdminRecycleBinController.java:269-274 forbidden does not belong to specified college
- Expected fix: Recheck row ownership before changing archive flag; non-leaking forbidden outcome.

## G2-20-009-023 [P1] GAP facet F08
- Files: (none, new feature)
- Legacy: Legacy upload success gives URL immediately; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:102-124`
- Expected fix: Show 'Checking file' state and prohibit user opening pending file; scanner dependency must be operational for prod.

## G2-3-028-003 [P1] GAP facet F01
- Files: src/modules/colleges/service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:83-135`
- Expected fix: Restore authorized global college switcher source: legacy all=true lets Super Admin enumerate every college even when scoped to one.

## G2-3-028-083 [P1] MISSING facet F23
- Files: src/modules/colleges/service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:93-102`
- Expected fix: A global scope switcher feed overriding selected admin scope is not represented in listColleges; verify alternate switcher service.

## G2-4-014-023 [P1] GAP facet F05
- Files: src/modules/colleges/service.ts
- Legacy: Legacy getPopular and search empty string ranked by usage count, not name. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-122`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:193-218`)
- Expected fix: Implement popularity ranking for search picker; avoid alphabetical fallback.

## G2-4-014-043 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/colleges/page.tsx, src/modules/colleges/service.ts
- Legacy: Non-superadmin with organization may search its org, not other tenants. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:86-98`)
- Expected fix: Check faculty/recruiter org-scoped read access, provide safe API without admin page.

## G2-5-025-013 [P1] GAP facet F04
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: Legacy staffing result per mapping includes courseId, totalClasses, unstaffedClassCount, unstaffedClasses, fullyUnstaffed. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:523-531`
- Expected fix: Restore per-class counts and fullyUnstaffed boolean in report view.

## G2-6-016-033 [P1] MISSING facet F10
- Files: (none, new feature)
- Legacy: On select legacy v1 increments skills.usage_count atomically by ID (SkillRepository.java:77-91; SkillController.java:96-132).
- Expected fix: Add POST selection with atomic increment, rate controls and a clear consumer binding.

## G2-7-005-003 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:84,100: legacy route template ID integer sent to GET by id.
- Expected fix: Bridge old integer-ID bookmarks via redirect/lookup if legacy deep-link migration required.

## G2-7-020-023 [P1] GAP facet F04
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: new.js:322-345 created title/ID and failure strings in outcome report
- Expected fix: Preserve specific per-student failures for recovery

## G2-7-033-013 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: colleges.js:74-76 numericTemplateId derived from loaded template.id
- Expected fix: Preserve numeric or slug historical mapping on deeplinks

## G2-7-035-023 [P1] MISSING facet F06
- Files: src/components/projects/template-metadata-edit-control.tsx
- Legacy: overview.js:612-625 Title required, courseLabel max160, phase max80
- Expected fix: Reintroduce courseLabel and phase fields or versioned update UI

## G2-8-028-023 [P1] MISSING facet F06
- Files: src/components/projects/class-team-workspace-creator.tsx, src/modules/projects/class-team-workspace-service.ts
- Legacy: Old Mentor optional except ACTIVE required, helper Every workspace needs a mentor. docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:49-50,467-483.
- Expected fix: Restore mentor selector/ACTIVE requirement, pass selected mentor into bulk write.
