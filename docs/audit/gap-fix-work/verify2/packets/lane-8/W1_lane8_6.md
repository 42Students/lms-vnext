# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-032-090 [P1] GAP facet F20
- Files: src/modules/academics/schedule-service.ts
- Legacy: ClassScheduleController.java:102-118 date parsing bounds at 00:00:00 and 23:59:59.
- Expected fix: Test IST midnight/DST-independent instants, include last-second milliseconds.

## G2-2-032-097 [P1] GAP facet F22
- Files: src/modules/academics/schedule-service.ts
- Legacy: ClassScheduleDTO.java:11-31 legacy int classId/facultyId/courseId/hallId, times as strings.
- Expected fix: Migrate schedule IDs, staff mappings, course deliveries, lecture hall references and instants.

## G2-19-022-108 [P1] GAP facet F13
- Files: src/app/(authenticated)/tpo/home/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/tpo/home.js:69-84 first-load error Retry, last successful snapshot on refresh failure
- Expected fix: Keep partial failure explicit; never show fallback 0 as verified, use null/unknown on unavailable inputs

## G2-2-001-044 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LS:142-150 duplicate status with external finding id; allows existing non-self
- Expected fix: Resolve duplicate by external ID and match legacy target rules, or document strengthened constraints.

## G2-20-001-002 [P1] GAP facet F01
- Files: src/app/not-found.tsx, src/app/(authenticated)/admin/not-found.tsx, src/app/(authenticated)/learn/not-found.tsx
- Legacy: Authenticated home href from `homePathForRole(role)` with Super Admin `/superadmin/dashboard`, Admin `/college-admin/dashboard`, Learner `/learn/courses`; `docs/legacy-source/frontend/src/pages/404.js:73-82`, `docs/legacy-source/frontend/src/config/roles.js:24-32,77`
- Expected fix: For every authenticated not-found boundary resolve current membership's actual home route (role landing, not generic portal root); cover direct and nested unknown URLs.

## G2-20-001-020 [P1] GAP facet F10
- Files: src/app/not-found.tsx, src/components/public/graceful-screen.tsx
- Legacy: Home click performs client-side `next/link` route change to derived role home; `docs/legacy-source/frontend/src/pages/404.js:41-43,73-76`
- Expected fix: Derive home destination from server membership in authenticated shell, or use centralized role-aware home redirect.

## G2-20-001-022 [P1] GAP facet F11
- Files: src/app/not-found.tsx, src/app/(authenticated)/admin/not-found.tsx, src/app/(authenticated)/learn/not-found.tsx
- Legacy: Logged-in users get role shell; explicit Super Admin/Admin selection plus shared Layout for others; `docs/legacy-source/frontend/src/pages/404.js:73-82`
- Expected fix: Verify which unmatched authenticated deep links resolve to nested boundaries and ensure correct shell/permissions in all namespaces.

## G2-20-006-001 [P1] GAP facet F01
- Files: src/app/page.tsx
- Legacy: Root `/` is dedicated sign-in page, opts out of dashboard layout; `docs/legacy-source/frontend/src/pages/index.js:11-32,66-73`
- Expected fix: Document new root marketing policy as intentional or restore / login entry on all hosts; test direct / for anonymous platform.

## G2-20-006-002 [P1] GAP facet F01
- Files: src/app/page.tsx, src/modules/auth/request-tenant.ts
- Legacy: Legacy root uses hostname matching `emedha.jntukelearn.in` and `dgi.42lms.com` to choose JNTU/DGIPUC variants; `docs/legacy-source/frontend/src/pages/index.js:15-23,54-62`
- Expected fix: Map named college hosts to approved dedicated sign-in page treatments/flow or explicitly retire special handling; retain verified host security.

## G2-20-006-007 [P1] GAP facet F02
- Files: src/app/page.tsx
- Legacy: DGIPUC login uses switch centered above form, custom background, right-side card; `docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:65-91`
- Expected fix: Recreate branded DGIPUC right-hand card and Student/Teacher selection or document discontinued credential mechanism.

## G2-20-006-039 [P1] GAP facet F10
- Files: src/app/page.tsx, src/components/auth/login-form.tsx
- Legacy: Legacy redirects signed-in user to role-specific home via stored identity and postLoginPath; `docs/legacy-source/frontend/src/loginPages/Login.js:140-166,307-325`
- Expected fix: Ensure dashboard server router resolves seven roles equivalently; test each role including TPO guests and recruiter.

