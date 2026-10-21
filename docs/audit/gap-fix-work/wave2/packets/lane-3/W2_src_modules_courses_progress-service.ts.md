# Work packet (wave 2): edit src/modules/courses/progress-service.ts

27 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/syllabus-video.md, docs/audit/gap2/lane-2/admin-learner-progress-controller.md, docs/audit/gap2/lane-3/lesson-content-controller.md, docs/audit/gap2/lane-4/learner-content-progress-model.md

## G2-14-008-013  [P2] GAP  facet F04  effort S
- Legacy: Legacy WATCHED status progress.percentWatched rounded 0–100, bar; vNext percentComplete calculated but player only shows elapsed saved time — `docs/legacy-source/frontend/src/components/Course/Syllabus/ContentProgressBadge.jsx:19-26,52-75`
- vNext now: `src/modules/courses/progress-service.ts:62-103`; `src/components/courses/learner-video-player.tsx:227-230`
- Fix: Show percent watched, not only saved time, use server percentComplete

## G2-14-008-014  [P2] GAP  facet F04  effort S
- Legacy: Legacy progress statuses include WATCHED, SUBMITTED, GRADED, IN_PROGRESS, NOT_STARTED; vNext player uses COMPLETED/IN_PROGRESS/NOT_STARTED — `docs/legacy-source/frontend/src/components/Course/Syllabus/ContentProgressBadge.jsx:5-12`
- vNext now: `src/modules/courses/progress-service.ts:50-59`; `src/components/courses/learner-video-player.tsx:71-79`
- Fix: Map status aliases WATCHED↔COMPLETED in user-facing badge without status regressions

## G2-14-008-023  [P2] GAP  facet F06  effort S
- Legacy: Legacy final position rounds seconds and cap24h; vNext floors elapsed and may permit greater position via schema — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:80-84,120-123`
- vNext now: `src/components/courses/learner-video-player.tsx:56-65`; `src/modules/courses/progress-service.ts:358-379`
- Fix: Align 24-hour clamp and rounding/floor behavior with persisted progress

## G2-14-008-041  [P2] GAP  facet F12  effort L
- Legacy: Legacy duration absent falls back client supplied duration, vNext ignores client duration and cannot mark watched without authored duration — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:103-118`
- vNext now: `src/modules/courses/progress-service.ts:70-89,375-381`
- Fix: Provide safe stored media metadata migration so old zero-duration videos complete without trusting forgeable fields

## G2-14-008-043  [P2] GAP  facet F12  effort S
- Legacy: Legacy completion percentWon no observed min threshold when position>0, status IN_PROGRESS; vNext default minInProgressPercent5 — `docs/legacy-source/frontend/src/components/Course/Syllabus/ContentProgressBadge.jsx:19-26`
- vNext now: `src/modules/courses/progress-service.ts:62-103`; `src/modules/courses/learner-playback-settings.ts:6-12`
- Fix: Match legacy first-position IN_PROGRESS threshold unless owner accepts 5%

## G2-2-017-005  [P2] GAP  facet F02  effort M
- Legacy: Input validation then auth then write and structured response `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:68-125`
- vNext now: Learner progress write uses a different scope and result model `src/modules/courses/progress-service.ts:334-458`
- Fix: Expose same validation/action/result sequence in a staff workflow

## G2-2-017-008  [P2] MISSING  facet F04  effort M
- Legacy: alreadyFresh true and attempt 1 on no existing progress `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:101-106`
- vNext now: Learner GET presents NOT_STARTED state without admin alreadyFresh outcome `src/modules/courses/progress-service.ts:201-226`
- Fix: Return typed alreadyFresh=true with no mutation

## G2-2-017-033  [P2] GAP  facet F11  effort M
- Legacy: Permission checks audited per learner and course `docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:397-403,482-499`
- vNext now: No admin retake audit in learner-only scope `src/modules/courses/progress-service.ts:106-169`
- Fix: Log denials and success without leaking learner data

## G2-2-017-037  [P2] GAP  facet F12  effort M
- Legacy: Includes all live content, not only timed videos `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:127-130`
- vNext now: vNext supports timed and manual content but no all-type reset `src/modules/courses/progress-service.ts:36-39,334-401`
- Fix: Reset manual content too, not only VIDEO/YOUTUBE

## G2-2-017-043  [P2] MISSING  facet F15  effort M
- Legacy: Optional admin audit service called on real reset; no email `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:110-117`
- vNext now: Activity completion events exist but not retake audit `src/modules/courses/progress-service.ts:320-329`
- Fix: Emit retake audit event; no email by default

## G2-2-017-056  [P2] GAP  facet F21  effort M
- Legacy: Optional AdminAuditLogService is sole side integration, no queue/webhook `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:58-59,110-117`
- vNext now: Activity event infrastructure records completion, not retake `src/modules/courses/progress-service.ts:320-330`
- Fix: Integrate new retake audit once; no external queue required

## G2-2-017-062  [P2] MISSING  facet F23  effort M
- Legacy: Legacy alreadyFresh branch is a no-write success `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:97-106`
- vNext now: New learner save creates a progress row only on actual activity `src/modules/courses/progress-service.ts:409-422`
- Fix: Implement alreadyFresh branch for staff command

