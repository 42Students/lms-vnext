# Work packet (wave 2): edit src/app/(authenticated)/learn/profile/page.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-placement-profile-controller.md, docs/audit/gap2/lane-1/learner-profile-controller.md, docs/audit/gap2/lane-1/learner-profile.md

## G2-1-009-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerPlacementProfileController.java:20-40`: learner self GET /api/v1/learner/profile/academic-record and /data-access.
- vNext now: `src/app/(authenticated)/learn/profile/page.tsx:114-123`,`src/app/(authenticated)/learn/profile/academic-record/page.tsx:8-13`,`src/app/(authenticated)/learn/profile/data-access/page.tsx:8-16`: two linked server-rendered pages under /learn/profile.
- Fix: Map both legacy REST callers to self-only pages/services with migration guidance.

## G2-1-004-001  [P2] GAP  facet F01  effort M
- Legacy: `LearnerProfileController.java:27-31,328-1237` exposes `/api/v1/profile/learner/{learnerId}/{section}` for authorized actors.
- vNext now: `src/app/api/profile/me/route.ts:13-49` uses `/api/profile/me` own profile; `learn/profile/page.tsx:20-56` presents `/learn/profile`.
- Fix: Map section deep links and old clients to self vs admin routes, with role-aware redirects.

## G2-1-004-004  [P2] GAP  facet F02  effort M
- Legacy: `ProfileSectionsPanel.js:31-51` includes 20 learner sections with header, identity, contact, education, career, video and metadata.
- vNext now: `src/modules/people/learner-profile-checklist.ts:6-11` has 16 completion sections and `learn/profile/page.tsx:56-165` adds verification and coding links.
- Fix: Create a one-to-one section anatomy and order map, distinguishing intentional new verification blocks.

## G2-1-004-006  [P2] GAP  facet F02  effort M
- Legacy: `LearnerProfileController.java:328-600,668-1107` section API groups profile in Header→About→Personal→Identity→Languages→Contact→Address→Social→Education→career lists.
- vNext now: `learn/profile/page.tsx:56-165` opens with verification and academic identity ahead of editable workspace.
- Fix: Align section sequencing and selected-anchor routing with legacy.

## G2-1-004-010  [P2] GAP  facet F04  effort M
- Legacy: `ProfileHeaderDTO.java:10-19` firstName, lastName, rollNumber, programId, collegeId, profileImage.
- vNext now: `learn/profile/page.tsx:43-54,83-113` shows canonical name, roll/reg and academic summary; `profiles.ts:15-30` membership document.
- Fix: Map legacy IDs, program/college names and profile image to visible header.

## G2-1-004-025  [P2] GAP  facet F06  effort M
- Legacy: `SocialProfileDTO.java:14-45` links permit HTTP/HTTPS, coding profiles map/list.
- vNext now: `learn/profile/page.tsx:146-165` finds coding links from GitHub and metadata entries.
- Fix: Map coding-profile names and legacy link values losslessly.

## G2-1-004-045  [P2] GAP  facet F13  effort M
- Legacy: `LearnerProfileController.java:295-324` 400/404/409 with wrapped error; `ProfileSectionsPanel.js:205-230` loading and retry.
- vNext now: `learner-profile-workspace.tsx:299-301` toast + local draft, academic fallback `learn/profile/page.tsx:87`.
- Fix: Add distinct 404,401,409,503 and offline state with actionable retry.

## G2-1-031-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:44-52: nonlearner faculty goes college-admin or teacher profile.
- vNext now: src/app/(authenticated)/learn/profile/page.tsx:28-30: requireOwnLearnerProfileAccess, auth failure handled upstream, no role-specific redirect.
- Fix: Route stale profile URL to actor's appropriate role profile when safe.

## G2-1-031-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:147-170: scroll container > PageShell > ListingPageHeader > VerificationCard > About.
- vNext now: src/app/(authenticated)/learn/profile/page.tsx:40-166: PageHeader, Workspace, Verification summary, academic identity/resources, verification status, coding profiles.
- Fix: Match legacy section order, spacing and PageShell canvas.

## G2-1-031-007  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:163-165: ProfileVerificationCard before About.
- vNext now: src/app/(authenticated)/learn/profile/page.tsx:45-55: workspace first, verification summary after.
- Fix: Move verification card above editing area.

## G2-1-031-020  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:177-260: Promise.allSettled fetches sections independently.
- vNext now: src/app/(authenticated)/learn/profile/page.tsx:31-38: whole profile fetch, academic/verification settled separately.
- Fix: Keep subsection failures isolated rather than full-page failure.

## G2-1-031-042  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:120-130: skeleton for first load, page testId learner.profile.page.loading.
- vNext now: src/app/(authenticated)/learn/profile/page.tsx:20-40: server waits for profile, no same explicit skeleton in page.
- Fix: Add Suspense/loading.tsx profile skeleton.

## G2-1-031-052  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:150: 'Profile'; L:139 exact load-error and Retry.
- vNext now: src/app/(authenticated)/learn/profile/page.tsx:42-44: 'Profile' but no same load error UI.
- Fix: Match old copy in fatal branch.
