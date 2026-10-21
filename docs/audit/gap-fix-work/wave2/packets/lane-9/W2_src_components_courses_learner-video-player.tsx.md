# Work packet (wave 2): edit src/components/courses/learner-video-player.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/syllabus-video.md

## G2-14-008-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy learner/faculty share same Video component and per-role action gating; vNext splits learner-player and faculty-manager components — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:45-48,160-199`
- vNext now: `src/components/courses/learner-video-player.tsx:22-29`; `src/components/courses/faculty-lesson-video-manager.tsx:29-47`
- Fix: Use same visual video shell and action bar for both roles while preserving separated services

## G2-14-008-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy title/action/date toolbar above full video and progress badge below; vNext learner shows video with status/timeline text and faculty list separated — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:157-215`
- vNext now: `src/components/courses/learner-video-player.tsx:211-240`; `src/components/courses/faculty-lesson-video-manager.tsx:220-245`
- Fix: Restore exact title/action/date/video/badge order with desktop+mobile spacing

## G2-14-008-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy video wrapper classes ln-syllabus-video-wrap and fixed grey text; vNext standard video element with Tailwind frame — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:202-210`
- vNext now: `src/components/courses/learner-video-player.tsx:205-214`
- Fix: Match canvas/video frame aspect, border, responsive padding and original font tokens

## G2-14-008-006  [P2] GAP  facet F02  effort S
- Legacy: Legacy learner progress occupies full-width progress bar below player; vNext saved-position text and status without equivalent bar — `docs/legacy-source/frontend/src/components/Course/Syllabus/ContentProgressBadge.jsx:19-76`; `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:213-215`
- vNext now: `src/components/courses/learner-video-player.tsx:227-240`
- Fix: Render full-width 4px watched meter and status badge alongside position text

## G2-14-008-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy ContentAddedDate near actions; vNext faculty/learner video player lacks equivalent authored-date text in same toolbar — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:199-200`
- vNext now: `src/components/courses/learner-video-player.tsx:211-240`; `src/components/courses/faculty-lesson-video-manager.tsx:276-326`
- Fix: Add created/added date from content metadata in header at same baseline

## G2-14-008-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy progress badge has status icon for WATCHED/IN_PROGRESS/NOT_STARTED; vNext plain Completed/Progress saves automatically — `docs/legacy-source/frontend/src/components/Course/Syllabus/ContentProgressBadge.jsx:5-12,45-55`
- vNext now: `src/components/courses/learner-video-player.tsx:227-230`
- Fix: Restore icon+tone+label status rendering from actual persisted status

## G2-14-008-013  [P2] GAP  facet F04  effort S
- Legacy: Legacy WATCHED status progress.percentWatched rounded 0–100, bar; vNext percentComplete calculated but player only shows elapsed saved time — `docs/legacy-source/frontend/src/components/Course/Syllabus/ContentProgressBadge.jsx:19-26,52-75`
- vNext now: `src/modules/courses/progress-service.ts:62-103`; `src/components/courses/learner-video-player.tsx:227-230`
- Fix: Show percent watched, not only saved time, use server percentComplete

## G2-14-008-014  [P2] GAP  facet F04  effort S
- Legacy: Legacy progress statuses include WATCHED, SUBMITTED, GRADED, IN_PROGRESS, NOT_STARTED; vNext player uses COMPLETED/IN_PROGRESS/NOT_STARTED — `docs/legacy-source/frontend/src/components/Course/Syllabus/ContentProgressBadge.jsx:5-12`
- vNext now: `src/modules/courses/progress-service.ts:50-59`; `src/components/courses/learner-video-player.tsx:71-79`
- Fix: Map status aliases WATCHED↔COMPLETED in user-facing badge without status regressions

## G2-14-008-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy content title from ContentTitle and authored date from ContentAddedDate; vNext player receives lessonId/contentId but no display title prop — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:157-159,199-200`
- vNext now: `src/components/courses/learner-video-player.tsx:22-29`
- Fix: Pass and render content title and addedAt through parent, preserving edit affordance

## G2-14-008-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy selects one content only by contentDataDTO; vNext player loads learner-videos list then chooses stored video id — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:28-31,155-156`
- vNext now: `src/components/courses/learner-video-player.tsx:131-141`
- Fix: Choose video linked to lesson content deterministically, prevent wrong sibling playback

