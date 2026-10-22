# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-027-021 [P1] GAP facet F06
- Files: src/modules/courses/course-service.ts, src/components/courses/admin-course-display-editor.tsx
- Legacy: Legacy MetaData partial update merges null fields, sanitizes html, URLs, color; CourseServiceImpl.java:271-350
- Expected fix: Preserve independent dirty fields and safe rich HTML merge without erasing untouched metadata in separate saves.

## G2-19-027-025 [P1] GAP facet F07
- Files: src/modules/courses/course-service.ts
- Legacy: 409 conflict `This course was modified by someone else. Refresh and reapply your changes.` on optimistic update; CourseController.java:384-390
- Expected fix: Add CAS/expected version for stale-browser edits and exact conflict copy; row lock alone doesn't catch stale form.

## G2-19-027-026 [P1] GAP facet F07
- Files: src/modules/courses/course-service.ts
- Legacy: Delete conflict `Cannot delete course: it has lesson content` or `it has lessons`; CourseServiceImpl.java:168-181
- Expected fix: Add equivalent dependency audit and clear error that includes active offering/lessons/content; ensure no orphan learner references.

## G2-19-027-032 [P1] GAP facet F10
- Files: src/modules/courses/course-service.ts
- Legacy: Legacy `updateCourse` validates requested department, metadata merges, audit COURSE_UPDATE; CourseController.java:322-403
- Expected fix: Produce complete write effects crosswalk for department moves, field merging and stale edit detection.

## G2-19-027-038 [P1] GAP facet F12
- Files: src/components/courses/admin-course-overview.tsx, src/modules/courses/course-service.ts
- Legacy: Legacy `active`, `enabled`, allowedForDisplay independently control visibility; CourseDTO.java:27-31; Courses.js:89-95
- Expected fix: Map hide/show separately from archival and per-course display access, preserving existing semester content.

## G2-19-027-039 [P1] GAP facet F12
- Files: src/modules/courses/course-service.ts
- Legacy: Legacy soft delete excludes course from ordinary findAll but recoverable via admin restore; CourseServiceImpl.java:139-146,182-214
- Expected fix: Define retention/state machine and restore path; don't mark archived as irreversibly deleted.

## G2-19-027-050 [P1] GAP facet F19
- Files: src/modules/courses/course-service.ts, src/components/courses/admin-course-overview.tsx
- Legacy: Old `/fetchAll` and `/fetchByCollege` intentionally unpaged for compatibility; paginated variants cap100; CourseController.java:104-156,159-180
- Expected fix: Push filter/pagination into indexed SQL for large 20-college scale; avoid materializing all rows for every admin request.

## G2-19-027-055 [P1] GAP facet F22
- Files: src/modules/courses/course-service.ts, src/components/courses/admin-course-overview.tsx
- Legacy: Legacy course table has numeric ID, globally unique slug, version, parentCourseId, createdByOrgId, active/enabled/allowedForDisplay, contents JSON and isDeleted; Course.java:16-54 plus BaseModel
- Expected fix: Publish migration crosswalk for slug alias, soft delete/archive, parent, visibility, metadata/education and version before parity signoff.

## G2-11-003-055 [P1] GAP facet F10
- Files: src/app/(authenticated)/hr/drives/page.tsx
- Legacy: Legacy openRequests count from direction COLLEGE_TO_COMPANY `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:55`
- Expected fix: Verify equivalent request direction and historical changes

## G2-11-005-124 [P1] GAP facet F20
- Files: src/app/(authenticated)/tpo/announcements/page.tsx
- Legacy: Save failure leaves composer open and draft fields `docs/legacy-source/frontend/src/pages/tpo/announcements.js:48`
- Expected fix: Preserve draft fields/dialog on validation/network failure

## G2-11-012-031 [P1] GAP facet F05
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: Mode filter ON_CAMPUS/POOL/OFF_CAMPUS. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:105`
- Expected fix: Expose drive-mode filter and map independent job work mode.

## G2-12-003-004 [P1] GAP facet F01
- Files: src/components/courses/admin-course-overview.tsx
- Legacy: Legacy editor and existing courses reachable immediately `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:536-634`
- Expected fix: Open Create New Course by default

## G2-12-003-008 [P1] GAP facet F03
- Files: src/components/courses/admin-course-overview.tsx
- Legacy: Table cover Image, Course Name, Short Title, Department, Students see it, Dependencies, Actions `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:468-490`
- Expected fix: Restore cover and Short Title standalone columns

## G2-12-003-012 [P1] GAP facet F03
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: Create/editor fields department,name,short title,official code,intro heading,description,takeaways,image,color,visible switch `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:41-94`
- Expected fix: Restore missing page fields or document data-model exclusion

## G2-12-003-014 [P1] GAP facet F04
- Files: src/modules/courses/course-service.ts
- Legacy: Reads course metadata imageUrl, html_content, introduction_content, takeaways, course_color and official code `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:20-31,283-303`
- Expected fix: Extend persisted course metadata for intro and image or retain deliberate field mapping

## G2-12-003-024 [P1] GAP facet F06
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: Short display name required max64, placeholder e.g. DSA `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:52-55`
- Expected fix: Use max64 and placeholder to match legacy

## G2-12-003-026 [P1] MISSING facet F06
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: Required `In this Course – Heading`, 255 max `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:64-67`
- Expected fix: Add heading field and persist/display semantics

## G2-12-003-027 [P1] GAP facet F06
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: Required `In this Course – Description`, textarea rows3 `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:68-71`
- Expected fix: Require and label home-page intro description

## G2-12-003-029 [P1] MISSING facet F06
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: Upload Image/Change Image/Remove image with preview `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-84`
- Expected fix: Add signed upload and image controls

## G2-12-003-031 [P1] GAP facet F06
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: Course visible to students switch defaults true and controls `active`, `enabled` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-95`
- Expected fix: Expose initial visibility and course-level toggle

## G2-12-003-034 [P1] GAP facet F07
- Files: src/modules/courses/validation.ts
- Legacy: Max255 Course Name, max64 Short Title with `Maximum 64 characters` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:46-55`
- Expected fix: Align shortTitle max64 and message

## G2-12-003-035 [P1] GAP facet F07
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: Map create API errors course_name,short_title,dept_id to Form.Item `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:269-276`
- Expected fix: Restore field-key mapping

## G2-12-003-044 [P1] GAP facet F09
- Files: src/components/courses/admin-course-actions.tsx
- Legacy: Delete Popconfirm with linked-lesson explanation `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:505-513`
- Expected fix: Clarify differing dependencies and archive semantics in confirm

## G2-12-003-046 [P1] GAP facet F10
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: Legacy course create payload course_name,short_title,dept_id, active+enabled, allowedForDisplay, nested meta_data `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:229-253`
- Expected fix: Document all dropped/flattened fields and defaults

## G2-12-003-048 [P1] GAP facet F10
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: Duplicate prefill copies image, takeaways, heading, color, code and name (Copy), scroll and focus `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:306-317`
- Expected fix: Restore duplicate metadata coverage and focus flow
