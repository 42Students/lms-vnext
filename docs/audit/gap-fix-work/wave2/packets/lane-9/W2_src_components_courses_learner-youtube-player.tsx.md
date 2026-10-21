# Work packet (wave 2): edit src/components/courses/learner-youtube-player.tsx

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/youtube.md

## G2-12-008-003  [P2] GAP  facet F02  effort S
- Legacy: Title row and edit/delete/date above bordered player in ln-syllabus-video-wrap `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:168-200`
- vNext now: Standalone rounded 16:9 player + progress footer `src/components/courses/learner-youtube-player.tsx:457-467`
- Fix: Reconstruct title/action bar and wrapper classes

## G2-12-008-005  [P2] GAP  facet F02  effort S
- Legacy: Legacy video frame followed ContentProgressBadge `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:200-212`
- vNext now: Inline Saved-at clock, loading/completed text; no standalone badge `src/components/courses/learner-youtube-player.tsx:467-500`
- Fix: Restore legacy progress badge styling

## G2-12-008-009  [P2] GAP  facet F03  effort S
- Legacy: Learner progress badge with completion status `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:212-212`
- vNext now: Progress status + Saved at x/y counters `src/components/courses/learner-youtube-player.tsx:467-485`
- Fix: Match badge shape and wording

## G2-12-008-010  [P2] GAP  facet F04  effort S
- Legacy: Embed URL from contentDataDTO.link or file_dto.cloud_storage_object `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:75-79`
- vNext now: externalUrl from normalized course content `src/components/courses/learner-youtube-player.tsx:113-125,155-157`
- Fix: Map legacy secondary file DTO fallback for migrated content

## G2-12-008-011  [P2] GAP  facet F04  effort S
- Legacy: Resume if >5 sec and not WATCHED/completedAt `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:63-70`
- vNext now: Resume any positive initialPositionSeconds unless completed `src/components/courses/learner-youtube-player.tsx:213-227`
- Fix: Restore 5sec resume threshold

## G2-12-008-028  [P2] GAP  facet F10  effort S
- Legacy: Player ticks every5s but saves only if settings interval (default15s) elapsed `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:94-99`
- vNext now: Progress interval uses saveIntervalMs prop default5000 `src/components/courses/learner-youtube-player.tsx:262-267`
- Fix: Confirm configured save interval passed and matches legacy15s

## G2-12-008-031  [P2] GAP  facet F10  effort S
- Legacy: Progress response passed onProgressUpdate to parent and updates local badge `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:106-111`
- vNext now: Updates local state then router.refresh only on completion `src/components/courses/learner-youtube-player.tsx:349-367`
- Fix: Update parent roadmap immediately on partial watch

## G2-12-008-032  [P2] GAP  facet F11  effort S
- Legacy: Writes progress only LEARNER; faculty gets edit/delete controls `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:54-57,80-83`
- vNext now: ReadOnly path suppresses writes; context wrapper authorizes learner `src/components/courses/learner-youtube-player.tsx:285-287`
- Fix: Confirm faculty preview never persists progress

## G2-12-008-035  [P2] GAP  facet F12  effort S
- Legacy: Resume position floor if >5 and unfinished `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:63-69`
- vNext now: Clamps resume to duration-1 and >0 `src/components/courses/learner-youtube-player.tsx:213-227`
- Fix: Reapply >5 threshold, preserve clamp

## G2-12-008-036  [P2] GAP  facet F12  effort S
- Legacy: Progress saves throttled by clientSettings interval override `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:80-85`
- vNext now: UI saveIntervalMs provided by props default 5000 `src/components/courses/learner-youtube-player.tsx:119-120,262-267`
- Fix: Thread tenant setting into player

## G2-12-008-042  [P2] GAP  facet F16  effort S
- Legacy: Video in ln-syllabus-video-wrap and flex-wrapped toolbar `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:168-211`
- vNext now: Explicit full-width 16:9 aspect player and meta footer `src/components/courses/learner-youtube-player.tsx:457-467`
- Fix: Match legacy frame sizing and toolbar wrapping

