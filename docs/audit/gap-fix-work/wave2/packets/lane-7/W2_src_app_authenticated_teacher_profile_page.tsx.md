# Work packet (wave 2): edit src/app/(authenticated)/teacher/profile/page.tsx

35 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md, docs/audit/gap2/lane-4/faculty-model.md

## G2-1-003-001  [P2] GAP  facet F01  effort M
- Legacy: `FacultyProfileController.java:24-28` declares `/api/v1/profile/faculty/{facultyId}/*` for any authorized faculty/admin.
- vNext now: `src/app/(authenticated)/teacher/profile/page.tsx:8-22` and `details/page.tsx:11-24` split read-only overview and self editor; `src/app/api/people/faculty-self-document/route.ts:10-27` uses selected membership.
- Fix: Route legacy profile links to new self and scoped college-admin destinations; retain exact profile entry points.

## G2-1-003-003  [P2] GAP  facet F01  effort M
- Legacy: `FacultyProfileController.java:191-215` header endpoint can be used directly as first section.
- vNext now: `teacher/profile/page.tsx:11-17` title/employment fields in header-like overview, editor `faculty-profile-navigation.ts:3-16` has no 'Header'.
- Fix: Restore header section navigation or map identity/profile image to managed faculty detail with explicit link.

## G2-1-003-011  [P2] GAP  facet F04  effort M
- Legacy: `ProfileHeaderDTO.java:10-19` exposes firstName, lastName, employee uniqueId, department/deptId, facultyType and profileImage.
- vNext now: `teacher/profile/page.tsx:11-17` shows displayName, email/mobile, academicTitle/employmentType; `faculty-profile-document.ts:302` has private image receipt.
- Fix: Map employee ID, dept and faculty type into displayed header and secure profile image preview.

## G2-1-003-014  [P2] GAP  facet F04  effort M
- Legacy: `ContactDTO.java:20-27` includes contactMobile, alternate contactPhone, contactMail.
- vNext now: `faculty-profile-document.ts:46-73` models identical three but editor does not expose; `teacher/profile/page.tsx:13-14` shows canonical email, phone.
- Fix: Expose appropriate contact data/self-edit pathway with identity protection and exact role distinctions.

## G2-1-003-068  [P2] GAP  facet F18  effort M
- Legacy: `profileSectionSchemas.js:41-44` uses 'Mobile Number', 'Alternate Phone', 'Email'.
- vNext now: `faculty-profile-editor.tsx:24-33` has no contact section, `teacher/profile/page.tsx:13-14` displays Email/Mobile read-only.
- Fix: Add contact section and match labels for authorized editor, without exposing private identity unnecessarily.

## G2-20-030-002  [P2] GAP  facet F01  effort S
- Legacy: Learner visiting teacher profile redirects to /learn/profile (`docs/legacy-source/frontend/src/pages/teacher/profile.js:39-44`)
- vNext now: Teacher route asks for own faculty profile; no local redirect to learner route (`src/app/(authenticated)/teacher/profile/page.tsx:8-10`)
- Fix: Redirect learner role to equivalent /learn/profile before fetching faculty

## G2-20-030-003  [P2] GAP  facet F01  effort S
- Legacy: Faculty ADMIN visiting teacher profile redirects /college-admin/profile (`docs/legacy-source/frontend/src/pages/teacher/profile.js:44-45`)
- vNext now: Teacher route has no explicit faculty-admin redirect (`src/app/(authenticated)/teacher/profile/page.tsx:8-10`)
- Fix: Reinstate role-correct admin profile redirect

## G2-20-030-005  [P2] GAP  facet F01  effort M
- Legacy: Deep link ?section=connect-accounts scrolls Social Profiles; other section values scroll Contacts (`docs/legacy-source/frontend/src/pages/teacher/profile.js:96-110`)
- vNext now: Profile route has no query-based section targeting; separate details and contacts routes (`src/app/(authenticated)/teacher/profile/page.tsx:8-50`, `src/app/(authenticated)/teacher/profile/details/page.tsx:16-24`)
- Fix: Honor section query and anchor IDs or redirect deep links correctly

