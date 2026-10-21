# Work packet: edit src/components/courses/learner-video-player.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/syllabus-video.md

## G2-14-008-022  [P1] GAP  facet F06  effort S
- Legacy: Legacy progress interval platform override default15000ms; vNext default5000ms and global override supports 5000–600000 — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:17-20,70-74`
- vNext now: `src/components/courses/learner-video-player.tsx:22-28,51-59`; `src/modules/courses/learner-playback-settings.ts:6-10`
- Fix: Align default 15000ms if no override and exact override validation

## G2-14-008-066  [P1] GAP  facet F22  effort L
- Legacy: Legacy contentDataDTO file_dto.cloud_storage_object or link, vNext lesson video record storageKey and published lesson content — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:28-32`
- vNext now: `src/components/courses/learner-video-player.tsx:22-29,131-141`; `src/components/courses/faculty-lesson-video-manager.tsx:141-160`
- Fix: Normalize legacy link/file into managed video and lessonContent binding with signed access

## G2-14-008-025  [P2] GAP  facet F07  effort S
- Legacy: Legacy unavailable playback copy Video not available; vNext media loading/error and Retry controls — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:202-211`
- vNext now: `src/components/courses/learner-video-player.tsx:129-151,231-239`
- Fix: Use Video not available as primary fallback, Retry secondary when grant failed
