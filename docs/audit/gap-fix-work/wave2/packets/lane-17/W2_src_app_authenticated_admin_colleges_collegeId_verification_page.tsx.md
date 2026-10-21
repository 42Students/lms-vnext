# Work packet (wave 2): edit src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-003  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/verification.js:12-14 — Subtitle Students' education and identity, checked against their documents.
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:43-45 — Scoped page title is college name; description changed.
- Fix: Restore heading and subtitle above scoped panel

## G2-10-024-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:385-399 — Placement cell verifier setting Card above queue, always shown when allowed.
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:71-73 — Setting hidden inside bottom Disclosure after queue.
- Fix: Move setting Card above queue and make visible

## G2-10-024-047  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/VerificationService.js:13-15 — GET /api/v1/profile-verification/access and /queue status/section.
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:50-51; src/modules/verification/staff-queue-service.ts:28-65 — Server DB queue and permission direct, no separate access fetch.
- Fix: Keep access reason surface even if data read server-side

## G2-10-024-054  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:379-381 — Access denied shows 'You cannot verify profiles here' with backend reason.
- vNext now: src/modules/verification/super-admin-scope.ts:6-14; src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:27-33 — Throws permission denial; local denial panel absent.
- Fix: Render explicit information permission state

## G2-10-024-064  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:379-381 — Access loading shows Card Skeleton 4 rows.
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:21-76 — Async route no equivalent in panel markup.
- Fix: Add scoped access skeleton

## G2-10-024-065  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-429 — Queue loading uses TpoDataTable skeleton, error inline with Retry.
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:50-60; src/components/verification/VerificationWorkspace.tsx:73-83 — Server ErrorState on failure, simple textual pending.
- Fix: Render legacy table skeleton

## G2-10-024-067  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:417-422 — At limit warning instead of blanking.
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:52-60; src/modules/verification/staff-queue-service.ts:65-67 — Exceed safe cap triggers exception, page error.
- Fix: Explain cap and offer safe filter constraints

## G2-10-024-068  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:385-387 — Setting load error independent warning with Retry setting.
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:62-73 — Policy query failure not separately caught; setting below hidden disclosure.
- Fix: Isolate settings read failure and retry

## G2-10-024-083  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/verification.js:12-12 — 'Profile verification' title exactly.
- vNext now: src/app/(authenticated)/admin/verification/page.tsx:32-34 — Exact title when unselected; scoped src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:43-45 uses college name.
- Fix: Restore title at scoped route

## G2-10-024-090  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:155-166 — Access and setting fetched independently.
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:50-63 — Server queue and policy sequential without separate access.
- Fix: Isolate policy outage from queue