## G2-20-030-022  [P2] GAP  facet F03  effort M
- Legacy: UserInfo displays first and last names (fallback -), description, optional DOB and up to 2 departments with etc. (`docs/legacy-source/frontend/src/components/profile/userInfo.js:119-145`)
- vNext now: Displays displayName, Email, Mobile, Academic title, Employment type; no DOB/department summary (`src/app/(authenticated)/teacher/profile/page.tsx:11-17`, `src/app/(authenticated)/teacher/profile/page.tsx:32-43`)
- Fix: Restore name fallback, DOB/department line, description and null-handling

## G2-20-030-023  [P2] MISSING  facet F03  effort M
- Legacy: ProfileCompleteness progress component visible directly after UserInfo (`docs/legacy-source/frontend/src/components/profile/about.js:928-934`)
- vNext now: No completeness score or bar on summary or details (`src/app/(authenticated)/teacher/profile/page.tsx:19-49`, `src/components/people/faculty-profile-editor.tsx:73-135`)
- Fix: Port completion score and CTA consistent with legacy

## G2-20-030-026  [P2] GAP  facet F04  effort M
- Legacy: Legacy header uses firstName,lastName,website,description,dob,department (`docs/legacy-source/frontend/src/components/profile/userInfo.js:105-145`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:35-85`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:137-139`)
- vNext now: Summary reads person.displayName,email,phoneE164 + academicTitle/employmentType (`src/app/(authenticated)/teacher/profile/page.tsx:11-17`)
- Fix: Map full legacy profile fields and date/name format with protected accessor

## G2-20-030-027  [P2] GAP  facet F04  effort S
- Legacy: Legacy empty profile fields show 'Not specified' and DOB DD-MM-YYYY (`docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:73-110`, `docs/legacy-source/frontend/src/components/profile/userInfo.js:17-26`)
- vNext now: New summary empty shows 'Not provided'; editor date ISO YYYY-MM-DD (`src/app/(authenticated)/teacher/profile/page.tsx:35-42`, `src/components/people/faculty-profile-editor.tsx:25-26`)
- Fix: Restore field-level legacy placeholders and formatted DOB display

## G2-20-030-030  [P2] GAP  facet F05  effort M
- Legacy: Legacy view uses card grid not a table; section repeatables have list-specific Add/Edit/Delete actions (`docs/legacy-source/frontend/src/components/profile/about.js:938-1086`, `docs/legacy-source/frontend/src/components/profile/about.js:1119-1292`)
- vNext now: New repeatables are editor sections with individual maxItems controls; no table in overview (`src/components/people/faculty-profile-editor.tsx:109-134`, `src/app/(authenticated)/teacher/profile/page.tsx:19-50`)
- Fix: Match list item order, item display and action modes in legacy repeatables

