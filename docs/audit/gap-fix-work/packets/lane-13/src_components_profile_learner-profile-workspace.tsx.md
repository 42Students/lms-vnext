# Work packet: edit src/components/profile/learner-profile-workspace.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l11-u031-cross-forms.md, docs/audit/gap2/lane-1/learner-profile-controller.md, docs/audit/gap2/lane-1/learner-profile.md, docs/audit/gap2/lane-3/qualification.md, docs/audit/gap2/lane-1/job-preferences-dto.md, docs/audit/gap2/lane-4/job-preferences-repository.md

## G2-11-031-033  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:27: current contacts tied to loginUser; form can alter primary mobile.
- vNext now: src/components/profile/learner-profile-workspace.tsx:651-660: current primary read-only; alternate edited.
- Fix: Clarify secure primary-mobile update path.

## G2-1-004-002  [P1] GAP  facet F01  effort L
- Legacy: `LearnerProfileController.java:601-666` has education config, exam configs/code, grading types, searchable colleges endpoints.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:73-84` uses locally defined grading and institution fields; equivalent endpoints not mapped.
- Fix: Provide canonical configuration and searchable colleges/exams on a supported route.

## G2-1-004-003  [P1] GAP  facet F01  effort L
- Legacy: `LearnerProfileController.java:1110-1146,1177-1237` defines video intro, job-preferences and default resume GET/PUT separately.
- vNext now: `learner-profile-workspace.tsx:209-210` edits job preferences as document; video/resume endpoints not mapped here.
- Fix: Map video and default resume lifecycle or explicitly document approved removal.

## G2-1-004-064  [P1] GAP  facet F23  effort L
- Legacy: `LearnerProfileController.java:601-666` grading, exam and college configuration endpoints.
- vNext now: `learner-profile-workspace.tsx:73-84` static select with free institution.
- Fix: Use catalogs/metadata service instead of local-only list.

## G2-1-004-065  [P1] GAP  facet F23  effort L
- Legacy: `LearnerProfileController.java:1110-1146,1210-1237` video intro and default resume options.
- vNext now: `learner-profile-workspace.tsx:169-220` no equivalent direct controls.
- Fix: Decide explicit product parity for video and resume, keep file access signed.

## G2-1-031-045  [P1] GAP  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:1410-1486: Resume view/replace/remove .pdf/.doc/.docx and Drive URL import.
- vNext now: src/components/profile/learner-profile-workspace.tsx:573-582: Resume section only links/metadata in core workspace; upload flow separate.
- Fix: Ensure signed file upload, replace, remove and import from link reachable on profile.

## G2-3-017-016  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:53-54`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:41-69`
- vNext now: `src/modules/people/profile-validation.ts:272-313`, `src/components/profile/learner-profile-workspace.tsx:478-511`
- Fix: Legacy stores isRecentEducation and QualificationValidator requires exactly one primary in relevant application qualification lists; live vNext educationSchema lacks isRecentEducation and no selection/uniqueness. Add primary/recent selector and invariant where applicable.

## G2-1-011-019  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:1190-1200`: PUT returns updated DTO in Response wrapper.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:925-929`: Save closes on success through callback, pending label.
- Fix: Show legacy-equivalent save feedback and leave dialog open on validation error.

## G2-1-004-031  [P2] MISSING  facet F07  effort M
- Legacy: `LearnerProfileServiceImpl.java:880-895` repeats video intro write rejection with literal once-only message.
- vNext now: `learner-profile-workspace.tsx:169-220` no matching video error.
- Fix: Provide once-only error where video intro remains available.

## G2-1-004-032  [P2] GAP  facet F08  effort S
- Legacy: `LearnerProfileController.java:328-1237` response envelope has 'Success', 'Updated successfully', 'Added successfully' and 'Deleted successfully'.
- vNext now: `learner-profile-workspace.tsx:285-303` toast 'Profile updated', failure 'Profile update failed'.
- Fix: Restore action-specific success copy and status announcement.

## G2-1-004-033  [P2] GAP  facet F08  effort S
- Legacy: `ProfileSectionsPanel.js:365-408` list toasts 'Saved', 'Removed', 'Added'.
- vNext now: `learner-profile-workspace.tsx:382` uses 'Contact details saved' and generic profile toast.
- Fix: Make per-section text match legacy verbs and operations.

## G2-1-031-027  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:157-159: 'Couldn't refresh profile'/'Showing the last profile we loaded.'
- vNext now: src/components/profile/learner-profile-workspace.tsx:280-300: manual refresh fetch errors use toast/error model; no same inline banner.
- Fix: Restore exact stale refresh warning.

## G2-3-017-022  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:681-719`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:452-474`, `285-302`
- Fix: Legacy create returns `Added successfully` (201), update `Updated successfully`, delete `Deleted successfully`; vNext owned-section update toast `Profile section saved`/`Section update failed`. Restore action-specific success/error copy.

## G2-3-017-023  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/profile/about/qualifications.js:56-104`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:205-206`
- Fix: Legacy loading errors say `Failed to load education data. Please try again.` and `College search failed`; vNext hardcoded choices have no fetch or retry states. Add retriable network states when restoring API.

## G2-4-015-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy update trims non-null role, shift, city and exam text. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:955-969`)
- vNext now: New edit roles split at commas and trims each entry. (`src/components/profile/learner-profile-workspace.tsx:1012-1022`)
- Fix: Preserve singular titles containing commas.
