# Work packet: edit src/modules/courses/course-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md, docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-8/course.md

## G2-19-027-052  [P0] GAP  facet F20  effort M
- Legacy: Legacy `@Version` on Course prevents lost updates, returns 409 with refresh copy; Course.java:37-47; CourseController.java:384-390
- vNext now: vNext `updatedAt` exists but input has no expectedUpdatedAt; update guarded only by row lock, not request version; validation.ts:65-89; course-service.ts:288-354
- Fix: Require expectedUpdatedAt/version CAS for PATCH, reject stale modal with 409 and keep in-progress form for reapply.

## G2-19-027-010  [P1] GAP  facet F04  effort M
- Legacy: Legacy course response curated `{id,slug,courseName,shortTitle,active,deptId,allowedForDisplay,metaData}`; CourseController.java:212-227,250-261
- vNext now: vNext list returns `{id,departmentId,name,code,shortTitle,officialCode,cardColor,takeaways,description,status,createdAt,updatedAt}`; course-service.ts:177-195
- Fix: Build client-facing readonly safe projection, map active/allowedForDisplay and slug, never return full tenant/internal entity.

## G2-19-027-011  [P1] GAP  facet F04  effort L
- Legacy: Legacy MetaData has 14 fields including image_url, image_url_lp, thumbnail, amount, course_type/category, dates, html, introduction, takeaways, course_color; MetaData.java:17-32
- vNext now: vNext course entry stores shortTitle/officialCode/cardColor/takeaways/description; course-service.ts:185-191,265-271; Rich Course Home separately; admin-course-display-editor.tsx:~50-190
- Fix: Map each metadata field to new Course Home/model; specify dropping price/type/dates separately with owner approval; preserve safe images and HTML.

## G2-19-027-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy `slug` random URL-safe ID (max64), stored unique, kept in links and fetch; Course.java:34-36; CourseServiceImpl.java:66-99
- vNext now: vNext UUID course IDs + new `code` field required, no slug in list projection; validation.ts:1-35; course-service.ts:177-194
- Fix: Provide slug alias table/redirect instead of treating human course code as slug or exposing UUID without migration mapping.

## G2-19-027-017  [P1] MISSING  facet F05  effort M
- Legacy: Legacy deleted courses fetched separate `/deleted?collegeId` and restore `/{id}`; CourseController.java:450-476
- vNext now: vNext `includeArchived=true` mixes archived in generic courses list, no restore in course-service.ts:126-435 or courses route.ts:11-54
- Fix: Offer a clearly labeled archive/recycle tab with scoped restore, keeping active list separate.

## G2-19-027-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy MetaData partial update merges null fields, sanitizes html, URLs, color; CourseServiceImpl.java:271-350
- vNext now: vNext update partial `...input` at course row and separate overview write path; course-service.ts:323-334; admin-course-display-editor.tsx:~55-190
- Fix: Preserve independent dirty fields and safe rich HTML merge without erasing untouched metadata in separate saves.

## G2-19-027-025  [P1] GAP  facet F07  effort M
- Legacy: 409 conflict `This course was modified by someone else. Refresh and reapply your changes.` on optimistic update; CourseController.java:384-390
- vNext now: vNext updateCourse locks row but request has no expectedUpdatedAt/version; course-service.ts:288-363; validation.ts:65-90
- Fix: Add CAS/expected version for stale-browser edits and exact conflict copy; row lock alone doesn't catch stale form.

## G2-19-027-026  [P1] GAP  facet F07  effort M
- Legacy: Delete conflict `Cannot delete course: it has lesson content` or `it has lessons`; CourseServiceImpl.java:168-181
- vNext now: vNext archive rejects ACTIVE offerings (`COURSE_HAS_ACTIVE_OFFERINGS`), no lesson-count predicate in course-service.ts:379-404
- Fix: Add equivalent dependency audit and clear error that includes active offering/lessons/content; ensure no orphan learner references.

## G2-19-027-032  [P1] GAP  facet F10  effort M
- Legacy: Legacy `updateCourse` validates requested department, metadata merges, audit COURSE_UPDATE; CourseController.java:322-403
- vNext now: vNext update scopes fixed owner department, locks course row, writes update and activity event; course-service.ts:288-363
- Fix: Produce complete write effects crosswalk for department moves, field merging and stale edit detection.

