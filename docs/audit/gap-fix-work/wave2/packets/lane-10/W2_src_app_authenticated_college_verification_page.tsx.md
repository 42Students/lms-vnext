# Work packet (wave 2): edit src/app/(authenticated)/college/verification/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-verification.md

## G2-9-020-042  [P2] GAP  facet F11  effort M
- Legacy: Access info message You cannot verify profiles here with reason `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:379-382`
- vNext now: College-admin role required; no membership error and redirect others `src/app/(authenticated)/college/verification/page.tsx:18-23`
- Fix: Expose role reason rather than generic redirect where possible.

## G2-9-020-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy queue errors inline Ant Alert with Retry `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:417-431`
- vNext now: Unavailable/limit ErrorState with Retry `src/app/(authenticated)/college/verification/page.tsx:31-48`
- Fix: Keep inline retry and last loaded queue when safely same scope.

## G2-9-020-038  [P3] GAP  facet F10  effort M
- Legacy: GET access/queue/settings/student via /api/v1/profile-verification `docs/legacy-source/frontend/src/api/Services/VerificationService.js:12-23`
- vNext now: Server listCollegeVerificationQueue and options invoked by page `src/app/(authenticated)/college/verification/page.tsx:31-64`
- Fix: Document API route/shape changes.
