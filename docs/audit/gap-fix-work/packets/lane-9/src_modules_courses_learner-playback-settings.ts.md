# Work packet: edit src/modules/courses/learner-playback-settings.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/syllabus-video.md, docs/audit/gap2/lane-2/client-settings-controller.md, docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md

## G2-14-008-022  [P1] GAP  facet F06  effort S
- Legacy: Legacy progress interval platform override default15000ms; vNext default5000ms and global override supports 5000–600000 — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:17-20,70-74`
- vNext now: `src/components/courses/learner-video-player.tsx:22-28,51-59`; `src/modules/courses/learner-playback-settings.ts:6-10`
- Fix: Align default 15000ms if no override and exact override validation

## G2-2-035-001  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:34-46 GET /api/v1/client-settings accessible signed-in roles
- vNext now: src/modules/courses/learner-playback-settings.ts:16-33 readLearnerPlaybackSettings server helper; /api/client-settings route absent from API directory
- Fix: Expose safe authenticated GET `/api/client-settings` or migrate every reader to server-injected props.

## G2-2-035-030  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:52 progress save default15000 floor5000
- vNext now: src/modules/courses/learner-playback-settings.ts:6 saveIntervalMs DEFAULT 5000
- Fix: Align default frequency (15 sec vs 5 sec) to avoid 3x client writes at 10k users.

## G2-2-035-044  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:52 progress saves every15s by default
- vNext now: src/modules/courses/learner-playback-settings.ts:6 progress saves every5s by default
- Fix: Load-test increased write frequency; restore 15s default absent clear evidence/owner approval.

## G2-2-035-054  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:52 progressSave default15000
- vNext now: src/modules/courses/learner-playback-settings.ts:6 default5000
- Fix: Reconcile frequency drift explicitly as cost/scale decision.

## G2-2-035-055  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:44-57 generic GET for signed-in roles
- vNext now: src/modules/courses/learner-playback-settings.ts:16-33 internal server helper not global client route
- Fix: Restore one safe public-in-auth contract if old consumers expect it.

## G2-2-037-032  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:51-56 15s save/poll and90% watched defaults
- vNext now: src/modules/courses/learner-playback-settings.ts:6 save5s,chat15s,watched90%
- Fix: Align autosave default and honor current runtime overrides.

## G2-2-037-052  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:52 default save15000ms
- vNext now: src/modules/courses/learner-playback-settings.ts:6 save default5000ms
- Fix: Model 3x API write increase under 10k concurrency.

## G2-2-035-017  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:60-62 if service absent returns fallback
- vNext now: src/modules/courses/learner-playback-settings.ts:16-33 DB read no catch around getDb
- Fix: Avoid crashing learner course page when platform settings DB temporarily unavailable; use safe fallback.

## G2-2-035-019  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:51-52 under-floor gets clamped silently
- vNext now: src/modules/courses/learner-playback-settings.ts:7-14 invalid stored value causes fallback to default
- Fix: Log operator-facing config validation warning; keep learner response healthy.

## G2-2-035-020  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:57 GET OK status/message and data
- vNext now: src/modules/courses/learner-playback-settings.ts:27-32 direct settings object server
- Fix: Keep HTTP success parser compatibility; no toast expected.
