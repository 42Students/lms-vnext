# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-016-045 [P1] GAP facet F21
- Files: src/modules/skills/catalog-readiness.ts
- Legacy: Legacy @Order(2) CommandLineRunner synonym seed `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/SynonymDataLoader.java:13-20`
- Expected fix: Complete DB10 registration and seed lifecycle.

## G2-5-022-024 [P1] GAP facet F09
- Files: src/modules/placements/tpo-debar-model.ts
- Legacy: Legacy debar form via StudentActions/StudentPanel  `docs/legacy-source/frontend/src/components/tpo/students/StudentActions.jsx:1-100`
- Expected fix: Expose timed/drive-count debar separately; avoid misleading generic button.

## G2-5-025-037 [P1] GAP facet F10
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: Legacy staffing computes missing teaching assignments per program class even without active deliveries. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:484-539`
- Expected fix: Offer canonical program-class staffing parity report separate from delivery warnings.

## G2-5-025-061 [P1] GAP facet F21
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: Legacy staffing depends on ClassRepository and FacultyTeachingAssignmentRepository. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:484-539`
- Expected fix: Trace both data sources and assess historical/nonoffered classes.

## G2-5-025-065 [P1] GAP facet F23
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: Legacy standalone staffing gap report per class and course. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:484-539`
- Expected fix: Retain source-equivalent report and useful active-delivery warning.

## G2-5-027-047 [P1] GAP facet F10
- Files: src/app/(authenticated)/college/students/page.tsx, src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy update/delete Learner entity + audit LEARNER_UPDATE/TRANSFER/DELETE. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:1065-1143`
- Expected fix: Document and test partial profile lifecycle vs old delete side effects.

