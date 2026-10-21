# Work packet (wave 2): edit src/modules/courses/learner-playback-settings.ts

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/syllabus-video.md, docs/audit/gap2/lane-2/client-settings-controller.md, docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md

## G2-14-008-043  [P2] GAP  facet F12  effort S
- Legacy: Legacy completion percentWon no observed min threshold when position>0, status IN_PROGRESS; vNext default minInProgressPercent5 — `docs/legacy-source/frontend/src/components/Course/Syllabus/ContentProgressBadge.jsx:19-26`
- vNext now: `src/modules/courses/progress-service.ts:62-103`; `src/modules/courses/learner-playback-settings.ts:6-12`
- Fix: Match legacy first-position IN_PROGRESS threshold unless owner accepts 5%

## G2-14-008-058  [P2] GAP  facet F19  effort S
- Legacy: Legacy timeupdate gated once per 15s with no overlapping requests; vNext min5000, savingRef single-flight — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:70-81`
- vNext now: `src/components/courses/learner-video-player.tsx:51-60`; `src/modules/courses/learner-playback-settings.ts:6-10`
- Fix: Match configured save interval by default and singleflight semantics

## G2-2-035-005  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:47-57 3 visible developer-facing JSON keys
- vNext now: src/modules/courses/learner-playback-settings.ts:27-32 returns saveIntervalMs,watchedThresholdPercent,minInProgressPercent,chatPollIntervalMs
- Fix: Document new fourth value and renamed save interval key; update consumer shape.

## G2-2-035-008  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:52 key progressSaveIntervalMs
- vNext now: src/modules/courses/learner-playback-settings.ts:28 key saveIntervalMs (without 'progress')
- Fix: Restore compatibility alias `progressSaveIntervalMs` for client-settings route.

## G2-2-035-010  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:47-57 Response{status,message,data}
- vNext now: src/modules/courses/learner-playback-settings.ts:27-32 plain object from internal module
- Fix: Adapt old nested `.data.data` consumer assumptions.

## G2-2-035-013  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:51 Math.max(3000,configured) chat floor
- vNext now: src/modules/courses/learner-playback-settings.ts:13 accepts 5000..120000 and default15000
- Fix: Decide chat floor 3000 vs 5000; show exact validation in SuperAdmin settings.

## G2-2-035-014  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:52 Math.max(5000,configured) progress save floor
- vNext now: src/modules/courses/learner-playback-settings.ts:10 validates 5000..600000; falls back default5000
- Fix: Clarify handling under-min values: clamp to 5000 legacy vs reject+fallback vNext.

## G2-2-035-016  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:60-62 readInt accepts integer setting via AppSettingsService
- vNext now: src/modules/courses/learner-playback-settings.ts:7-8 only 1..6 digit decimal strings, rejects signed/whitespace
- Fix: Specify canonical storage and exact invalid override behavior.

## G2-2-035-026  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:24-32 whitelist intentionally safe for ANY signed-in role
- vNext now: src/modules/courses/learner-playback-settings.ts:16-23 helper no role check itself; called from learner course server
- Fix: Define authenticated safe endpoint with role-neutral read and no-college fallback.

## G2-2-035-029  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:51 chat polls default15000 floor3000
- vNext now: src/modules/courses/learner-playback-settings.ts:6 default15000, :13 floor5000 cap120000
- Fix: Decide max interval and preserve adjustable tenant polling policy.

## G2-2-035-033  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:60-62 fallback when AppSettingsService not injected
- vNext now: src/modules/courses/learner-playback-settings.ts:16-33 fallback on invalid/missing rows but not DB outage
- Fix: Catch query failures or use cached default; never block course reader.

## G2-2-035-046  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:51 setting Math.max clamps 0/negative chat
- vNext now: src/modules/courses/learner-playback-settings.ts:7-13 rejects negative and falls back 15000
- Fix: Preserve deliberate fail-safe semantics, test 0, -1, 3001, large values.

## G2-2-035-048  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:60-62 optional service dependency and fallback
- vNext now: src/modules/courses/learner-playback-settings.ts:16-33 DB query may throw on migrations/outage
- Fix: Use fallback/cached values on migration downtime, alert operator.

## G2-2-035-049  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:41-62 Spring AppSettingsService GLOBAL lookup
- vNext now: src/modules/courses/learner-playback-settings.ts:2-23 Drizzle platformSettingOverrides table
- Fix: Map MySQL settings keys/scopes to GCP/Postgres overrides and migration.

## G2-2-035-051  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:60-62 legacy table managed AppSettingsService
- vNext now: src/modules/courses/learner-playback-settings.ts:19-23 platformSettingOverrides scoped GLOBAL key/value
- Fix: Check applied migration019? platform_setting_overrides and global setting import.

## G2-2-035-053  [P2] GAP  facet F23  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:51 floor3000 chat
- vNext now: src/modules/courses/learner-playback-settings.ts:13 floor5000 cap120000
- Fix: Obtain owner decision on stricter polling floor.

## G2-2-037-027  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:51-56 three runtime tunables
- vNext now: src/modules/courses/learner-playback-settings.ts:27-32 four prop keys, saveInterval renamed
- Fix: Map exact API key names and effect on progress/comment polls.

## G2-2-037-060  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:51-56 integer global settings
- vNext now: src/modules/courses/learner-playback-settings.ts:18-32 Postgres global overrides
- Fix: Map setting IDs/types/defaults and effect on date/time formats.

## G2-2-035-011  [P3] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:47-57 LinkedHashMap outputs chat,save,watch in that order
- vNext now: src/modules/courses/learner-playback-settings.ts:27-32 order save,watched,minInProgress,chat
- Fix: Preserve deterministic property order only for consumers depending on it; option ordering irrelevant otherwise.

## G2-2-035-041  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:51 'chatPollIntervalMs', :52 'progressSaveIntervalMs'
- vNext now: src/modules/courses/learner-playback-settings.ts:27-32 'saveIntervalMs' renaming
- Fix: Preserve exact legacy JSON naming for public client contract.
