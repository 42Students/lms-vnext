# Work packet: edit src/components/courses/admin-course-display-editor.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md

## G2-19-027-005  [P1] GAP  facet F02  effort L
- Legacy: Legacy course records edit Course Name, Short display name, Official code, introduction and artwork in one course form; Courses.js:41-95
- vNext now: vNext course Edit dialog for name/code/meta; separate Course Home editor for rich overview; admin-course-actions.tsx:139-219; admin-course-display-editor.tsx:1-190
- Fix: Create one legacy-faithful edit entry with linked metadata fields and saving state; preserve normalized backend storage.

## G2-19-027-011  [P1] GAP  facet F04  effort L
- Legacy: Legacy MetaData has 14 fields including image_url, image_url_lp, thumbnail, amount, course_type/category, dates, html, introduction, takeaways, course_color; MetaData.java:17-32
- vNext now: vNext course entry stores shortTitle/officialCode/cardColor/takeaways/description; course-service.ts:185-191,265-271; Rich Course Home separately; admin-course-display-editor.tsx:~50-190
- Fix: Map each metadata field to new Course Home/model; specify dropping price/type/dates separately with owner approval; preserve safe images and HTML.

## G2-19-027-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy MetaData partial update merges null fields, sanitizes html, URLs, color; CourseServiceImpl.java:271-350
- vNext now: vNext update partial `...input` at course row and separate overview write path; course-service.ts:323-334; admin-course-display-editor.tsx:~55-190
- Fix: Preserve independent dirty fields and safe rich HTML merge without erasing untouched metadata in separate saves.

## G2-19-027-043  [P1] GAP  facet F14  effort L
- Legacy: Legacy course form supports presigned R2 image upload + image removal and deferred remote key cleanup; Courses.js:11-13,70-100,360-368
- vNext now: vNext `thumbnailUrl` HTTPS field in separate Home editor; `AdminCourseCreatePanel` has no image upload in inspected form; admin-course-display-editor.tsx:125-180
- Fix: Use signed upload-backed thumbnails following project storage policy; preserve preview/replace/delete UX, never expose object key publicly.

## G2-19-027-056  [P1] GAP  facet F22  effort L
- Legacy: Legacy 14-key MetaData JSON stored under Course.contents, merged on writes; MetaData.java:17-32; CourseServiceImpl.java:271-351
- vNext now: vNext course home metadata separate from course input and strict schemas; validation.ts:33-88; admin-course-display-editor.tsx:~50-190
- Fix: Map each exact JSON key to course vs Course Home model, preserving images/text/date display and null/missing differences.
