# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-15-026-061 [P1] GAP facet F21
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:823-842 resume stored external preview URL
- Expected fix: Verify resume object preview integration and secure access lifecycle

## G2-18-022-002 [P1] GAP facet F02
- Files: src/modules/placements/offer-service.ts
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:298-308 top toolbar Record selection, Import, Verify and release, Attach letters
- Expected fix: Build pre-release selection staging and the four top toolbar actions

## G2-18-022-009 [P1] GAP facet F04
- Files: src/modules/placements/offer-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:63-67 letterUrl attach/remove
- Expected fix: Offer letter attach/replace/remove for selected and issued offers with audited receipt

## G2-18-022-022 [P1] MISSING facet F09
- Files: src/modules/placements/offer-service.ts
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:190-195 verify-all Modal confirm title + no undo copy
- Expected fix: Restore confirm dialog with exact release impact and acknowledgement

## G2-18-022-024 [P1] GAP facet F10
- Files: src/modules/placements/offer-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:54-61 POST record-selection persists SELECTED before release
- Expected fix: Separate recordSelection and verifyAndRelease transaction boundaries

## G2-18-022-025 [P1] MISSING facet F10
- Files: src/modules/placements/offer-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:63-68 attach/remove letter URL as standalone POST
- Expected fix: Add letter lifecycle endpoint with audit and pending safe state

## G2-18-022-026 [P1] GAP facet F10
- Files: src/modules/placements/offer-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:70-74 verify release transitions SELECTED→RELEASED and application OFFERED
- Expected fix: Publish normalized status mapping with correct learner offer visibility

## G2-18-022-049 [P1] GAP facet F21
- Files: src/modules/placements/offer-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:119-139 held-offer college rules, dream uplift, blocked release
- Expected fix: Trace dream exemption logic and present exact blocked policy explanation

## G2-18-022-054 [P1] GAP facet F23
- Files: src/modules/placements/offer-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:49-75 recordSelection before release
- Expected fix: Treat missing interim selection as explicit parity blocker rather than renamed status

## G2-8-026-062 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy college_public_link unique college ID + token hash, nonce, enabled/postDirect, opens/joins (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:67-80,109-131).
- Expected fix: Map old HMAC-derived token links to new hashed UUID links; plan token continuity or forced rotation.

## G2-8-024-012 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy suspension reason up to 500 stored in Recruiter, tokenVersion increment (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:286-295).
- Expected fix: Persist reason/auditable explanation and map suspension status semantics.

## G2-8-023-059 [P1] GAP facet F18
- Files: (none, new feature)
- Legacy: Legacy internalReason kept private and student-facing label Not shortlisted (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:23-29; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:41-45).
- Expected fix: Separate private note label from candidate message with clear visibility note.

## G2-8-022-061 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy no global unique current-season restriction, multiple current rows intentional (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:32-41).
- Expected fix: Split lifecycle from selection and relax conflicting uniqueness.

## G2-9-004-045 [P1] GAP facet F10
- Files: src/modules/placements/company-service.ts
- Legacy: GET/POST/PUT/DELETE/restore admin companies, GET jobs and stats (`docs/legacy-source/frontend/src/api/Services/AdminService.js:659-710`)
- Expected fix: Document API contract changes and preserve approved scoped edit/history features.

## G2-9-004-047 [P1] GAP facet F10
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy Create/Edit sends full company fields (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:171-193`)
- Expected fix: Decide and implement safe college-specific editable metadata without modifying cross-college identity.

## G2-9-004-082 [P1] GAP facet F21
- Files: src/modules/placements/company-service.ts
- Legacy: Old REST service owns global company and soft-delete lifecycle (`docs/legacy-source/frontend/src/api/Services/AdminService.js:659-711`)
- Expected fix: Plan explicit migration/ownership of contact, note, industry and logo fields.

## G2-9-007-035 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/electives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:216-218` — Slot load error with Retry slots and specific detail
- Expected fix: Add safe data-load error retry banner

## G2-9-015-009 [P1] MISSING facet F02
- Files: src/app/(authenticated)/college/placements/drives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:765-773` — StudentPlacementLookup panel before drive table, college scoped.
- Expected fix: Restore contextual StudentPlacementLookup before table.

## G2-9-010-010 [P1] GAP facet F03
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1378-1406` — Each row has Details and Move to... status selector, Interview choice opens scheduling form
- Expected fix: Provide Schedule Interview route/modal rather than generic stage transition

## G2-9-010-014 [P1] MISSING facet F04
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1330-1378` — Legacy screening/match score and Partial badge with tooltip
- Expected fix: Add match score and Partial tooltip cell

## G2-9-010-025 [P1] GAP facet F05
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2020` — Ant Table selectedRowKeys and current-page keys persist with reconciliation
- Expected fix: Keep selected IDs across page/filter and reconcile against current eligible rows

## G2-9-010-027 [P1] GAP facet F06
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1385-1425` — Per-row status selector validates transitions and prompts reinstate/Interview workflow
- Expected fix: Restore status-specific prompts and optional reason semantics

## G2-9-010-028 [P1] MISSING facet F06
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1081-1088` — Assessment URL must start http or https, prefilled job URL and option Save to job
- Expected fix: Add assessment URL modal and proper optional job-level persistence

## G2-9-010-029 [P1] GAP facet F06
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2840-2875` — Reject candidate modal optional Reason text area and Cancel or Reject
- Expected fix: Make rejection reason optional with legacy limit, separate dialog label/actions

## G2-9-010-035 [P1] MISSING facet F07
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1081-1088` — Invalid Assessment URL message Must be a valid URL starting with http:// or https://
- Expected fix: Implement Assessment URL field and validation/error copy
