# Work packet (wave 2): edit src/components/placements/learner-placement-registration.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-cell.md, docs/audit/gap2/lane-5/l15-u023-learner-registration-controller.md

## G2-12-005-008  [P2] GAP  facet F03  effort S
- Legacy: Registration panel includes dynamic batch name in header `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:175-205`
- vNext now: Header is static `Registration`, no cohort name `src/components/placements/learner-placement-registration.tsx:51-53`
- Fix: Provide batch/cohort name in registration read model

## G2-12-005-013  [P2] GAP  facet F04  effort S
- Legacy: Registered choice displays `You are registered for <label>.` and missing-choice prompts drive eligibility `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:156-158`
- vNext now: Displays `Your choice: <label>` and generic stage copy `src/components/placements/learner-placement-registration.tsx:71-75`
- Fix: Restore contextual registration status sentence

## G2-12-005-022  [P2] GAP  facet F06  effort S
- Legacy: No registration default until explicit selection if no saved choice `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:52-55`
- vNext now: Default `PLACEMENTS` preselected when null `src/components/placements/learner-placement-registration.tsx:24-27`
- Fix: Use null initial choice and disable register until selected

## G2-12-005-023  [P2] GAP  facet F06  effort S
- Legacy: Registration disabled when chosen choice unchanged, no consent, or busy `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:193-195`
- vNext now: Registration button disabled only while busy `src/components/placements/learner-placement-registration.tsx:66-70`
- Fix: Disable unchanged/invalid selection

## G2-12-005-050  [P2] GAP  facet F12  effort S
- Legacy: Registration choice cannot resubmit unchanged value `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:193-195`
- vNext now: Update permitted even for unchanged chosen choice `src/components/placements/learner-placement-registration.tsx:66-70`
- Fix: Guard unchanged updates and audit replay

## G2-12-005-069  [P2] GAP  facet F18  effort S
- Legacy: Heading `Registration · <batchName>` and registered-for sentence `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:175-177`
- vNext now: Heading `Registration`, text `Your choice: <label>` `src/components/placements/learner-placement-registration.tsx:51-75`
- Fix: Restore name and registered-for copy

## G2-12-005-077  [P2] GAP  facet F20  effort S
- Legacy: Deadline printed with dayTime including clock/time zone `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:193-196`
- vNext now: Deadline toLocaleString en-IN Asia/Kolkata date only `src/components/placements/learner-placement-registration.tsx:66-68`
- Fix: Show exact time at deadline to prevent missed registration

## G2-15-023-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy learner /api/v1/learner/registration own card GET/POST. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:11-14,33-53`
- vNext now: vNext learner Placement section + /api/placements/registration JSON POST. `src/components/placements/learner-placement-registration.tsx:31-42`, `src/modules/placements/learner-registration-read-service.ts:12-37`
- Fix: Map old endpoint to current page/read/write routes.

## G2-15-023-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy controller provides data, old screen separate card. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:11-14`
- vNext now: vNext dedicated section with radio choices and inline messages. `src/components/placements/learner-placement-registration.tsx:51-76`
- Fix: Screenshot old card relative to placements page.

## G2-15-023-013  [P2] GAP  facet F06  effort M
- Legacy: Legacy POST request parameters choice, consent(default=false). `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:42-43`
- vNext now: vNext strict JSON choice,acceptedConsent required boolean. `src/modules/placements/batch-registration-service.ts:27-30`, `src/components/placements/learner-placement-registration.tsx:38-42`
- Fix: Support old form-urlencoded clients or migrate all.

## G2-15-023-034  [P2] GAP  facet F13  effort M
- Legacy: Legacy closed window produces conflict 409 with empty body. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:49-50`
- vNext now: vNext inline closed/not-invited reason and no submit. `src/components/placements/learner-placement-registration.tsx:71-73`
- Fix: Keep recoverable next-step copy.
