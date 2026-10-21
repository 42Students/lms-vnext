# Work packet: edit src/modules/verification/staff-queue-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md, docs/audit/gap2/lane-9/college-admin-verification.md

## G2-10-024-024  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:35-36,417-422 — Legacy queue max1000 per view with warning 'Showing first 1,000'.
- vNext now: src/modules/verification/staff-queue-service.ts:43-68 — 1001 candidate scan cap, throws if truncated.
- Fix: Fail loudly with capacity warning; don't silently alter visible result contract

## G2-10-024-088  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:35-36,417-421 — Legacy queue result bounded 1000 per active view.
- vNext now: src/modules/verification/staff-queue-service.ts:43-67 — New candidate cap 1000 across statuses and filters before tab selection.
- Fix: Ensure tab counts/coverage unaffected by other statuses

## G2-9-020-019  [P1] GAP  facet F05  effort L
- Legacy: Legacy UI local queue first 1000, all-row search/filter `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:35-36,417-431`
- vNext now: Server filters and slices pages after up to 1000 source records `src/modules/verification/staff-queue-service.ts:44-83`
- Fix: Enforce count/filter semantics over entire matching college dataset and transparent cap.

## G2-9-020-060  [P1] GAP  facet F19  effort L
- Legacy: Legacy frontend loads all queue up to1000 and local sorting/filtering `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:35-36,169-181,423-431`
- vNext now: Server indexed/filter query and page slice after candidate cap `src/modules/verification/staff-queue-service.ts:44-108`
- Fix: Avoid misleading counts/hidden rows when 1000 candidate cap reached.
