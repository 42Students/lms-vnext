# Work packet (wave 3): edit src/app/(authenticated)/admin/placements/student-lookup/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u002-student-placement-lookup.md

## G2-15-002-014  [P1] MISSING  facet F04  effort L
- Legacy: Details show `Resume`, `Skills`, `Job Preferences` (`StudentPlacementLookup.js:153-159`; `ProfileSectionsPanel.js:35-51,475-505`).
- vNext now: No profile panel or profile fields in lookup data/markup (`college-placement-student-lookup-service.ts:14-25,46-72`; `admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Fetch authorized profileDocument and present all three legacy sections with scoped read/actions.

## G2-15-002-031  [P1] MISSING  facet F06  effort L
- Legacy: `Skills` list fields `Skill`, `Proficiency` with Add/Edit/Remove per item (`profileSectionSchemas.js:110-113`; `ProfileSectionsPanel.js:318-472`).
- vNext now: No skills list or controls (`admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Build editable skills list, index-targeted API mutations and confirmation modal.

## G2-15-002-048  [P1] MISSING  facet F10  effort L
- Legacy: Profile mutations: PUT preferences/resume, POST/PUT/DELETE indexed skill (`ProfileService.js:104-115,144-155`; `LearnerProfileController.java:844-903,1190-1202,1223-1235`).
- vNext now: No POST/PATCH/DELETE from lookup (`admin/placements/student-lookup/page.tsx:32-76`).
- Fix: Add permission-checked, CSRF-checked mutations and audit side effects for selected learner profile sections.

## G2-15-002-052  [P1] MISSING  facet F11  effort L
- Legacy: Profile GET requires learner access, profile writes require write access (`LearnerProfileController.java:1177-1235`).
- vNext now: No lookup profile endpoint/permission paths (`admin/placements/student-lookup/page.tsx:13-76`).
- Fix: Use current per-learner permission checks; never grant cross-college profile writes by display-only role.

## G2-15-002-084  [P1] MISSING  facet F23  effort L
- Legacy: Legacy next-interview, rejectionReason, stage tags, profile CRUD all exist (`StudentPlacementLookup.js:153-159,184-205`; `ProfileSectionsPanel.js:243-471`).
- vNext now: Those functions are entirely absent from route/service (`admin/placements/student-lookup/page.tsx:56-75`; `college-placement-student-lookup-service.ts:46-70`).
- Fix: Restore dropped read/write flows, their validation/toasts and per-role scope; track owner decision if any omission intentional.
