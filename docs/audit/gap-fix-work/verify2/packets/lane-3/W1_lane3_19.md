# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-014-054 [P1] GAP facet F13
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:47-71 independent releases fetch cancellation
- Expected fix: Avoid unrelated project aggregate fetch masking sprint-only data

## G2-7-015-054 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:341-354 changing estimation unit disallowed with any task estimate
- Expected fix: Reject conversion with existing estimated tasks

## G2-7-016-068 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:90-140 10 authorable task fields, fixed estimate list
- Expected fix: Inventory field defaults and validation mapping

## G2-7-017-051 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:409-424 total learners can reach 500
- Expected fix: Restore 500 participant cap without request-size risk

## G2-7-018-042 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:127-128 recoverableContent false implies shell/eligible members/meetings only
- Expected fix: Implement content-preserving vs legacy partial recovery behavior

## G2-7-031-002 [P1] GAP facet F01
- Files: src/modules/admin-ui/legacy-superadmin-destination-model.ts
- Legacy: superAdminNavGroups.js:21-30 first Super Admin projects tab Templates
- Expected fix: Make group destination resolve from Super Admin Projects group first tab

## G2-7-031-018 [P1] GAP facet F10
- Files: src/modules/admin-ui/legacy-superadmin-destination-model.ts
- Legacy: superadmin/projects/index.js:5-6 imports superAdminGroupDefaultPath to choose template catalogue
- Expected fix: Make redirect target match Templates entry and test route mapping

## G2-7-033-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx
- Legacy: colleges.js:24-27 templateId can be numeric or slug
- Expected fix: Resolve legacy numeric ID/slug to new UUID via authorised lookup

## G2-8-021-012 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy nullable attendance_status codes EXCUSED, MEDICAL, LATE; NULL means unexplained ABSENT (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:36-44).
- Expected fix: Transform null to ABSENT, preserve explicit status, check historical excused treatment.

## G2-8-020-021 [P1] GAP facet F06
- Files: src/modules/courses/validation.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CourseDTO.java:22-26 null parentCourseId unchanged, explicit <=0 clears
- Expected fix: Restore parent edit and explicit clearing semantics.

## G2-8-020-022 [P1] GAP facet F06
- Files: src/modules/courses/validation.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CourseDTO.java:27-31 optional active/enabled/display/metadata
- Expected fix: Add equivalent controls and field-by-field validation.

## G2-8-020-026 [P1] GAP facet F07
- Files: src/modules/courses/course-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:264-267 duplicate course name OR short title error
- Expected fix: Add case-insensitive short-title collision policy if legacy expected.

## G2-8-020-028 [P1] GAP facet F07
- Files: src/modules/courses/course-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:384-390 409 stale version “This course was modified by someone else...”
- Expected fix: Expose optimistic expected version/token in edit payload and 409 stale response.

## G2-8-020-036 [P1] GAP facet F10
- Files: src/modules/courses/course-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:322-403 PUT update supports dept transfer plus metadata/active/enabled
- Expected fix: Preserve meaningful mutation side effects/visibility and department moves.

## G2-8-020-061 [P1] GAP facet F20
- Files: src/modules/courses/course-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:44-53 JPA @Version for lost JSON update prevention
- Expected fix: Implement frontend expectedUpdatedAt/version CAS and stale conflict notice.

## G2-8-027-049 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: Legacy schedule locks application and learner to prevent cross-job overlapping interviews (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:170-189,233-242).
- Expected fix: Add global learner schedule collision guard across job/round per tenant.

## G2-12-021-012 [P1] GAP facet F06
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:318-371 submissionAssets supports multiple files, text, repository links
- Expected fix: Allow mixed file/text/link submission assets, retaining per-asset type/label

## G2-12-021-017 [P1] GAP facet F10
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:429-451 loops every file asset, rejects duplicate receipt IDs
- Expected fix: Consume one distinct receipt per file in the same submission transaction

## G2-15-026-006 [P1] MISSING facet F03
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:509-573 notes edit action per application
- Expected fix: Add internal notes preview/edit action with authorized update, version token

## G2-8-017-080 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/ProjectTemplate.java:70-90 seven JSON columns overview/sprints/tasks/resources/delivery/meetings/activity
- Expected fix: Define JSON transforms including delivery, meetings, activity before data migration.

## G2-8-024-007 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: Old grant capabilities list shown and stored as permissions (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:56-61,136-146).
- Expected fix: Display/edit per-college capabilities or document deliberate retirement.

## G2-8-023-038 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Legacy applied-by-college writes source APPLIED_BY_COLLEGE, opt-out 48h, in-app notice (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveAddService.java:121-133).
- Expected fix: Preserve 48h opt-out and source provenance in new application model and learner controls.

## G2-8-022-039 [P1] MISSING facet F12
- Files: (none, new feature)
- Legacy: Legacy registration opens with arbitrary LocalDateTime deadline without deadline-window guard in shown method (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:44-49).
- Expected fix: Define deadline <= season end and timezone semantics only after restoring independent field.

## G2-9-007-021 [P1] MISSING facet F05
- Files: src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/OfferingRosterDrawer.jsx:133-141` — Roster search, refresh, CSV, state Enrolled/Waitlisted/Removed/All, 50-row paging
- Expected fix: Implement all toolbar operations and pagination

## G2-9-009-014 [P1] GAP facet F10
- Files: src/app/(authenticated)/college/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — getServerSideProps writes 302 and Location, calls response.end()
- Expected fix: Implement HTTP redirect via Next redirect API on alias route

## Fast verification disposition
- DEFERRED G2-7-014-054: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-7-015-054: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-7-016-068: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-7-017-051: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-7-018-042: Requires deeper source comparison and/or feature work; not certified as matching.
- OK G2-7-031-002: Existing grouped first-tab destination and legacy routing inspected.
- OK G2-7-031-018: Existing grouped first-tab destination and legacy routing inspected.
- DEFERRED G2-7-033-002: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-8-021-012: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-8-020-021: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-8-020-022: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-8-020-026: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-8-020-028: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-8-020-036: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-8-020-061: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-8-027-049: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-12-021-012: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-12-021-017: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-15-026-006: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-8-017-080: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-8-024-007: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-8-023-038: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-8-022-039: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-9-007-021: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-9-009-014: Requires deeper source comparison and/or feature work; not certified as matching.