## G2-14-008-023  [P2] GAP  facet F06  effort S
- Legacy: Legacy final position rounds seconds and cap24h; vNext floors elapsed and may permit greater position via schema — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:80-84,120-123`
- vNext now: `src/components/courses/learner-video-player.tsx:56-65`; `src/modules/courses/progress-service.ts:358-379`
- Fix: Align 24-hour clamp and rounding/floor behavior with persisted progress

## G2-14-008-035  [P2] GAP  facet F10  effort M
- Legacy: Legacy progress PUT saves lessonContentId,lastPositionSeconds,durationSeconds,completed hint; vNext PUT /api/courses/progress/:id with deliveryId,positionSeconds — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:89-103,125-131`
- vNext now: `src/components/courses/learner-video-player.tsx:61-66`; `src/app/api/courses/progress/[contentId]/route.ts:39-62`
- Fix: Keep safe vNext payload but ensure playback duration and completion semantics map accurately

## G2-14-008-042  [P2] GAP  facet F12  effort M
- Legacy: Legacy completed content remains watched when replay and can update position; vNext player persist() blocks further writes after completed — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:163-195`
- vNext now: `src/components/courses/learner-video-player.tsx:51-55,75-79`
- Fix: Decide and implement legacy replay-position behavior for completed videos without un-completing

## G2-14-008-044  [P2] GAP  facet F13  effort S
- Legacy: Legacy no DTO or type returns empty fragment unless contentDataDTO and type VIDEO; vNext player can show loading or no-videos state — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:155-156,210-220`
- vNext now: `src/components/courses/learner-video-player.tsx:129-152,231-239`
- Fix: Separate content-missing blank tile vs video-not-available error

## G2-14-008-045  [P2] GAP  facet F13  effort S
- Legacy: Legacy no file URL shows Video not available inline; vNext failed signed-grant shows error+retry (new useful state) — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:202-211`
- vNext now: `src/components/courses/learner-video-player.tsx:231-239`
- Fix: Put exact fallback headline, preserve retry

## G2-14-008-046  [P2] GAP  facet F13  effort S
- Legacy: Legacy no progress object means no status badge; vNext always renders automatic save status even zero progress — `docs/legacy-source/frontend/src/components/Course/Syllabus/ContentProgressBadge.jsx:19-21`
- vNext now: `src/components/courses/learner-video-player.tsx:227-230`
- Fix: Suppress status badge when progress null, still show assistive save description

## G2-14-008-051  [P2] GAP  facet F16  effort S
- Legacy: Legacy toolbar flex-wrap gap8, mb3/md4, icon button4px; vNext player rows and form stacked md — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:157-162,199-202`
- vNext now: `src/components/courses/learner-video-player.tsx:211-240`; `src/components/courses/faculty-lesson-video-manager.tsx:220-245`
- Fix: Match flex-wrap, 8px toolbar gap, mb16/24 and compact icons across breakpoints

## G2-14-008-052  [P2] GAP  facet F16  effort S
- Legacy: Legacy progress bar 4px full width, compact mobile 3px; vNext player has no watched meter — `docs/legacy-source/frontend/src/components/Course/Syllabus/ContentProgressBadge.jsx:27-75`
- vNext now: `src/components/courses/learner-video-player.tsx:227-240`
- Fix: Implement responsive 3/4px bar and 8/12px margin

## G2-14-008-057  [P2] GAP  facet F18  effort S
- Legacy: Legacy Video not available, Video deleted successfully, Failed to delete; vNext player media error/manager generic errors — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:169-187,209-211`
- vNext now: `src/components/courses/learner-video-player.tsx:231-239`; `src/components/courses/faculty-lesson-video-manager.tsx:72-86`
- Fix: Use legacy exact text for corresponding states

## G2-14-008-058  [P2] GAP  facet F19  effort S
- Legacy: Legacy timeupdate gated once per 15s with no overlapping requests; vNext min5000, savingRef single-flight — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:70-81`
- vNext now: `src/components/courses/learner-video-player.tsx:51-60`; `src/modules/courses/learner-playback-settings.ts:6-10`
- Fix: Match configured save interval by default and singleflight semantics

## G2-14-008-063  [P2] GAP  facet F21  effort M
- Legacy: Legacy VideoGlobal depends on video-react Player and public URL; vNext native video + signed video inventory/grant — `docs/legacy-source/frontend/src/components/Global/video/video.jsx:69-84`; `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:28-39`
- vNext now: `src/components/courses/learner-video-player.tsx:97-121,131-141`
- Fix: Match player chrome/speed controls without reverting secure grants

## G2-14-008-011  [P3] GAP  facet F03  effort S
- Legacy: Legacy VideoGlobal displays playback rate options via built-in ControlBar; vNext explicit native Select 0.5–2 — `docs/legacy-source/frontend/src/components/Global/video/video.jsx:69-84`
- vNext now: `src/components/courses/learner-video-player.tsx:215-225`
- Fix: Match ControlBar speed menu location/shape while retaining native accessibility
