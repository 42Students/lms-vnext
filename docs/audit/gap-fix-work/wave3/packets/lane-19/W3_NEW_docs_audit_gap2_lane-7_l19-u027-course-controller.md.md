# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-7/l19-u027-course-controller.md

5 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l19-u027-course-controller.md

## G2-19-027-063  [P1] MISSING  facet F12  effort L
- Legacy: LBE/service/impl/CourseServiceImpl.java:190-210 restores soft-deleted course only in same college.
- vNext now: V/modules/courses/course-service.ts:364-435 no course restore action; schema status ACTIVE/ARCHIVED.
- Fix: Implement restore with owning-department authorization and duplicate-name/code collision preflight.

## G2-19-027-065  [P1] MISSING  facet F12  effort L
- Legacy: LBE/service/impl/CourseServiceImpl.java:303-319 `parent_course_id` explicit 0 clears, absent retains.
- vNext now: V/modules/courses/validation.ts:28-66 no parent linkage; course model no parentCourseId.
- Fix: Migrate hierarchical parent references and clear behavior or owner-approved removal.

## G2-19-027-071  [P1] MISSING  facet F14  effort L
- Legacy: LFE/pages/superadmin/sections/Courses.js:75-85 uploads `image/*` to presigned R2 `course-images`, returns publicUrl.
- vNext now: V/components/courses/admin-course-display-editor.tsx:195-217 allows HTTPS thumbnail URL, states upload-backed thumbnail depends on storage.
- Fix: Implement signed course image upload with receipt and safe preview/remove, respecting current storage policy.

## G2-19-027-094  [P1] MISSING  facet F22  effort L
- Legacy: LBE/repository/CourseRepository.java:68-70 excludes deleted courses from slug search, :86-96 reserves slugs even for deleted.
- vNext now: V/db/schema/courses.ts:34-86 has no slug column/index.
- Fix: Add immutable legacy slug alias with global uniqueness and tombstone reservation.

## G2-19-027-099  [P1] MISSING  facet F23  effort L
- Legacy: LBE/controller/CourseController.java:450-483 exposes deleted list and restore path.
- vNext now: V/modules/courses/course-service.ts:364-435 only archive, no restore.
- Fix: Owner decision: implement course restore with dependencies and history, or explicitly document irreversible archive.
