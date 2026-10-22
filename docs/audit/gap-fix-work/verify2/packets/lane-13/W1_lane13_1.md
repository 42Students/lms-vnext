# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-001-006 [P1] GAP facet F04
- Files: src/app/api/people/[membershipId]/lifecycle/route.ts, src/app/api/college/faculty/[membershipId]/lifecycle/route.ts, src/modules/people/college-faculty-lifecycle-service.ts
- Legacy: `AdminUserLifecycleController.java:97-102,129-134` returns `{user: Learner\|Faculty}` including `suspendedAt` and `suspensionReason` (`Learner.java:21-28`; `Faculty.java:25-32`).
- Expected fix: Standardize response for all lifecycle callers and ensure status, reason and timestamp are available to refresh the affected row.

## G2-1-001-015 [P1] GAP facet F07
- Files: src/modules/people/active-mentor-project-guard.ts, src/modules/people/college-faculty-lifecycle-service.ts, src/components/college/college-faculty-lifecycle-action.tsx
- Legacy: `AdminUserLifecycleController.java:122-125` returns 409 with full sentence in both `error` and `message` when active mentor projects remain.
- Expected fix: Surface exact active-mentor count and legacy action guidance to faculty admin UI; return structured code and human message.

## G2-1-001-022 [P1] GAP facet F10
- Files: src/modules/people/college-faculty-lifecycle-service.ts
- Legacy: `AdminUserLifecycleController.java:83-102,129-134,137-167` updates learner/faculty account rows with `LocalDateTime`, then audits and responds.
- Expected fix: Retain explicitly scoped membership semantics, but verify all access checks/auth refresh that formerly relied on account-wide suspendedAt.

## G2-1-001-030 [P1] GAP facet F12
- Files: src/modules/people/active-mentor-project-guard.ts
- Legacy: `AdminUserLifecycleController.java:113-127` checks faculty projects with `findProjectIdsForUser` and non-ARCHIVED active workspaces.
- Expected fix: Verify legacy active-project inclusion and role variants against workspace states; align guard where 'active' means not ARCHIVED.

## G2-1-001-041 [P1] GAP facet F19
- Files: src/modules/people/college-faculty-lifecycle-service.ts
- Legacy: `AdminUserLifecycleController.java:188-199`, `UserSessionServiceImpl.java:68-70` loads all sessions then revokes one-by-one; per-session exceptions ignored.
- Expected fix: Use set-based revocation in both paths; cover large device lists and fail-closed response.

## G2-1-002-021 [P1] GAP facet F06
- Files: src/app/api/auth/memberships/route.ts
- Legacy: `SwitchOrgRequest.java:7-14` requires non-blank `targetKey` legacy college uniqueId/known key.
- Expected fix: Migrate membership chooser payload shape and handling of legacy targetKey bookmarks; show validation on wrong/missing key.

## G2-1-002-037 [P1] GAP facet F10
- Files: src/app/auth/handoff/page.tsx, src/app/api/auth/memberships/route.ts
- Legacy: `AuthController.java:318-355` switch persists a raw access+refresh pair in `auth_handoff_token`, expiry 2 minutes; sets cookies and yields handoffToken.
- Expected fix: Choose safe target-host fresh OTP reauthentication and eliminate raw JWT handoff; explicitly track prior target and redirect.

## G2-1-002-060 [P1] GAP facet F16
- Files: src/app/auth/handoff/page.tsx, src/app/api/auth/memberships/route.ts
- Legacy: `AuthController.java:220-355` cross-parent-domain handoff supports domain changes from desktop/mobile browser.
- Expected fix: Test phone/tablet target-host re-login and return path for session transfer parity; preserve privacy/avoid URL token.

## G2-1-002-075 [P1] GAP facet F23
- Files: src/app/auth/handoff/page.tsx, src/app/api/auth/memberships/route.ts
- Legacy: `AuthController.java:220-356` has cross-host handoff UX and deep-link tokens; `:417-492` supports native switch-token.
- Expected fix: Product decision: if legacy mobile/cross-domain clients remain supported, supply safe alternate flows before rollout; else document intentional retirement.

## G2-1-024-001 [P1] GAP facet F01
- Files: src/app/auth/handoff/page.tsx
- Legacy: docs/legacy-source/frontend/src/utils/switchMembership.js:20-30: cross-host membership switch navigates to targetHost/auth/handoff?token=...&next=... .
- Expected fix: Supply secure verified cross-host switch journey or formal full re-login transition with safe returnTo.

## G2-1-024-026 [P1] GAP facet F10
- Files: src/app/auth/handoff/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:107-108: unauthenticated Api.post /api/v1/auth/handoff/consume with {token}, skipAuth true.
- Expected fix: If cross-host must work, implement short-lived HMAC code exchange with replay exclusion and verified tenant domain.

