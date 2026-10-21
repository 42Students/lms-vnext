# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/job-preferences.md

10 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/job-preferences.md

## G2-6-019-010  [P1] GAP  facet F04  effort M
- Legacy: Legacy workShiftPreference free text such as Day Shift/Night Shift/Flexible/Remote (JobPreferences.java:28-29).
- vNext now: vNext enum DAY/NIGHT/ROTATIONAL/FLEXIBLE/empty (profile-validation.ts:513).
- Fix: Map legacy Night Shift/Day Shift/Remote without silent loss; preserve unrecognized text.

## G2-6-019-012  [P1] MISSING  facet F04  effort M
- Legacy: Legacy examSlotPreference Morning/Afternoon/Evening (JobPreferences.java:34-36).
- vNext now: vNext profile JSON contract has no exam slot (profile-validation.ts:510-518).
- Fix: Persist examSlotPreference and expose exact three options and empty/default.

## G2-6-019-014  [P1] GAP  facet F04  effort M
- Legacy: Legacy jobNotificationsEnabled Boolean NOT NULL default true (JobPreferences.java:41-45).
- vNext now: vNext split notifyMatchingJobs and notifyApplicationUpdates default true (placements.ts:334-341).
- Fix: Specify mapping of legacy all-jobs/interview notifications to both distinct notification toggles.

## G2-6-019-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy fields update with PATCH-like non-null semantics (LearnerProfileServiceImpl.java:943-975).
- vNext now: vNext profile saves full jobPreferences document under profile save callback (learner-profile-workspace.tsx:925-927).
- Fix: Prevent stale client section write overwriting separately updated fields; use per-section CAS/merge.

## G2-6-019-019  [P1] GAP  facet F06  effort M
- Legacy: Legacy not-specified fields unchanged on PUT (LearnerProfileServiceImpl.java:954-972).
- vNext now: vNext default profile schema fills all four fields with empty strings/array (profile-validation.ts:510-518).
- Fix: Distinguish omitted from explicit clear; do not erase preferences when older profile payload excludes section.

## G2-6-019-031  [P1] GAP  facet F11  effort M
- Legacy: Legacy GET requireAccessLearner; PUT requireWriteAccessLearner (LearnerProfileController.java:1177-1200).
- vNext now: vNext own candidate preferences require active learner membership/placements read (candidate-preferences-service.ts:29-46,68-97).
- Fix: Confirm staff profile read/edit rights remain where old requireAccessLearner allowed them, without allowing staff to change private consent.

## G2-6-019-038  [P1] GAP  facet F15  effort L
- Legacy: Legacy jobNotificationsEnabled defaults true for status/interview messages (JobPreferences.java:41-45).
- vNext now: vNext learner placement notification preferences independently written via updateOwnPlacementNotificationPreferences (learner-placement-notification-service.ts:18-33,71-96).
- Fix: Verify unsubscribe blocks all appropriate templates including SMS/email, not only in-app updates.

## G2-6-019-039  [P1] MISSING  facet F15  effort M
- Legacy: Legacy notification toggle in job preferences DTO (JobPreferencesDTO.java:9-16).
- vNext now: New profile Edit Job Preferences omits notification control (learner-profile-workspace.tsx:930-957).
- Fix: Expose unified notification opt-out from profile or a clear direct link to notification settings.

## G2-6-019-046  [P1] GAP  facet F20  effort M
- Legacy: Legacy nullable job pref columns can preserve partial updates (LearnerProfileServiceImpl.java:954-972).
- vNext now: VNext profile schema supplies defaults at decode time (profile-validation.ts:510-518).
- Fix: Prevent partial update from clearing omitted values, especially migration/sync.

## G2-6-019-051  [P1] MISSING  facet F23  effort M
- Legacy: Legacy PAP interest and exam-slot retained on entity (JobPreferences.java:34-39).
- vNext now: Neither present in four-field profile schema (profile-validation.ts:510-518).
- Fix: Recover omitted attributes in durable profile or placement options and show controls.
