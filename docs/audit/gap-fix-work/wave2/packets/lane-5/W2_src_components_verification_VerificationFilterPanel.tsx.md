# Work packet (wave 2): edit src/components/verification/VerificationFilterPanel.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-010  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:289-297 — Attention chips 'A marksheet missing', 'Updates to verified details', 'Waiting over a week' with count.
- vNext now: src/components/verification/VerificationFilterPanel.tsx:70-83 — Filter dropdown/presets, no prominent count chips.
- Fix: Show count-bearing work chips above table

## G2-10-024-022  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:114-130 — Sidebar filter groups What to check and Whose, checklist facets.
- vNext now: src/components/verification/VerificationFilterPanel.tsx:42-132 — One collapsed disclosure of many fields/selects.
- Fix: Restore filter side drawer grouped checklists

## G2-10-024-027  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:123-131 — Section checklist Education/Identity; kind FIRST/UPDATE; marksheets completeness.
- vNext now: src/modules/verification/queue-filters.ts:3-20; src/components/verification/VerificationFilterPanel.tsx:50-73 — New kind/attention filters use select values and URL query.
- Fix: Recreate sidebar checkboxes and original kind language

## G2-10-024-081  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:289-297,410-413 — Work chips buttons have aria-pressed selected state.
- vNext now: src/components/verification/VerificationFilterPanel.tsx:70-83 — Dropdown with shortcut chips lacking selected count/pressed state.
- Fix: Expose aria-pressed and count badge

## G2-10-024-020  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:120-130 — Marksheets All uploaded/Some missing/Not an Education check.
- vNext now: src/components/verification/VerificationFilterPanel.tsx:65-69; src/components/verification/VerificationWorkspace.tsx:98-102 — Any/Missing/Present filter and rows label counts.
- Fix: Restore labels and NA state
