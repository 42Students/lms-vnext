# Work packet (wave 2): edit src/modules/verification/staff-queue-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md, docs/audit/gap2/lane-9/college-admin-verification.md

## G2-10-024-016  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:357-375 — Roll Number and decidedByName displayed table; relative dates with full tooltip.
- vNext now: src/modules/verification/staff-queue-service.ts:46-50,101-106; src/components/verification/VerificationWorkspace.tsx:103-105 — Queue cards may lack roll/decider, display absolute IST submission.
- Fix: Expose roll, decidedBy and localized relative timestamps

## G2-10-024-023  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:367-373 — Sent/Verified date sortable column with dayjs fromNow label.
- vNext now: src/modules/verification/queue-filters.ts:18-20; src/modules/verification/staff-queue-service.ts:65-65 — Server sorts OLDEST/NEWEST/NAME.
- Fix: Default sort and date control should match source view

## G2-10-024-047  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/VerificationService.js:13-15 — GET /api/v1/profile-verification/access and /queue status/section.
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:50-51; src/modules/verification/staff-queue-service.ts:28-65 — Server DB queue and permission direct, no separate access fetch.
- Fix: Keep access reason surface even if data read server-side

## G2-10-024-067  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:417-422 — At limit warning instead of blanking.
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:52-60; src/modules/verification/staff-queue-service.ts:65-67 — Exceed safe cap triggers exception, page error.
- Fix: Explain cap and offer safe filter constraints

## G2-9-020-017  [P2] GAP  facet F05  effort M
- Legacy: Search includes student, roll, branch `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-429`
- vNext now: New list search disabled locally; server filter by users.displayName `src/components/verification/VerificationWorkspace.tsx:61-65` `src/modules/verification/staff-queue-service.ts:55-59`
- Fix: Restore roll/branch search and preserve cross-page filtering.

## G2-10-024-015  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:34-36 — Student name firstName+lastName fallback Student.
- vNext now: src/components/verification/VerificationWorkspace.tsx:85-86; src/modules/verification/staff-queue-service.ts:101-102 — New displayName fallback Learner.
- Fix: Preserve fallback and full-name formatting
