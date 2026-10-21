# Work packet (wave 2): edit src/components/placements/learner-placement-notification-settings.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/job-preferences-repository.md

## G2-4-015-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy repository is backend-only, no standalone page or navigation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobPreferencesRepository.java:9-12`)
- vNext now: New Job Preferences profile Card and independent Placement notifications page. (`src/components/profile/learner-profile-workspace.tsx:661-671`; `src/components/placements/learner-placement-notification-settings.tsx:54-80`)
- Fix: Make both replacement destinations discoverable from learner profile.

## G2-4-015-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy Job Preferences section groups six scalar fields. (`docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:85-92`)
- vNext now: New Card displays four fields; notifications separated on another screen. (`src/components/profile/learner-profile-workspace.tsx:661-671`; `src/components/placements/learner-placement-notification-settings.tsx:63-80`)
- Fix: Restore legacy grouping or provide explicit linked section preserving all fields.

## G2-4-015-008  [P2] GAP  facet F03  effort M
- Legacy: Old label Job Notifications Enabled is one checkbox. (`docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:91-91`)
- vNext now: New settings show separate Matching opportunities and Application updates choices. (`src/components/placements/learner-placement-notification-settings.tsx:63-80`)
- Fix: Explain mapping and optionally retain single master switch compatibility.

## G2-4-015-023  [P2] GAP  facet F06  effort M
- Legacy: Legacy editor includes the Boolean notification flag with profile text inputs. (`docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:85-92`)
- vNext now: New profile edit dialog has four fields; notification UI requires extra review/confirm. (`src/components/profile/learner-profile-workspace.tsx:992-1068`; `src/components/placements/learner-placement-notification-settings.tsx:81-103`)
- Fix: Restore same-screen edit or explicit navigation and clear user copy.

## G2-4-015-031  [P2] GAP  facet F09  effort M
- Legacy: Legacy repository has no dialogs; frontend Boolean editor is one of six Job Preferences fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobPreferencesRepository.java:9-12`; `docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:85-92`)
- vNext now: New Edit Job Preferences Dialog excludes Boolean; separate two-toggle confirmation dialog. (`src/components/profile/learner-profile-workspace.tsx:992-1068`; `src/components/placements/learner-placement-notification-settings.tsx:89-103`)
- Fix: Match old form grouping or clearly justify split UI.

## G2-4-015-040  [P2] GAP  facet F12  effort M
- Legacy: Legacy status mappings include INTERVIEW OFFERED HIRED ASSESSMENT REJECTED SHORTLISTED WAITLISTED. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:94-123`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:245-257`)
- vNext now: New preference label Application updates not broken down by stage. (`src/components/placements/learner-placement-notification-settings.tsx:72-78`)
- Fix: Map all old seven status event types to application-updates flag.

## G2-4-015-050  [P2] GAP  facet F16  effort S
- Legacy: Old single checkbox lives among six scalar inputs. (`docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:85-92`)
- vNext now: New two min-height checkbox row cards on dedicated page. (`src/components/placements/learner-placement-notification-settings.tsx:63-80`)
- Fix: Restore grouping or sign off expanded presentation.

## G2-4-015-054  [P3] GAP  facet F18  effort S
- Legacy: Legacy PUT success is Updated successfully. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:1190-1199`)
- vNext now: New notifications success toast uses Placement notification choices saved. (`src/components/placements/learner-placement-notification-settings.tsx:38-49`)
- Fix: Match legacy copy if replicating same action or document new semantics.
