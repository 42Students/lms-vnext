# Work packet: edit src/app/(authenticated)/teacher/profile/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md, docs/audit/gap2/lane-4/faculty-model.md

## G2-1-003-005  [P1] GAP  facet F02  effort L
- Legacy: `ProfileSectionsPanel.js:54-69` includes Header, Identity Documents and Contact sections.
- vNext now: `faculty-profile-editor.tsx:92-135` excludes all 3; self profile overview shows identity fields read-only (`teacher/profile/page.tsx:11-47`).
- Fix: Provide secure read and managed-admin update for those sections with privacy controls and explicit edit restrictions.

## G2-20-030-001  [P1] GAP  facet F01  effort L
- Legacy: Teacher /teacher/profile renders full profile in place and selects profile nav item (`docs/legacy-source/frontend/src/pages/teacher/profile.js:14-37`, `docs/legacy-source/frontend/src/pages/teacher/profile.js:145-162`)
- vNext now: Teacher /teacher/profile only basic summary; full edits under /teacher/profile/details (`src/app/(authenticated)/teacher/profile/page.tsx:8-50`, `src/app/(authenticated)/teacher/profile/details/page.tsx:11-25`)
- Fix: Restore complete on-page profile or render full edit/details content in canonical profile route

## G2-20-030-004  [P1] GAP  facet F01  effort M
- Legacy: Mentor visiting teacher profile redirects via getProfilePath; mentor cannot see profile here (`docs/legacy-source/frontend/src/pages/teacher/profile.js:46-52`, `docs/legacy-source/frontend/src/pages/teacher/profile.js:113-115`)
- vNext now: Teacher route does not check mentor role explicitly before getOwnFacultyProfile (`src/app/(authenticated)/teacher/profile/page.tsx:8-10`)
- Fix: Deny or redirect MENTOR before loading self faculty data, matching legacy intentional exclusion

## G2-20-030-006  [P1] GAP  facet F02  effort L
- Legacy: Single PageShell with header Profile, avatar and completeness, then two-column 13-section card grid (`docs/legacy-source/frontend/src/pages/teacher/profile.js:117-164`, `docs/legacy-source/frontend/src/components/profile/about.js:905-940`)
- vNext now: Overview 5-field description list and shortcuts; editor is separate flat vertical section stack (`src/app/(authenticated)/teacher/profile/page.tsx:19-49`, `src/components/people/faculty-profile-editor.tsx:86-135`)
- Fix: Match legacy section layout, sequence, card hierarchy and same-route affordances

## G2-20-030-007  [P1] MISSING  facet F02  effort M
- Legacy: Top user info card precedes completeness and fields (`docs/legacy-source/frontend/src/components/profile/about.js:915-935`)
- vNext now: Top overview starts with action shortcuts and About; no UserInfo card/completeness (`src/app/(authenticated)/teacher/profile/page.tsx:19-49`)
- Fix: Add identity/avatar card and completeness indicator before sections

## G2-20-030-021  [P1] MISSING  facet F03  effort M
- Legacy: Profile UserInfo includes 120px square avatar with upload pencil (`docs/legacy-source/frontend/src/components/profile/userInfo.js:105-117`)
- vNext now: Summary text only; no avatar, no upload button (`src/app/(authenticated)/teacher/profile/page.tsx:11-17`, `src/app/(authenticated)/teacher/profile/page.tsx:32-43`)
- Fix: Add protected profile-image view and upload/edit control

## G2-20-030-055  [P1] GAP  facet F11  effort M
- Legacy: Legacy teacher-only role excludes mentor; wrong roles redirect without rendering profile (`docs/legacy-source/frontend/src/pages/teacher/profile.js:20-25`, `docs/legacy-source/frontend/src/pages/teacher/profile.js:39-55`, `docs/legacy-source/frontend/src/pages/teacher/profile.js:113-115`)
- vNext now: vNext page relies on getOwnFacultyProfile and details membership roles includes FACULTY (`src/app/(authenticated)/teacher/profile/page.tsx:8-10`, `src/app/(authenticated)/teacher/profile/details/page.tsx:11-15`)
- Fix: Explicitly ensure role eligibility and redirect parity for ADMIN/MENTOR/LEARNER

## G2-20-030-062  [P1] GAP  facet F13  effort M
- Legacy: Refresh preserves last profile + RefreshStatus and warning on failure (`docs/legacy-source/frontend/src/pages/teacher/profile.js:145-161`)
- vNext now: New server load has no cached same-owner last-good fallback (`src/app/(authenticated)/teacher/profile/page.tsx:8-50`)
- Fix: Preserve previous verified profile on refresh errors where safe

## G2-4-020-003  [P1] GAP  facet F01  effort M
- Legacy: Legacy facultyId integer lookups target profile owner in GET. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:56-74`)
- vNext now: New self profile derives principal identity, college faculty detail uses membershipId UUID. (`src/app/(authenticated)/teacher/profile/page.tsx:8-17`; `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx:15-24`)
- Fix: Map legacy faculty numeric IDs to per-college membership and self-only read.

## G2-20-030-043  [P2] GAP  facet F07  effort S
- Legacy: Legacy data load failure initial message 'We couldn't load your profile. Please try again.' (`docs/legacy-source/frontend/src/pages/teacher/profile.js:130-141`)
- vNext now: No matching text in server profile page; exceptions use route error boundary (`src/app/(authenticated)/teacher/profile/page.tsx:8-10`, `src/app/(authenticated)/teacher/profile/page.tsx:19-50`)
- Fix: Restore exact initial fetch error and Retry UI in profile boundary

## G2-20-030-045  [P2] MISSING  facet F08  effort S
- Legacy: Legacy upload success 'Profile image updated!' (`docs/legacy-source/frontend/src/components/profile/about.js:841-842`, `docs/legacy-source/frontend/src/components/profile/about.js:870-871`)
- vNext now: No upload control or corresponding toast (`src/app/(authenticated)/teacher/profile/page.tsx:19-50`)
- Fix: Restore exact success feedback with profile image upload

## G2-4-020-030  [P2] GAP  facet F08  effort M
- Legacy: Legacy teacher profile fetch keeps latest owner and refresh state. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:56-94`)
- vNext now: New server-rendered profile and separate editor route, reload behavior differs. (`src/app/(authenticated)/teacher/profile/page.tsx:8-21`; `src/app/(authenticated)/teacher/profile/details/page.tsx:11-24`)
- Fix: Preserve refresh success and stale-data recovery UX.