## G2-12-008-043  [P2] GAP  facet F16  effort S
- Legacy: Edit/delete/date flex row wraps on mobile `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:168-199`
- vNext now: No faculty actions in player; footer wraps `src/components/courses/learner-youtube-player.tsx:457-497`
- Fix: Restore role toolbar on mobile

## G2-12-008-044  [P2] GAP  facet F17  effort S
- Legacy: Player aria-label uses contentTitle or Embedded YouTube video `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:209-209`
- vNext now: Static `YouTube Course player` label `src/components/courses/learner-youtube-player.tsx:459-464`
- Fix: Include authored title in accessible label

## G2-12-008-047  [P2] GAP  facet F18  effort S
- Legacy: ContentTitle contentType `YouTube Video` `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:169-170`
- vNext now: Footer contains `Resume saved automatically` `src/components/courses/learner-youtube-player.tsx:467-485`
- Fix: Restore title and date chrome

## G2-12-008-048  [P2] GAP  facet F18  effort S
- Legacy: Video unavailable...Open on YouTube `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:203-206`
- vNext now: This YouTube URL cannot be played inline...Open on YouTube ↗ `src/components/courses/learner-youtube-player.tsx:441-451`
- Fix: Use legacy reason-specific copy

## G2-12-008-051  [P2] GAP  facet F19  effort S
- Legacy: 5s polling player, 15s default save throttle `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:85-99`
- vNext now: Client callback saveIntervalMs, could be 5s `src/components/courses/learner-youtube-player.tsx:262-267`
- Fix: Respect 15s performance setting

## G2-12-008-052  [P2] GAP  facet F20  effort S
- Legacy: Finished progress resets resume; position5sec is ignored `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:63-70`
- vNext now: Any positive unfinished seek, bounded to end `src/components/courses/learner-youtube-player.tsx:213-227`
- Fix: Match resume cutoff

## G2-12-008-056  [P2] GAP  facet F21  effort S
- Legacy: ClientSettings loadClientSettings reads watched settings and interval `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:10-10`
- vNext now: Interval passed from caller, no settings fetch in player `src/components/courses/learner-youtube-player.tsx:119-120,262-267`
- Fix: Verify caller derives tenant defaults

## G2-12-008-057  [P2] GAP  facet F22  effort S
- Legacy: Legacy LessonContent progress uses integer lessonContentId, contentDataDTO, WATCHED/completedAt `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:57-78`
- vNext now: VNext contentId/deliveryId UUID, progress enum NOT_STARTED/IN_PROGRESS/COMPLETED `src/components/courses/learner-youtube-player.tsx:111-128,338-346`
- Fix: Document field/status mapping, no migration required

## G2-12-008-059  [P2] GAP  facet F23  effort S
- Legacy: Faculty YoutubeDrawer+delete embedded with player `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:171-195`
- vNext now: Learner player has no authoring controls, new faculty authoring module `src/components/courses/learner-youtube-player.tsx:111-128`
- Fix: Document role split and restore equivalent teacher view chrome

## G2-12-008-007  [P3] MISSING  facet F03  effort S
- Legacy: ContentAddedDate visible in action row `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:197-197`
- vNext now: No content added date within player `src/components/courses/learner-youtube-player.tsx:457-500`
- Fix: Render creation date above video

## G2-12-008-017  [P3] GAP  facet F06  effort S
- Legacy: PlayerVars rel=0, modestbranding=1 and optional start `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:125-125`
- vNext now: VNext rel=0, playsinline=1, origin, seek via API `src/components/courses/learner-youtube-player.tsx:202-207`
- Fix: Preserve video player appearance/branding options

## G2-12-008-045  [P3] GAP  facet F17  effort S
- Legacy: Open on YouTube target blank rel noopener noreferrer `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:204-205`
- vNext now: External link rel safe, no target blank `src/components/courses/learner-youtube-player.tsx:445-451,488-496`
- Fix: Match new-tab behavior or note accessibility preference
