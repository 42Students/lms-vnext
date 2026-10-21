# Work packet (wave 3): edit src/components/profile/learner-profile-workspace.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/job-preferences-dto.md, docs/audit/gap2/lane-1/learner-profile-controller.md

## G2-1-011-005  [P1] MISSING  facet F03  effort L
- Legacy: `docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:91`: `Job Notifications Enabled` boolean control.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:661-671`,`src/components/profile/learner-profile-workspace.tsx:930-958`: no notification toggle.
- Fix: Add opt-out toggle linked to actual job notification delivery.

## G2-1-011-039  [P1] MISSING  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:41-45`: job/interview messages honor opt-out as designed.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:957`: preference described as not affecting eligibility, but no notification setting.
- Fix: Integrate preference into actual notification outbox decision path.

## G2-1-004-008  [P2] MISSING  facet F03  effort L
- Legacy: `LearnerProfileController.java:1110-1146` supports one-time video intro write and read.
- vNext now: `learner-profile-workspace.tsx:169-220` has no mapped one-time video upload control.
- Fix: Surface approved signed-video upload/playback with uploaded disabled state, or retire explicitly.
