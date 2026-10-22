# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-032-019 [P1] GAP facet F04
- Files: src/components/auth/login-form.tsx
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:195-210: sessionStorage stores attempt ID, choice key, phone, host, expiresAt, cooldown.
- Expected fix: Bind resume attempt to origin/tenant to prevent cross-host confusion.

## G2-1-032-034 [P1] MISSING facet F07
- Files: src/components/auth/login-form.tsx
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:58-59: INVALID_CHOICE tells user accounts list changed.
- Expected fix: Handle stale multi-account selection with reload guidance.

## G2-1-032-040 [P1] MISSING facet F09
- Files: src/components/auth/login-form.tsx
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:599-644: chooser card/list inside login view, no modal.
- Expected fix: Build chooser state inside card.

## G2-1-032-044 [P1] GAP facet F10
- Files: src/components/auth/login-form.tsx
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:194-212: persists one attempt per host plus choice ID key.
- Expected fix: Store and validate expected host on resume.

## G2-1-032-070 [P1] GAP facet F19
- Files: src/components/auth/login-form.tsx
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:195-210: sessionStorage challenge saves host to prevent cross-host reuse.
- Expected fix: Require host + tenant identifier in saved challenge.

## G2-1-006-001 [P1] GAP facet F01
- Files: src/app/api/auth/login/start/route.ts
- Legacy: `PublicMobileAuthController.java:145-196` POST `/start` phone, `:198-234` `/send` chosen phone account, `:655-718` `/verify`.
- Expected fix: Migrate legacy two-step account picker and explicit choice into post-login membership chooser; preserve distinctions for shared phones.

## G2-1-006-011 [P1] GAP facet F04
- Files: src/app/api/auth/login/verify/route.ts
- Legacy: `PublicMobileAuthController.java:765-790` response `Response<{auth,memberships,defaultHost,handoffToken,domain* flags}>`.
- Expected fix: Migrate all consumers of token-pair, domain flags, handoff and memberships to authenticated membership endpoint.

## G2-1-006-048 [P1] GAP facet F16
- Files: src/app/api/auth/login/start/route.ts
- Legacy: `PublicMobileAuthController.java:48-53,145-790` explicitly serves mobile-global-domain account selection.
- Expected fix: Define native mobile contract for cookie transport, cross-host choice and browser callback.

## G2-1-013-006 [P1] MISSING facet F03
- Files: src/components/auth/login-form.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:486-488`: `Use your work email...` plus personal-provider examples.
- Expected fix: Add corporate email guidance to recruiter flow.

## G2-1-013-016 [P1] MISSING facet F07
- Files: src/components/auth/login-form.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:486-489`: COMPANY_EMAIL_REQUIRED has distinct message.
- Expected fix: Display work-email rule with blocked provider names, not generic invalid email.

## G2-1-013-031 [P1] GAP facet F13
- Files: src/components/auth/login-form.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:495-497`: never found recruiter still sees success and expires in300.
- Expected fix: Suppress recruiter existence disclosure including college grant existence.

## G2-1-013-048 [P1] GAP facet F23
- Files: src/components/auth/login-form.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:479-489`: recruiter-only corporate email and tenant-host restriction.
- Expected fix: Force recruiter login to email-only at college placement address, while other roles retain policy.

## G2-1-007-025 [P1] GAP facet F07
- Files: src/modules/people/active-mentor-project-guard.ts
- Legacy: `SuperAdminUserAdminController.java:242-246` mentor project guard detailed 409 including active count.
- Expected fix: Surface exact active project count and reassignment remedy.

## G2-1-007-032 [P1] GAP facet F10
- Files: src/modules/people/membership-service.ts
- Legacy: `SuperAdminUserAdminController.java:249-263` toggles global isDeleted and increments tokenVersion when deleted.
- Expected fix: Ensure admin role disable immediately blocks sign-in and revokes all sessions across permitted scopes.

## G2-1-008-032 [P1] GAP facet F06
- Files: src/app/api/auth/login/verify/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:277-289`: phone and otp required for verification.
- Expected fix: Guide legacy clients to attemptId and second-factor handling.

## G2-1-008-055 [P1] GAP facet F11
- Files: src/modules/people/college-contacts-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:441-447`: staff-only contacts (excludes learner/recruiter), college access check.
- Expected fix: Preserve faculty staff contact lookup through separate authorized view/service.

## G2-1-008-056 [P1] GAP facet F11
- Files: src/modules/people/college-contacts-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:512-516`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:535-539`: requireAccessProgram and requireAccessDepartment.
- Expected fix: Require program/department scope on any replacement API, not just college scope.

## G2-1-008-090 [P1] GAP facet F23
- Files: src/app/api/auth/login/start/route.ts, src/app/api/auth/login/verify/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:180-200`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:484-495`: admin lockout clear and unsafe public password register.
- Expected fix: Restore only protected support unlock if required; never restore public password registration.

## G2-10-027-002 [P1] GAP facet F01
- Files: src/modules/storage/file-lifecycle.ts, src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:421-422 — POST /presign mints R2 URL for any allowed folder.
- Expected fix: Map legacy folder/type to dedicated create-upload grants

## G2-10-027-004 [P1] GAP facet F01
- Files: src/modules/storage/file-access.ts, src/modules/storage/file-lifecycle.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:2180-2185,2236-2241,2290-2291 — Download/Get/Stream by fileName.
- Expected fix: Provide feature-specific read and legacy file reference adapter

## G2-10-027-010 [P1] GAP facet F03
- Files: src/modules/storage/file-policy.ts, src/modules/storage/private-object-storage.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:160-174 — 11 allowed folders: lesson-content, profile-images, video-intros, resumes, assignments, course-images, identity-docs, marksheets, college-branding, offer-letters, jd-files.
- Expected fix: Document folder-to-namespace translation for all 11 folders

## G2-10-027-014 [P1] GAP facet F04
- Files: src/modules/storage/file-policy.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:139-155 — Limits video 5120MB, lecture50MB, ppt100MB, pdf50MB, image10MB, generic50MB.
- Expected fix: Document each type-specific cap and errors

## G2-10-027-015 [P1] GAP facet F04
- Files: src/modules/storage/file-policy.ts, src/app/api/colleges/[collegeId]/branding/logo/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:167-174 — Folder limits branding/profile/course images5MiB, offer letter10MiB, JD/marksheet5MiB.
- Expected fix: Enforce old per-folder cap in each dedicated route

## G2-10-027-027 [P1] GAP facet F07
- Files: src/modules/storage/file-policy.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:493-509 — JD PDFs/Word only; offer letter PDF/PNG/JPG only.
- Expected fix: Enforce JD/offer-specific MIME restrictions

## G2-10-027-042 [P1] GAP facet F10
- Files: src/modules/storage/file-access.ts, src/modules/storage/file-lifecycle.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:2180-2390 — GET download/get/stream + DELETE /file/delete.
- Expected fix: Cover all legacy read modes with scoped grants
