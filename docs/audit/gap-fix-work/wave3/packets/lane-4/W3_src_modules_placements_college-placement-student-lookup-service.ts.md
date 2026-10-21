# Work packet (wave 3): edit src/modules/placements/college-placement-student-lookup-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u002-student-placement-lookup.md

## G2-15-002-014  [P1] MISSING  facet F04  effort L
- Legacy: Details show `Resume`, `Skills`, `Job Preferences` (`StudentPlacementLookup.js:153-159`; `ProfileSectionsPanel.js:35-51,475-505`).
- vNext now: No profile panel or profile fields in lookup data/markup (`college-placement-student-lookup-service.ts:14-25,46-72`; `admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Fetch authorized profileDocument and present all three legacy sections with scoped read/actions.

## G2-15-002-017  [P1] MISSING  facet F04  effort L
- Legacy: Shows next interview scheduled date when present (`StudentPlacementLookup.js:187-200`; `LearnerApplicationWithInterviewsDTO.java:21-28,145-193`).
- vNext now: No interviews query or field (`college-placement-student-lookup-service.ts:46-70`).
- Fix: Join nearest eligible upcoming interview per application; format and render next interview.

## G2-15-002-084  [P1] MISSING  facet F23  effort L
- Legacy: Legacy next-interview, rejectionReason, stage tags, profile CRUD all exist (`StudentPlacementLookup.js:153-159,184-205`; `ProfileSectionsPanel.js:243-471`).
- vNext now: Those functions are entirely absent from route/service (`admin/placements/student-lookup/page.tsx:56-75`; `college-placement-student-lookup-service.ts:46-70`).
- Fix: Restore dropped read/write flows, their validation/toasts and per-role scope; track owner decision if any omission intentional.
