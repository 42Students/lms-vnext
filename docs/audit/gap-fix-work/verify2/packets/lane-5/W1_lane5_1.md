# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-002-005 [P1] GAP facet F01
- Files: src/app/api/auth/session/route.ts, src/auth/session.ts
- Legacy: `AuthController.java:643-653,798-804` `refresh-cookie` and `refresh` endpoints; `:658-681,1024-1084` logout endpoints.
- Expected fix: Remove stale refresh-client calls; ensure transparent account-expiry/re-login path replaces refresh and client retry logic.

## G2-12-013-010 [P1] GAP facet F05
- Files: src/app/(authenticated)/notifications/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:93-105: one of classId or courseId, default global superadmin allowed.
- Expected fix: Add scoped class/course filter if legacy workflow still needed.

## G2-14-024-021 [P1] GAP facet F09
- Files: src/components/admin/college-feature-rule-editor.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:225-253 — placements impact read-only preview separate endpoint
- Expected fix: Confirm stage/offer/interview impact counts appear before final disable action.

## G2-14-024-045 [P1] GAP facet F23
- Files: src/components/admin/college-feature-rule-editor.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:231-253 — placements preview counts distinct categories, can overlap
- Expected fix: Retain distinct jobs/applications/offers/interviews as separate metrics; do not conflate with learner population.

## G2-1-009-031 [P1] GAP facet F10
- Files: src/modules/people/learner-profile-data-access-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:44-55`: dataAccessLog joins share links/jobs/applications/events; no mutation.
- Expected fix: Read actual share links and download events; do not substitute activity log.

## G2-1-009-034 [P1] GAP facet F11
- Files: src/modules/people/learner-profile-data-access-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:44-55`: share visibility keyed learner_id of applied jobs; not scoped by college in SELECT.
- Expected fix: Scope third-party share disclosure to all legitimately relevant past participation without tenant leakage.

## G2-1-034-057 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: src/modules/placements/public-recruiter-invite-accept-service.ts:26: direct JOINED path rather than PENDING_HR.
- Expected fix: Restore deliberate consent and existing-recruiter flow.

## G2-1-007-018 [P1] GAP facet F06
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: `SuperAdminUserAdminController.java:401-420` role default ADMIN; only ADMIN or TPO permitted.
- Expected fix: Offer limited ADMIN/TPO role picker in managed-admin create and enforce server restriction.

## G2-19-030-016 [P1] MISSING facet F04
- Files: src/modules/placements/tpo-self-profile-service.ts
- Legacy: docs/legacy-source/frontend/src/components/profile/userInfo.js:99-105 — portrait image userDetails.website, fallback initials/name, 120px square.
- Expected fix: Add scoped profileImage read and avatar fallback.

## G2-19-030-026 [P1] MISSING facet F07
- Files: src/modules/placements/tpo-self-profile-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyProfileServiceImpl.java:118-125 — image URL must use HTTPS/approved storage key; custom validation messages.
- Expected fix: Add image authorization, HTTPS validation, upload attestations.

## G2-19-030-036 [P1] GAP facet F11
- Files: src/modules/placements/tpo-self-profile-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyProfileController.java:204-215 — requireAccessFacultyProfile(facultyId), validates image ownership.
- Expected fix: Apply same self actor + image ownership to future write.

## G2-19-030-060 [P1] GAP facet F22
- Files: src/modules/placements/tpo-self-profile-service.ts
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:46-56 — legacy faculty record firstName,lastName,department,contactMobile,contactMail,website.
- Expected fix: Add a safe profile view model mapping legacy identity/contact/photo fields.

## G2-10-004-034 [P1] GAP facet F07
- Files: src/components/admin/super-admin-college-company-actions.tsx
- Legacy: Old logo and website require HTTPS with Must be a valid URL and HTTPS-specific messages `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:483-490`
- Expected fix: Require HTTPS and restore logo field validation in college modal

## G2-10-007-010 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/features/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:309-313` three scope-wide metric numbers
- Expected fix: Compute scoped total metrics or label denominator precisely

## G2-10-007-029 [P1] GAP facet F06
- Files: src/components/admin/college-feature-rule-editor.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:263-275` binary immediate enable/disable switch
- Expected fix: Create simple toggle mode and separate advanced rule editor

## G2-10-007-050 [P1] GAP facet F10
- Files: src/components/admin/college-feature-rule-editor.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:126-134` refetch effective state before successful toast
- Expected fix: Await effective resolver read before final success indication

## G2-10-016-040 [P1] MISSING facet F09
- Files: src/app/(authenticated)/admin/placements/drives/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-475 — Delete modal confirms job name and details impact; keeps modal for retry.
- Expected fix: Add row preview and confirm with retry, respecting new archive safety.

## G2-10-015-080 [P1] MISSING facet F21
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:58-63,112-128 — Shared JobApplications shortlistMode true controls admin filter/bulk branches.
- Expected fix: Add shortlist view model distinct from full pipeline.

## G2-10-018-025 [P1] GAP facet F06
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:150-186 — Edit prefill via editForm and original snapshot; Cancel with dirty-check confirm.
- Expected fix: Implement unsaved edit confirmation.

## G2-10-018-027 [P1] GAP facet F06
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:216-228 — Delete directly sends DELETE after Popconfirm; success removes record.
- Expected fix: Document lifecycle change and clone controls without losing safety.

## G2-10-018-031 [P1] GAP facet F07
- Files: src/components/admin/lecture-hall-manager.tsx, src/modules/academics/lecture-hall-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:352-367 — Room Type required 'Select a room type'; capacity min1 max1000 default50.
- Expected fix: Match legacy required select and 1000 cap or formally change constraint.

## G2-10-018-041 [P1] MISSING facet F09
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:173-186 — Unsaved edit confirmation on cancel, snapshot tracking.
- Expected fix: Add dirty edit ConfirmDialog.

## G2-10-018-079 [P1] GAP facet F20
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:150-186 — Edit original snapshot drives unsaved navigation guard.
- Expected fix: Add dirty comparison.

## G2-10-018-089 [P1] MISSING facet F23
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:163-186 — Unsaved edit Cancel requires confirmation.
- Expected fix: Restore unsaved confirmation.

## G2-10-019-064 [P1] GAP facet F12
- Files: src/components/admin/college-feature-rule-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:30-37 — Broad changes trigger confirmation for college/dept/program or >=100 students.
- Expected fix: Enforce threshold/impact dialogue at each broad academic scope.
