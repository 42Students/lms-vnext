# Work packet: NEW / MISSING items from docs/audit/gap2/lane-10/superadmin-verification.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-091  [P1] GAP  facet F19  effort M
- Legacy: src/components/verification/SuperAdminVerificationPanel.tsx:73-79 — Review one by one limited20 page requests.
- vNext now: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:303-305 — Uses entire filtered audience.
- Fix: Offer pagination-aware sequence or state visible 20 cap

## G2-10-024-096  [P1] GAP  facet F20  effort L
- Legacy: src/modules/verification/staff-queue-service.ts:65-68 — 1001 row scan cap then slice/filter before pagination can undercount.
- vNext now: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:35-36,417-422 — Legacy cap warns possible truncation.
- Fix: Use server-side filtered aggregate or mark unknown totals
