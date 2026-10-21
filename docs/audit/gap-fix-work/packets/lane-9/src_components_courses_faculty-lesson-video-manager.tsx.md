# Work packet: edit src/components/courses/faculty-lesson-video-manager.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/syllabus-video.md, docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md

## G2-14-008-036  [P1] GAP  facet F10  effort M
- Legacy: Legacy teacher delete uses DELETE /api/v1/lesson/contents/delete/:id then 1s refetch; vNext deletes managed video via /api/courses/videos/:id — `docs/legacy-source/frontend/src/utils/courseUtils/syllabusUtils.js:9-20`; `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:168-179`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:194-205`
- Fix: Ensure deleting managed video retires related lesson content and learner playback in same transaction

## G2-14-008-037  [P1] GAP  facet F10  effort M
- Legacy: Legacy update VideoDrawer calls updateLessonContent(id,NewData) preserving file; vNext manager PATCH video title does not necessarily change lesson content metadata — `docs/legacy-source/frontend/src/components/Course/Syllabus/VideoDrawer.jsx:197-216`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:98-102,207-212`
- Fix: Synchronize managed video and published lesson content title/points/version

## G2-14-008-066  [P1] GAP  facet F22  effort L
- Legacy: Legacy contentDataDTO file_dto.cloud_storage_object or link, vNext lesson video record storageKey and published lesson content — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:28-32`
- vNext now: `src/components/courses/learner-video-player.tsx:22-29,131-141`; `src/components/courses/faculty-lesson-video-manager.tsx:141-160`
- Fix: Normalize legacy link/file into managed video and lessonContent binding with signed access

## G2-14-008-026  [P2] GAP  facet F07  effort S
- Legacy: Legacy teacher delete error Failed to delete; vNext manager generic Could not update lesson video — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:181-187`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:72-86,194-204`
- Fix: Map delete-specific failure to exact toast

## G2-14-008-028  [P2] GAP  facet F08  effort S
- Legacy: Legacy delete success Video deleted successfully duration2 key video-delete; vNext delete completion refreshes manager without same toast — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:169-185`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:194-205,72-88`
- Fix: Emit exact 2s success/toast keyed dedupe after confirmed mutation

## G2-14-008-029  [P2] GAP  facet F08  effort S
- Legacy: Legacy delete failure toast Failed to delete for2s; vNext global Alert Could not update lesson video — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:181-187`
- vNext now: `src/components/courses/faculty-lesson-video-manager.tsx:72-86`
- Fix: Show Failed to delete as toast, retain detailed error in Alert

## G2-17-003-023  [P2] GAP  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:630-638 warns sequence >=1 and points >=0 with specific copy.
- vNext now: src/components/courses/faculty-lesson-video-manager.tsx:144-146 requires Points 0..1000 and src/components/courses/super-admin-content-actions.tsx:36-40 validates order index; wording differs.
- Fix: Map validation limits and error messages for equivalent content types.