## G2-2-017-063  [P2] GAP  facet F23  effort M
- Legacy: Legacy action audit key LEARNER_PROGRESS_START_ATTEMPT `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:110-117`
- vNext now: New activity type tracks learner completed content instead `src/modules/courses/progress-service.ts:320-329`
- Fix: Create staff retake event separate from learner completion

## G2-3-027-029  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ContentProgressSaveRequest.java:13-26`
- vNext now: `src/modules/courses/progress-service.ts:334-385`
- Fix: Legacy progress PUT uses lessonContentId, lastPositionSeconds and optional durationSeconds/completed; vNext binds content ID URL and deliveryId body, derives completion from settings.

## G2-3-027-056  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:820-827`
- vNext now: `src/modules/courses/progress-service.ts:201-230`
- Fix: Legacy bulk progress caps 500 enabled+active content IDs; vNext per-item API doesn't provide equivalent batch cap/response.

## G2-3-027-060  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:791-829`
- vNext now: `src/modules/courses/progress-service.ts:106-170`
- Fix: Legacy progress endpoint excludes disabled items; vNext checks path and content status/availability with different learner entitlement semantics.

## G2-3-027-075  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:791-829`
- vNext now: `src/modules/courses/progress-service.ts:201-230`
- Fix: Legacy 500-item cap and bulk DB method limits operations; vNext per-content GET causes N requests if used for full lesson list.

## G2-4-019-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy response exposes status WATCHED, percentWatched, position, duration, completedAt, firstCompletedAt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:234-251`)
- vNext now: New view status COMPLETED, percentComplete, position, authored duration, completedAt; omits firstCompletedAt. (`src/modules/courses/progress-service.ts:50-60`)
- Fix: Expose first completion timestamp and compatibility WATCHED label where needed.

## G2-4-019-008  [P2] GAP  facet F03  effort S
- Legacy: Legacy label WATCHED when threshold hit, versus IN_PROGRESS or NOT_STARTED. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:234-249`)
- vNext now: New status COMPLETED on completedAt; IN_PROGRESS only past minInProgressPercent5. (`src/modules/courses/progress-service.ts:68-104`)
- Fix: Align status label and 0–4 percent in-progress display behavior.

## G2-4-019-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy status WATCHED if completedAt notnull or percent reaches configurable threshold. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:234-240`)
- vNext now: New completed status requires completedAt; threshold logic applied when saving timed progress. (`src/modules/courses/progress-service.ts:77-104`; `src/modules/courses/progress-service.ts:375-381`)
- Fix: Keep response status semantically consistent after threshold setting changes.

## G2-4-019-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy saveProgress allows position, duration and optional completed Boolean. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:68-87`)
- vNext now: New PUT requires deliveryId, positionSeconds for VIDEO, completed true for other kinds. (`src/modules/courses/progress-service.ts:334-402`)
- Fix: Define typed request compatibility for player and manual resources.

## G2-4-019-043  [P2] GAP  facet F11  effort M
- Legacy: Legacy progress row keyed to numeric learner, not Section. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:21-25`)
- vNext now: New UUID membership scoped to college but content may be shared among Sections. (`src/db/schema/courses.ts:479-488`; `src/modules/courses/progress-service.ts:148-155`)
- Fix: Clarify retake isolation across shared offerings and same learner Section transfers.

## G2-4-019-045  [P2] GAP  facet F12  effort M
- Legacy: Legacy position update may move backward (rewatch), duration max of stored/client. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:166-175`)
- vNext now: New position can move backward; duration canonical authored metadata, not per-row max. (`src/modules/courses/progress-service.ts:238-270`; `src/modules/courses/progress-service.ts:375-381`)
- Fix: Define whether missing duration playback remains resumable and immutable once known.

## G2-4-019-060  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact status words WATCHED/IN_PROGRESS/NOT_STARTED. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:234-249`)
- vNext now: New API status COMPLETED/IN_PROGRESS/NOT_STARTED, humanized badges. (`src/modules/courses/progress-service.ts:50-56`; `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx:92-95`)
- Fix: Use legacy watched label on video resources if strict copy clone.

## G2-4-019-066  [P2] GAP  facet F20  effort M
- Legacy: Legacy duration=max prevents two devices from flip-flopping on client metadata. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:166-175`)
- vNext now: New authored duration is authoritative and not written to progress row. (`src/modules/courses/progress-service.ts:70-76`; `src/modules/courses/progress-service.ts:375-381`)
- Fix: Validate historical content without duration under alternating devices.

## G2-4-019-069  [P2] MISSING  facet F21  effort M
- Legacy: Legacy retake is synchronous insert select + audit logger. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:97-124`)
- vNext now: New lacks retake dispatch/action, manual completion event exists. (`src/modules/courses/progress-service.ts:273-332`)
- Fix: Implement reliable synchronous reset+audit in one transaction.

## G2-4-019-016  [P3] GAP  facet F04  effort S
- Legacy: Legacy not-started response duration0 and position0, percent0. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:253-261`)
- vNext now: New zero position with authored duration and NOT_STARTED, percent0. (`src/modules/courses/progress-service.ts:70-104`)
- Fix: Verify placeholder duration in unstarted player and API contract.