## G2-20-030-051  [P2] GAP  facet F10  effort M
- Legacy: Legacy initial GET /api/v1/faculty/getInstructorDetails?facultyId, section GETs afterward (`docs/legacy-source/frontend/src/api/Services/UserServices.js:12-20`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:246-282`, `docs/legacy-source/frontend/src/components/profile/about.js:196-261`)
- vNext now: New server getOwnFacultyProfile then staged self JSONB load on details (`src/app/(authenticated)/teacher/profile/page.tsx:8-17`, `src/modules/people/faculty-profile-self.staged.ts:69-96`)
- Fix: Crosswalk endpoint payloads and avoid losing legacy section fields

## G2-20-030-061  [P2] GAP  facet F13  effort M
- Legacy: Initial ProfileSkeleton within page canvas and aria-label Profile overview (`docs/legacy-source/frontend/src/pages/teacher/profile.js:117-128`)
- vNext now: vNext SSR server component with no local skeleton shown in overview (`src/app/(authenticated)/teacher/profile/page.tsx:8-20`)
- Fix: Reproduce legacy skeleton and loading boundary shape

## G2-20-030-064  [P2] GAP  facet F13  effort M
- Legacy: Legacy refreshes on document visibilitychange to avoid stale profile (`docs/legacy-source/frontend/src/pages/teacher/profile.js:86-94`)
- vNext now: New server rendered overview lacks focus/visibility re-fetch hook (`src/app/(authenticated)/teacher/profile/page.tsx:8-50`)
- Fix: Revalidate on visibility return with stale data warning

## G2-20-030-069  [P2] GAP  facet F16  effort M
- Legacy: Legacy AntD profile cards xs24, xl12 with 20px gutters; top info full width (`docs/legacy-source/frontend/src/components/profile/about.js:915-940`, `docs/legacy-source/frontend/src/components/profile/about.js:959-962`)
- vNext now: vNext stacked editor sections with sm2 field grid and slim overview definition list (`src/components/people/faculty-profile-editor.tsx:92-135`, `src/app/(authenticated)/teacher/profile/page.tsx:32-45`)
- Fix: Match old two-column cards at xl, phone stacking and spacings

## G2-20-030-070  [P2] GAP  facet F16  effort S
- Legacy: Legacy user avatar 120px square with pencil overlay (`docs/legacy-source/frontend/src/components/profile/userInfo.js:105-117`)
- vNext now: vNext profile text list uses responsive sm/lg columns but no avatar (`src/app/(authenticated)/teacher/profile/page.tsx:32-45`)
- Fix: Restore avatar dimensions, mobile safe editing hit target

## G2-20-030-071  [P2] GAP  facet F17  effort S
- Legacy: Legacy retry has test ID teacher.profile.retry, Profile heading aria label and loading aria-busy (`docs/legacy-source/frontend/src/pages/teacher/profile.js:117-161`)
- vNext now: vNext overview PageHeader and semantic section/dl; no retry button/test ID (`src/app/(authenticated)/teacher/profile/page.tsx:19-49`)
- Fix: Retain accessible retry/aria-busy and stable role-specific control naming

## G2-20-030-075  [P2] GAP  facet F18  effort S
- Legacy: Legacy errors 'Couldn't refresh profile' and 'Showing the last profile we loaded.' (`docs/legacy-source/frontend/src/pages/teacher/profile.js:150-156`)
- vNext now: vNext has no matching last-good banner in overview (`src/app/(authenticated)/teacher/profile/page.tsx:8-50`)
- Fix: Use exact stale-data banner copy and Retry button

## G2-20-030-077  [P2] GAP  facet F19  effort M
- Legacy: Legacy fans out 11 base + faculty-specific GET endpoints on mount, Promise.allSettled and visible stale profile (`docs/legacy-source/frontend/src/components/profile/about.js:196-261`)
- vNext now: vNext performs single document JSONB read and self summary read (`src/modules/people/faculty-profile-self.staged.ts:69-96`, `src/app/(authenticated)/teacher/profile/page.tsx:8-17`)
- Fix: Retain partial-outage behavior; keep efficient single read with item-level error model

## G2-20-030-078  [P2] GAP  facet F19  effort S
- Legacy: Legacy re-fetches complete profile when returning browser tab (`docs/legacy-source/frontend/src/pages/teacher/profile.js:86-94`)
- vNext now: vNext force-dynamic on full server navigation, no tab visibility listener (`src/app/(authenticated)/teacher/profile/page.tsx:6-10`)
- Fix: Implement visibility revalidation with request coalescing

## G2-4-020-001  [P2] GAP  facet F01  effort L
- Legacy: Legacy Faculty JPA entity serves the teacher profile and college/super-admin faculty screens. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-24`; `docs/legacy-source/frontend/src/pages/teacher/profile.js:15-25`)
- vNext now: New faculty account decomposed into users, collegeMemberships and facultyProfiles with profile route. (`src/db/schema/users.ts:12-24`; `src/db/schema/memberships.ts:17-31`; `src/db/schema/profiles.ts:33-58`; `src/app/(authenticated)/teacher/profile/page.tsx:8-21`)
- Fix: Map all legacy faculty account lookup routes and authority boundaries to membership-scoped data.

## G2-4-020-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy Faculty model stores profile sections in a single row and JSON columns. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:74-198`)
- vNext now: New normalized identity plus faculty profile JSON document and separate teaching assignments pages. (`src/db/schema/profiles.ts:33-58`; `src/app/(authenticated)/teacher/profile/page.tsx:22-31`)
- Fix: Reproduce original About/card ordering, and profile section navigation.

## G2-4-020-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy teacher profile loads full details on one page via About component. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:1-12`; `docs/legacy-source/frontend/src/pages/teacher/profile.js:65-84`)
- vNext now: New summary Profile page links to About & details editor on second route. (`src/app/(authenticated)/teacher/profile/page.tsx:19-35`; `src/app/(authenticated)/teacher/profile/details/page.tsx:16-24`)
- Fix: Review one-page About layout against new split route and exact hero/sections.

