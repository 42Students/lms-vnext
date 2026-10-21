# Work packet (wave 2): edit src/components/courses/faculty-lesson-video-manager.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/syllabus-video.md, docs/audit/gap2/lane-3/lesson-content-controller.md

## G2-14-008-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy learner/faculty share same Video component and per-role action gating; vNext splits learner-player and faculty-manager components — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:45-48,160-199`
- vNext now: `src/components/courses/learner-video-player.tsx:22-29`; `src/components/courses/faculty-lesson-video-manager.tsx:29-47`
- Fix: Use same visual video shell and action bar for both roles while preserving separated services

## G2-14-008-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy teacher edit opens VideoDrawer, delete Popconfirm; vNext manager inline list edit/upload/delete — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:145-199`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:207-226,286-303`
- Fix: Reintroduce lesson content inline video with edit drawer and delete confirmation on teacher view

## G2-14-008-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy title/action/date toolbar above full video and progress badge below; vNext learner shows video with status/timeline text and faculty list separated — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:157-215`
- vNext now: `src/components/courses/learner-video-player.tsx:211-240`; `src/components/courses/faculty-lesson-video-manager.tsx:220-245`
- Fix: Restore exact title/action/date/video/badge order with desktop+mobile spacing

## G2-14-008-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy Edit content is icon with EditOutlined and accessible title; vNext faculty Update Video text button and field inputs — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:160-164`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:291-303`
- Fix: Render compact edit icon affordance in lesson content toolbar

## G2-14-008-008  [P2] GAP  facet F03  effort S
- Legacy: Legacy Delete content icon wraps Popconfirm Yes/No; vNext Delete button and ConfirmDialog — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:165-196`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:291-292,334-341`
- Fix: Keep icon-only delete with legacy Popconfirm anchoring and Yes/No labels

## G2-14-008-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy ContentAddedDate near actions; vNext faculty/learner video player lacks equivalent authored-date text in same toolbar — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:199-200`
- vNext now: `src/components/courses/learner-video-player.tsx:211-240`; `src/components/courses/faculty-lesson-video-manager.tsx:276-326`
- Fix: Add created/added date from content metadata in header at same baseline

## G2-14-008-019  [P2] GAP  facet F06  effort S
- Legacy: Legacy VideoDrawer title Update Video and Upload New Video, Cancel/Submit; vNext inline upload form with Upload/Update Video separate — `docs/legacy-source/frontend/src/components/Course/Syllabus/VideoDrawer.jsx:34-55`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:220-235,303-326`
- Fix: Restore drawer title, button order and Cancel/Submit copy

## G2-14-008-020  [P2] GAP  facet F06  effort S
- Legacy: Legacy VideoDrawer Video Title required with Enter Video Title and placeholder; vNext title required by manual error Enter a title before uploading — `docs/legacy-source/frontend/src/components/Course/Syllabus/VideoDrawer.jsx:74-85`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:104-110,220-226`
- Fix: Use exact Video Title label, Enter Video Title placeholder, field error

## G2-14-008-021  [P2] GAP  facet F06  effort M
- Legacy: Legacy edit stores contentTitle, points, file key; vNext title, contentPoints, duration/file variants — `docs/legacy-source/frontend/src/components/Course/Syllabus/VideoDrawer.jsx:159-216`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:40-46,104-119`
- Fix: Align contentPoints/title editor rules and preserve existing media when title-only update

## G2-14-008-031  [P2] GAP  facet F09  effort M
- Legacy: Legacy teacher editing opens right drawer with editSelectedVideo; vNext manager has inline form and thumbnail replacement modal — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:145-154`; `docs/legacy-source/frontend/src/components/Course/Syllabus/VideoDrawer.jsx:34-55`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:44-47,194-207`
- Fix: Use right-side drawer for video metadata editing with unsaved change guard

## G2-14-008-032  [P2] GAP  facet F09  effort S
- Legacy: Legacy delete Popconfirm title Delete the video and Are you sure to delete this video?; vNext generic ConfirmDialog — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:165-195`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:334-341`
- Fix: Use exact title/description and Yes/No while preserving async guard

## G2-14-008-033  [P2] GAP  facet F09  effort M
- Legacy: Legacy delete confirmation anchored to icon; vNext central modal confirmation — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:165-193`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:334-341`
- Fix: Use anchored popover for desktop, responsive dialog for mobile

## G2-14-008-048  [P2] GAP  facet F14  effort M
- Legacy: Legacy video edit supports file upload from drawer, vNext multi-step video manager upload with managed video storage — `docs/legacy-source/frontend/src/components/Course/Syllabus/VideoDrawer.jsx:90-150,215-216`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:104-119,220-235`
- Fix: Match drawer upload affordance and feedback, keep safe transfer endpoint

## G2-14-008-051  [P2] GAP  facet F16  effort S
- Legacy: Legacy toolbar flex-wrap gap8, mb3/md4, icon button4px; vNext player rows and form stacked md — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:157-162,199-202`
- vNext now: `src/components/courses/learner-video-player.tsx:211-240`; `src/components/courses/faculty-lesson-video-manager.tsx:220-245`
- Fix: Match flex-wrap, 8px toolbar gap, mb16/24 and compact icons across breakpoints

## G2-14-008-053  [P2] GAP  facet F17  effort S
- Legacy: Legacy Edit/Delete buttons aria-label Edit content/Delete content; vNext text buttons accessible but not exact names — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:160-164,193-195`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:286-303`
- Fix: Match aria-label while preserving keyboard focus/disabled state

## G2-14-008-055  [P2] GAP  facet F18  effort S
- Legacy: Legacy drawer title Update Video, upload Upload New Video; vNext Edit metadata mostly Update Video inline — `docs/legacy-source/frontend/src/components/Course/Syllabus/VideoDrawer.jsx:34-41`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:220-226,303-325`
- Fix: Use exact drawer and button titles

## G2-14-008-056  [P2] GAP  facet F18  effort S
- Legacy: Legacy delete prompt Delete the video / Are you sure to delete this video? / Yes / No; vNext ConfirmDialog copy differs — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:165-192`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:334-341`
- Fix: Restore verbatim confirm copy and button order

## G2-14-008-057  [P2] GAP  facet F18  effort S
- Legacy: Legacy Video not available, Video deleted successfully, Failed to delete; vNext player media error/manager generic errors — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:169-187,209-211`
- vNext now: `src/components/courses/learner-video-player.tsx:231-239`; `src/components/courses/faculty-lesson-video-manager.tsx:72-86`
- Fix: Use legacy exact text for corresponding states

## G2-3-027-014  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:387-429`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:224-245`
- Fix: Legacy grade listing fields include lessonContentId/points/courseName/slug/class/faculty; vNext faculty video authoring points form does not provide grade summary table.

## G2-3-027-016  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:730-743`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:290-292`
- Fix: Legacy content delete response Lesson content deleted successfully; vNext video manager Delete video confirmation and toast not necessarily same exact success text.

## G2-14-008-050  [P3] GAP  facet F15  effort S
- Legacy: Legacy delete refreshes list after delay and shows local toast, no learner notice; vNext DELETE manager refreshes immediately — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:169-180`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:72-88,194-205`
- Fix: Align lesson freshness and learner content invalidation without extra notification

## G2-3-027-072  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:736-742`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:335-341`
- Fix: Legacy exact delete success Lesson content deleted successfully differs from vNext Delete this video? confirmation and follow-up.