## G2-20-006-041 [P1] GAP facet F10
- Files: src/app/page.tsx
- Legacy: Legacy tenant bootstrap from getTenantBootstrap client, page continues rendering even if bootstrap fails; `docs/legacy-source/frontend/src/loginPages/Login.js:96-98,283-302`
- Expected fix: Ensure transient college lookup errors do not strand valid user; provide retry/main sign-in and preserve token without false unknown.

## G2-20-006-070 [P1] MISSING facet F23
- Files: src/app/page.tsx
- Legacy: DGIPUC Student roll-number/PIN and JNTU dedicated login variants; `docs/legacy-source/frontend/src/pages/index.js:18-23,54-62`, `docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:75-160`, `docs/legacy-source/frontend/src/loginPages/JntuLogin.js:68-155`
- Expected fix: Owner decide explicit removal; if still active tenants, prioritize regaining access before cosmetic clone.

## G2-20-007-004 [OK — canonical metadata and index/follow present] MISSING facet F01
- Files: src/app/privacy-policy/page.tsx
- Legacy: Root head canonical=https://42lms.com/privacy-policy; index/follow; `docs/legacy-source/frontend/src/pages/privacy-policy.js:29-34`
- Expected fix: Add canonical pointing to primary branded URL and robots index/follow to served static or React page; avoid redirect SEO dilution.

## G2-20-017-044 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy retro/attendee/action/reminder/calendar fields persisted `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:53-157`
- Expected fix: Record intentional removals and map retained fields to explicit normalized representation

## G2-20-031-058 [OK — static privacy policy served at canonical route] GAP facet F11
- Files: src/app/privacy-policy/page.tsx
- Legacy: Legacy privacy page directly at canonical /privacy-policy (`docs/legacy-source/frontend/src/pages/privacy-policy.js:29-34`)
- Expected fix: Serve policy with canonical and indexability at stable route for mobile/store users

## G2-20-029-045 [P1] GAP facet F10
- Files: src/app/api/academics/programs/[programId]/route.ts, src/modules/academics/college-program-mutation-service.ts
- Legacy: Edit PUT new-program/update/{id}; hard delete DELETE new-program/delete/{id} (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:145-177`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:185-212`)
- Expected fix: Decide hard-delete versus archive parity and document data retention effect explicitly

## G2-20-029-050 [P1] GAP facet F12
- Files: src/modules/academics/college-program-mutation-service.ts
- Legacy: Legacy shrink years blocked if batch current semester or configured semester exceeds new max (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:113-139`)
- Expected fix: Ensure legacy current-semester and configured-semester blockers map fully

## G2-20-029-051 [P1] GAP facet F12
- Files: src/modules/academics/college-program-mutation-service.ts
- Legacy: Legacy delete blocks structure, batches, semesters, and enrolled learners (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:149-178`)
- Expected fix: Verify deleted versus archived descendants, learners and race-safe archive guards

## G2-3-020-024 [P1] GAP facet F10
- Files: src/app/api/academics/faculty-assignments/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:53-99`
- Expected fix: Legacy createBulk, deactivate and read-active-by-course routes all present under one controller; new section assignment route GET/POST only while teaching assignment routes separate. Ensure every legacy workflow has an accessible API path.

## G2-11-016-076 [P1] GAP facet F22
- Files: src/app/(authenticated)/tpo/team/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:41-54`
- Expected fix: Legacy numeric facultyId/team thread IDs and typed entity context; vNext UUID team member threads with idempotency and restricted scope, crosswalk required.

## G2-14-026-015 [P1] GAP facet F06
- Files: src/modules/academics/college-program-mutation-model.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ProgramDTO.java:16-25`
- Expected fix: Legacy durationYears optional/default0, vNext integer durationTerms min1 max24 and code regex; existing zero-duration data rejected.

## G2-18-027-054 [P1] MISSING facet F23
- Files: src/app/api/departments/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:95-124`
- Expected fix: Global/organization-scoped fetchAll contracts are omitted from current scoped API, need compatibility only if consumers need global inventory.

## G2-4-005-012 [P1] GAP facet F05
- Files: src/app/(authenticated)/college/faculty-assignment/page.tsx
- Legacy: Eight columns Faculty Course Class Semester Year Role Active Actions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-380`)
- Expected fix: Restore eight columns and order.

## G2-4-005-062 [P1] GAP facet F23
- Files: src/modules/academics/college-mapping-model.ts
- Legacy: Legacy displays inactive rows by default. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:135-158;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:368-369`)
- Expected fix: Show ALL default or clear historical count.
