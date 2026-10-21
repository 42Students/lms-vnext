# Work packet (wave 2): edit src/modules/verification/queue-filters.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-023  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:367-373 — Sent/Verified date sortable column with dayjs fromNow label.
- vNext now: src/modules/verification/queue-filters.ts:18-20; src/modules/verification/staff-queue-service.ts:65-65 — Server sorts OLDEST/NEWEST/NAME.
- Fix: Default sort and date control should match source view

## G2-10-024-027  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:123-131 — Section checklist Education/Identity; kind FIRST/UPDATE; marksheets completeness.
- vNext now: src/modules/verification/queue-filters.ts:3-20; src/components/verification/VerificationFilterPanel.tsx:50-73 — New kind/attention filters use select values and URL query.
- Fix: Recreate sidebar checkboxes and original kind language