## G2-5-028-015 [P1] GAP facet F04
- Files: src/modules/projects/admin-projects-query-model.ts, src/components/projects/project-admin-workspace-list.tsx
- Legacy: Legacy status stored as arbitrary uppercase status and displayed as readable words. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:34-46`
- Expected fix: Translate legacy IN_PROGRESS/NOT_STARTED/BLOCKED/DONE to vNext states and preserve blockers.

## G2-6-020-002 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: Legacy GET /fetchAll permitted global SA all orgs, scoped SA org or college (DepartmentController.java:95-125).
- Expected fix: Add super-admin cross-college/organization department reader with authenticated scope if global list is required.

## G2-6-027-015 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Apply accepts optional request body resumeUrl with regex https? and deprecated query-string resumeUrl fallback (ApplyToJobRequest.java:8-16; JobController.java:398-405,439-441).
- Expected fix: Provide secure resume/object reference submission or explicitly preserve profile-resume policy and consent.

## G2-11-014-017 [P1] GAP facet F04
- Files: src/modules/placements/tpo-home-legacy-rows.ts
- Legacy: Legacy drives status N live and first eligible action from needsYou, request count may appear; attention across multiple urgency types (homeRows.js:74-84,92-96).
- Expected fix: Compare all legacy DRIVE_REQUESTS/RESULTS_READY/SELECTIONS_TO_VERIFY/DEADLINE_TODAY/SHARE_APPLICANTS urgency and row attention.

## G2-11-014-022 [P1] GAP facet F05
- Files: src/modules/placements/tpo-home-legacy-rows.ts
- Legacy: Legacy Needs you row attention derived from actual needsYou array per row (homeRows.js:82-84,92-105).
- Expected fix: Avoid false No requests waiting or no action when request counter read failed; keep unavailable status distinct.

## G2-11-014-040 [P1] GAP facet F12
- Files: src/modules/placements/tpo-home-legacy-rows.ts
- Legacy: Legacy No requests or messages waiting shown only after known Home GET (homeRows.js:100-102).
- Expected fix: Pass pendingRequests null through row builder and show unavailable when no verified count.

## G2-11-017-001 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: Phone footer More destination; Redux active key more (more.js:48-55).
- Expected fix: Make More reach /tpo/more and maintain correct active highlight.

## G2-11-023-008 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: RequestDetails displays choice, company+CTC LPA, corrected field, safe proof/offer URL or 'not a web link' (RequestsPanel.js:33-55).
- Expected fix: Render typed payload fields and safe URL links with invalid URL fallback.

## G2-11-026-041 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Reporter selected from active BugTrackerAccess existing row (BugTrackerService.java:43-50).
- Expected fix: Document reporter identity and dedup model; avoid duplicated access row per report if reporter tracking requires it.

## G2-13-022-021 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Approved REGISTRATION_CHANGE applies valid choice via studentsRead.register (TpoRequestService.java:141-147).
- Expected fix: Allow standalone registration requests and persist choice changes.

## G2-6-025-008 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Resource request requires folder=lesson-content and type=resource (ResourceUploadController.java:71-73).
- Expected fix: Introduce distinct typed Resource namespace before issuing grants.

## G2-6-030-038 [P1] GAP facet F09
- Files: (none, new feature)
- Legacy: Legacy cancel edit dirty prompts discard confirmation (LectureHalls.js:173-186).
- Expected fix: Add nested confirm flow and preserve edit state if declined.

## G2-6-004-012 [P1] GAP facet F04
- Files: src/components/courses/faculty-contacts-table.tsx
- Legacy: Old All table columns Name, Email, Contact, Role `docs/legacy-source/frontend/src/components/contacts/contactColumns.js:3-27`
- Expected fix: Restore Email/Contact columns only where privacy policy permits; otherwise mark approved deviation

## G2-6-024-049 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: Legacy edits original alert body and accepts other callback types for no-edit answer (TelegramWebhookController.java:58-63).
- Expected fix: Restore durable visible original-message acknowledgment and answer unknown-but-authentic callbacks.

## G2-6-011-009 [P1] MISSING facet F05
- Files: src/components/tpo/tpo-job-types-editor.tsx
- Legacy: Old `visible()` excludes hidden from new drive choice `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:70-73`
- Expected fix: Use active-only typed options in every drive type selector

## G2-6-011-010 [P1] MISSING facet F05
- Files: src/components/tpo/tpo-job-types-editor.tsx
- Legacy: Old `normalize` retains current hidden/older type on existing drive `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:89-105`
- Expected fix: Permit grandfathered type on edit while forbidding selecting inactive for new drives

## G2-6-011-039 [P1] MISSING facet F18
- Files: src/components/tpo/tpo-job-types-editor.tsx
- Legacy: Old invalid type on drive `Job type must be one of ...` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:93-105`
- Expected fix: Connect drive validation error to same active type catalogue

## G2-6-011-044 [P1] MISSING facet F21
- Files: src/components/tpo/tpo-job-types-editor.tsx
- Legacy: Old drive form/filters/reports consume central `/api/v1/choices` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:12-16`
- Expected fix: Wire type lookup in all job read/write/report paths

## G2-6-011-048 [P1] GAP facet F23
- Files: src/components/tpo/tpo-job-types-editor.tsx
- Legacy: Old custom hidden type retained for older drives, new selectors exclude `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:89-105`
- Expected fix: Preserve historical drive type value and prevent new selection

## Fast verification disposition (22 Oct 2026)

Only the rows backed by directly inspected implementation are OK. All other rows remain DEFERRED for deeper service, schema, migration, or route checks, and are not claimed fixed.

- G2-5-016-045: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-5-022-024: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-5-025-037: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-5-025-061: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-5-025-065: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-5-027-047: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-5-028-015: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-6-020-002: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-6-027-015: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-11-014-017: OK — urgent driveNeeds ordered into drive status and action destination
- G2-11-014-022: OK — null pendingRequests not represented as zero in status
- G2-11-014-040: OK — empty inbox text only when both request and message counts verified zero
- G2-11-017-001: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-11-023-008: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-11-026-041: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-13-022-021: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-6-025-008: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-6-030-038: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-6-004-012: OK — Email and Contact columns remain with privacy-preserving Private values
- G2-6-024-049: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-6-011-009: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-6-011-010: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-6-011-039: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-6-011-044: DEFERRED — requires complete implementation and consumer/legacy cross-check
- G2-6-011-048: DEFERRED — requires complete implementation and consumer/legacy cross-check