## G2-4-020-032  [P2] GAP  facet F09  effort M
- Legacy: Legacy teacher page embeds About editor under PageShell. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:4-13`)
- vNext now: New PageHeader Profile with Edit About & profile sections destination. (`src/app/(authenticated)/teacher/profile/page.tsx:19-35`)
- Fix: Match About section hierarchy and original action placement.

## G2-4-020-034  [P2] GAP  facet F10  effort M
- Legacy: Legacy profile load via getFacultyDetails by facultyId. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:56-84`)
- vNext now: New teacher profile calls getOwnFacultyProfileWithRuntime and typed profile storage. (`src/app/(authenticated)/teacher/profile/page.tsx:8-17`)
- Fix: Map old detailed read response to new source-of-truth projections.

## G2-4-020-036  [P2] GAP  facet F10  effort M
- Legacy: Legacy teacher profile fetch automatically refreshed when browser tab visible. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:86-94`)
- vNext now: New server route is dynamic but no visibilitychange refetch in profile summary. (`src/app/(authenticated)/teacher/profile/page.tsx:6-10`)
- Fix: Recheck stale profile on visibility or provide explicit refresh action.

## G2-4-020-051  [P2] GAP  facet F16  effort M
- Legacy: Legacy Profile page lazy-fetches About on client and shows responsive legacy shell. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:1-13`)
- vNext now: New PageHeader and dl responsive columns sm2/l3. (`src/app/(authenticated)/teacher/profile/page.tsx:19-35`)
- Fix: Pixel-compare legacy PageShell/profile hero and new summary grid at 375,768,1280.

## G2-4-020-055  [P2] GAP  facet F18  effort M
- Legacy: Legacy role labels Guest, Clerk, Mentor, TPO, Professor etc via FacultyType.getFacultyType. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/FacultyType.java:11-44`)
- vNext now: New profile summary labels Academic title and Employment type, not facultyType role. (`src/app/(authenticated)/teacher/profile/page.tsx:11-17`)
- Fix: Map historic faculty labels to exact rendered titles and role semantics.

## G2-4-020-056  [P2] GAP  facet F18  effort S
- Legacy: Legacy page title and sidebar profile navigation based on role. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:35-54`)
- vNext now: New page Profile, About, Current teaching assignments, Contact details links. (`src/app/(authenticated)/teacher/profile/page.tsx:19-35`)
- Fix: Compare old active sidebar, title wording and anchor fragments.

## G2-1-003-020  [P3] GAP  facet F04  effort S
- Legacy: `ProfileSectionsPanel.js:148-160` displays empty field fallback em dash and no data 'Nothing on file yet.'
- vNext now: `teacher/profile/page.tsx:41` overview empty fallback 'Not provided'; `faculty-profile-repeatable.tsx:63-157` no legacy summary fallback in list.
- Fix: Align empty-value copy ('—' and 'Nothing on file yet.') by section while preserving accessible state.

## G2-20-030-073  [P3] GAP  facet F18  effort S
- Legacy: Legacy title 'Profile', section heading 'Education/Qualification' (`docs/legacy-source/frontend/src/pages/teacher/profile.js:121-125`, `docs/legacy-source/frontend/src/components/profile/about.js:994-997`)
- vNext now: vNext title 'Profile', editor section label 'Education' (`src/app/(authenticated)/teacher/profile/page.tsx:20-22`, `src/components/people/faculty-profile-editor.tsx:125-129`)
- Fix: Restore exact section heading and labels for cloned interface

## G2-20-030-076  [P3] GAP  facet F18  effort S
- Legacy: Legacy profile form placeholders 'Select Gender', 'Select date of birth', 'Not specified' (`docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:73-120`)
- vNext now: vNext personal fields use labeled generic inputs, fallback 'Not provided' (`src/components/people/faculty-profile-editor.tsx:24-25`, `src/app/(authenticated)/teacher/profile/page.tsx:35-42`)
- Fix: Restore placeholders and empty-value copy

## G2-4-020-045  [P3] GAP  facet F13  effort S
- Legacy: Legacy API reloads when tab visibility returns. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:86-94`)
- vNext now: New profile page has no visibility handler. (`src/app/(authenticated)/teacher/profile/page.tsx:8-17`)
- Fix: Add refresh affordance or verify Next revalidation behavior after tab switch.