## G2-1-026-074 [P1] GAP facet F22
- Files: src/modules/people/college-admin-profile-edit-service.ts
- Legacy: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:95-130: gender,dob,bloodGroup; CT:130-228 contact mobile/phone/mail.
- Expected fix: Create full column-to-key crosswalk and recover user data if migration planned.

## G2-1-026-075 [P1] GAP facet F22
- Files: src/modules/people/college-admin-profile-edit-service.ts
- Legacy: docs/legacy-source/frontend/src/components/profile/about/address.js:58-117: two addresses and city/state/pincode.
- Expected fix: Expand schema to support current/permanent; never silently merge.

## G2-1-036-001 [P1] GAP facet F01
- Files: src/components/auth/login-form.tsx
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:658-907: public login first role selection and OTP, optional membership chooser after verification.
- Expected fix: Retain multi-account role/college chooser where needed by legacy identities.

## G2-1-036-019 [P1] GAP facet F06
- Files: src/components/auth/login-form.tsx
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:195-210: sessionStorage attempt ID, choice, host and 5min expiry.
- Expected fix: Persist host binding for resuming challenge; still enforce on server.

## G2-1-036-066 [P1] GAP facet F20
- Files: src/components/auth/login-form.tsx
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:195-210: attempt stored per host, 5min TTL.
- Expected fix: Prevent cross-host client restoration.

## G2-1-003-002 [P1] GAP facet F01
- Files: src/app/api/people/[membershipId]/faculty-profile/route.ts, src/app/(authenticated)/teacher/profile/details/page.tsx
- Legacy: `ProfileSectionsPanel.js:481-493`, `Faculty.js:1-7` admin opens profile section editor from faculty roster using faculty ID.
- Expected fix: Provide college-admin authorized full faculty profile read/edit for supported sections or document explicit product restriction with owner approval.

## G2-1-003-005 [P1] GAP facet F02
- Files: src/components/people/faculty-profile-editor.tsx, src/app/(authenticated)/teacher/profile/page.tsx
- Legacy: `ProfileSectionsPanel.js:54-69` includes Header, Identity Documents and Contact sections.
- Expected fix: Provide secure read and managed-admin update for those sections with privacy controls and explicit edit restrictions.

## G2-1-003-035 [P1] GAP facet F07
- Files: src/modules/people/faculty-profile-document.ts
- Legacy: `FacultyProfileServiceImpl.java:259-300` contact errors primary mobile 10 digits, alternate 10–15, not same, primary required if alternate, email valid.
- Expected fix: Add cross-field contact validators on all authorized contact edit routes and migrate invalid combinations.

## G2-1-003-044 [P1] GAP facet F10
- Files: src/modules/people/faculty-profile-self.staged.ts, drizzle/0067_faculty_profile_document.sql
- Legacy: `FacultyProfileServiceImpl.java:90-615` updates columns/lists embedded in `Faculty` JPA row with facultyRepository.save after operations.
- Expected fix: Plan/execute migration from each legacy Faculty column and serial list into stable vNext JSONB paths; verify round-trip fidelity.

## G2-1-003-048 [P1] GAP facet F11
- Files: src/app/(authenticated)/teacher/profile/details/page.tsx, src/app/api/people/[membershipId]/faculty-profile/route.ts
- Legacy: `FacultyProfileController.java:55-89` admin can access same-college faculty; non-admin faculty self-only; learner denied; superadmin allowed.
- Expected fix: Provide full authorized staff profile access for admin/superadmin respecting college scope and no learner access.

## G2-1-003-049 [P1] GAP facet F11
- Files: src/modules/people/faculty-self-section-model.ts, src/app/api/people/[membershipId]/faculty-profile/route.ts
- Legacy: `FacultyProfileController.java:91-106` college admin can read another ADMIN/TPO profile but cannot write; superadmin allowed.
- Expected fix: Reimplement protected-role read/write distinction in full profile admin editor and API.

## G2-1-003-058 [P1] GAP facet F14
- Files: src/modules/people/faculty-profile-document.ts, src/components/people/faculty-profile-editor.tsx
- Legacy: `FacultyProfileController.java:141-155,204-215,289-302` accepts image/identity storage refs, not binary multipart; UI fields `profileSectionSchemas.js:14-35`.
- Expected fix: Add secure upload/download/preview for profile image and identity documents with ownership constraints and receipt binding.

## G2-1-003-082 [P1] GAP facet F23
- Files: src/modules/people/faculty-profile-document.ts, src/modules/people/faculty-profile-self.staged.ts
- Legacy: `FacultyProfileServiceImpl.java:207-592` repeatable lists have no max; vNext capped sections, migrated legacy over-limit lists may fail entire document.
- Expected fix: Implement pre-migration exception report and no-truncation remediation for over-limit records.

## G2-1-011-015 [P1] GAP facet F06
- Files: src/modules/people/profile-validation.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:955-971`: only non-null properties overwritten, Strings trimmed.
- Expected fix: Avoid accidental clearing of omitted fields when migrating partial updates.
