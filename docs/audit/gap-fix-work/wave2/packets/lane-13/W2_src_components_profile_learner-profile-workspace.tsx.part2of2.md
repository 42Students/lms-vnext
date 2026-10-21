# Work packet (wave 2): edit src/components/profile/learner-profile-workspace.tsx (part 2 of 2)

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/qualification.md, docs/audit/gap2/lane-4/job-preferences-repository.md, docs/audit/gap2/lane-1/job-preferences-dto.md, docs/audit/gap2/lane-1/learner-profile-controller.md, docs/audit/gap2/lane-1/learner-profile.md

## G2-3-017-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/profile/about/qualifications.js:206-213`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:478-510`
- Fix: Legacy Save action disabled when required educationType or institutionName empty; vNext saveCollection runs with field-level validation. Match disabled/validation state and Add/Save button labels.

## G2-3-017-006  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/profile/about/qualifications.js:85-104`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:71-83`
- Fix: Legacy institution control autocompletes colleges from server and suppresses stale requests via AbortController; vNext Institution field generic text input. Add searchable institution picker with free-text escape.

## G2-3-017-011  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/QualificationRepository.java:14-17`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:152-165`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:714-735`
- Fix: Legacy repository excludes deleted qualifications and sorts start_year DESC then end_year DESC; service sorts isRecent first. VNext live education array no equivalent deleted filtering or sort verified. Implement stable display sort independent of array reorder.

## G2-3-017-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/profile/about/qualifications.js:122-204`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:71-83`, `src/modules/people/learner-education-picker-model.ts:9-24`
- Fix: Legacy educationType drives program options and selecting program resets specialization; vNext generic fields and fixed type list with no dependent program picker. Restore reset behavior and available option filtering.

## G2-3-017-024  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/profile/about/qualifications.js:3-7`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:517-526`
- Fix: Legacy DeleteOutlined in Popconfirm with per-qualification context, vNext uses generic learnerProfileDeletePrompt and confirmation flow. Match modal title, destructive action label and placement.

## G2-3-017-025  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/profile/about/qualifications.js:206-220`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:478-511`
- Fix: Legacy add/edit is in dedicated qualifications panel, vNext generic collection editor with `Save` and discard. Verify focus/dirty navigation modal exact wording.

## G2-3-017-026  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:668-722`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:452-511`
- Fix: Legacy endpoints mutate individual education records by positional index and return sorted full list; vNext saves whole collection using stable ID and optimistic version. Keep stable vNext IDs but reproduce per-row isolation and returned order.

## G2-3-017-035  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:600-666`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:71-83`
- Fix: Legacy education config and college search failure creates toast; vNext static picker cannot distinguish missing remote config. Add warning/retry for configured source failure.

## G2-3-017-040  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/profile/about/qualifications.js:85-104`, `122-205`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:478-511`
- Fix: Legacy Ant Select/AutoComplete keyboard type-ahead, dependency resets and focused errors; vNext generic text fields have no equivalent suggestions. Match label/role/combobox and aria error wiring.

## G2-3-017-041  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:681-719`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:452-474`
- Fix: Legacy toast strings `Added successfully`, `Updated successfully`, `Deleted successfully` vs vNext `Profile section saved` for all actions. Use action-specific copy.

## G2-3-017-043  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/QualificationRepository.java:14-17`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:152-165`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:452-474`
- Fix: Legacy DB indexed learner_id and DESC start/end sorting, per-row mutation; vNext whole education collection saves even when changing one row (version CAS). Profile read should use bounded JSON schema and stable ordering.

## G2-3-017-044  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/profile/about/qualifications.js:85-104`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:452-511`
- Fix: Legacy autocomplete aborts prior requests to prevent stale college options; vNext no remote request. Add AbortController sequence guard when reintroducing autocomplete.

## G2-4-015-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy repository is backend-only, no standalone page or navigation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobPreferencesRepository.java:9-12`)
- vNext now: New Job Preferences profile Card and independent Placement notifications page. (`src/components/profile/learner-profile-workspace.tsx:661-671`; `src/components/placements/learner-placement-notification-settings.tsx:54-80`)
- Fix: Make both replacement destinations discoverable from learner profile.

## G2-4-015-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy Job Preferences section groups six scalar fields. (`docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:85-92`)
- vNext now: New Card displays four fields; notifications separated on another screen. (`src/components/profile/learner-profile-workspace.tsx:661-671`; `src/components/placements/learner-placement-notification-settings.tsx:63-80`)
- Fix: Restore legacy grouping or provide explicit linked section preserving all fields.

## G2-4-015-007  [P2] MISSING  facet F03  effort M
- Legacy: Old label Exam Slot Preference appears as fifth preference field. (`docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:90-90`)
- vNext now: New card and editor omit Exam Slot Preference. (`src/components/profile/learner-profile-workspace.tsx:661-671`; `src/components/profile/learner-profile-workspace.tsx:992-1068`)
- Fix: Add persisted exam-slot preference with exact label and choice list.

## G2-4-015-023  [P2] GAP  facet F06  effort M
- Legacy: Legacy editor includes the Boolean notification flag with profile text inputs. (`docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:85-92`)
- vNext now: New profile edit dialog has four fields; notification UI requires extra review/confirm. (`src/components/profile/learner-profile-workspace.tsx:992-1068`; `src/components/placements/learner-placement-notification-settings.tsx:81-103`)
- Fix: Restore same-screen edit or explicit navigation and clear user copy.

## G2-4-015-031  [P2] GAP  facet F09  effort M
- Legacy: Legacy repository has no dialogs; frontend Boolean editor is one of six Job Preferences fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobPreferencesRepository.java:9-12`; `docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:85-92`)
- vNext now: New Edit Job Preferences Dialog excludes Boolean; separate two-toggle confirmation dialog. (`src/components/profile/learner-profile-workspace.tsx:992-1068`; `src/components/placements/learner-placement-notification-settings.tsx:89-103`)
- Fix: Match old form grouping or clearly justify split UI.

## G2-4-015-052  [P2] GAP  facet F17  effort M
- Legacy: Legacy PUT trims present values, untouched absent fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:954-974`)
- vNext now: New dialog saves entire document with CAS. (`src/components/profile/learner-profile-workspace.tsx:992-1006`; `src/modules/people/learner-profile-document-edit-service.ts:29-38`)
- Fix: Keyboard Cancel must not mutate other profile sections.

## G2-4-015-053  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact section title Job Preferences and all six field labels. (`docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:85-92`)
- vNext now: New section retains four labels but not Exam Slot Preference/Job Notifications Enabled. (`src/components/profile/learner-profile-workspace.tsx:661-671`)
- Fix: Restore missing exact labels and helper copy.

## G2-1-011-036  [P3] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:924-975`: one row lookup per GET and after save, no heavy joins.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:926-929`: full profile document save on preference change.
- Fix: Prevent unrelated document rewrites/conflicts for scalar preference edit.

## G2-1-004-054  [P3] GAP  facet F18  effort S
- Legacy: `LearnerProfileController.java:295-324` conflict sentence 'Profile was updated elsewhere. Please refresh and try again.'
- vNext now: `learner-profile-workspace.tsx:299-301` longer two-tab conflict guidance.
- Fix: Use legacy sentence as heading and retained-draft help as secondary.

## G2-1-031-050  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:151: aria-busy on profile content and ListingPageHeader ariaLabel.
- vNext now: src/components/profile/learner-profile-workspace.tsx:151-163, P:40-44: accessibility partly via forms and PageHeader; no page-level aria-busy.
- Fix: Expose in-flight busy on content.