## G2-19-027-033  [P1] GAP  facet F10  effort L
- Legacy: Legacy `deleteCourse` soft marks isDeleted, blocks any lesson/content, updates search cache and records COURSE_DELETE; CourseController.java:405-445; CourseServiceImpl.java:168-185,223-231
- vNext now: vNext archive only blocks active offerings, status ARCHIVED and activity event; course-service.ts:364-435
- Fix: Check all dependent lessons/progress and cache invalidation under transaction; preserve reversible record state.

## G2-19-027-038  [P1] GAP  facet F12  effort L
- Legacy: Legacy `active`, `enabled`, allowedForDisplay independently control visibility; CourseDTO.java:27-31; Courses.js:89-95
- vNext now: vNext ACTIVE/ARCHIVED course status used to derive Student visibility badge; admin-course-overview.tsx:125-142; course-service.ts:126-194
- Fix: Map hide/show separately from archival and per-course display access, preserving existing semester content.

## G2-19-027-039  [P1] GAP  facet F12  effort M
- Legacy: Legacy soft delete excludes course from ordinary findAll but recoverable via admin restore; CourseServiceImpl.java:139-146,182-214
- vNext now: vNext status ARCHIVED excluded from normal list, includeArchived optional GET, no restore mutation; course-service.ts:126-176,364-435
- Fix: Define retention/state machine and restore path; don't mark archived as irreversibly deleted.

## G2-19-027-050  [P1] GAP  facet F19  effort L
- Legacy: Old `/fetchAll` and `/fetchByCollege` intentionally unpaged for compatibility; paginated variants cap100; CourseController.java:104-156,159-180
- vNext now: vNext listCourses returns all scoped rows (server) then catalogue filters/pages/CSV; course-service.ts:126-200; admin-course-overview.tsx:483-557
- Fix: Push filter/pagination into indexed SQL for large 20-college scale; avoid materializing all rows for every admin request.

## G2-19-027-055  [P1] GAP  facet F22  effort L
- Legacy: Legacy course table has numeric ID, globally unique slug, version, parentCourseId, createdByOrgId, active/enabled/allowedForDisplay, contents JSON and isDeleted; Course.java:16-54 plus BaseModel
- vNext now: vNext normalized courses UUID, departmentId, name/code, status, metadata fields and separate offerings/deliveries; course-service.ts:126-200,204-284; admin-course-overview.tsx:555-604
- Fix: Publish migration crosswalk for slug alias, soft delete/archive, parent, visibility, metadata/education and version before parity signoff.

## G2-12-003-014  [P1] GAP  facet F04  effort S
- Legacy: Reads course metadata imageUrl, html_content, introduction_content, takeaways, course_color and official code `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:20-31,283-303`
- vNext now: Course list selects name/code/shortTitle/officialCode/cardColor/takeaways/description/status, no image/introduction fields `src/modules/courses/course-service.ts:179-202`
- Fix: Extend persisted course metadata for intro and image or retain deliberate field mapping

## G2-12-003-049  [P1] GAP  facet F10  effort S
- Legacy: Delete physical or soft according backend, blocked by lessons `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:387-405`
- vNext now: DELETE endpoint archives course, blocked by active offerings `src/modules/courses/course-service.ts:364-433`
- Fix: Reconcile history-safe archive and dependency semantics

## G2-12-003-056  [P1] GAP  facet F12  effort S
- Legacy: Delete blocked when linked lessons count >0 `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:493-513`
- vNext now: Archive blocked on active offerings not legacy lessons count `src/modules/courses/course-service.ts:394-405`
- Fix: Audit lesson dependency guards for archive

## G2-12-003-080  [P1] GAP  facet F20  effort S
- Legacy: Legacy `@Version` optimistic lock protects nested metadata merge `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:44-53`
- vNext now: VNext course update with row lock but no client expected version CAS `src/modules/courses/course-service.ts:308-355`
- Fix: Add optimistic stale form token to avoid lost edits

## G2-18-003-110  [P1] GAP  facet F22  effort M
- Legacy: Legacy shortTitle max64 and optional courseCode40; vNext shortTitle120, required code64 with DB uniqueness. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:50-61`
- vNext now: vNext validation plus unique code/name in department. `src/modules/courses/validation.ts:16-45`, `src/modules/courses/course-service.ts:51-126`, `src/db/schema/courses.ts:66-78`
- Fix: Document constraint collisions and migration/coercion, test longest persisted values.

## G2-8-020-023  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:271-352 absent JSON child fields preserved reflectively on update
- vNext now: src/modules/courses/course-service.ts:323-328 partial update spreads only validated top-level properties
- Fix: When metadata restored, merge missing properties rather than overwriting whole object.
