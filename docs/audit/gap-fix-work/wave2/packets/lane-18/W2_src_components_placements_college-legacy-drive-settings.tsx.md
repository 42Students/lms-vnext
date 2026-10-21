# Work packet (wave 2): edit src/components/placements/college-legacy-drive-settings.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-9-013-007  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:116-119` — Drive status uses small Card with heading, under edit form only for non-draft.
- vNext now: `src/components/placements/college-legacy-drive-settings.tsx:52-55` — Drive status section always exists (including DRAFT) with top border and status badge.
- Fix: Hide/adjust draft status block and legacy section treatment.

## G2-9-013-013  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:116-124` — Open drive / Close drive button text changes with isActive.
- vNext now: `src/components/placements/college-legacy-drive-settings.tsx:55-79` — Close drive or Reopen drive state-specific controls and explicit status badge.
- Fix: Align verb wording and button state after comparing state mapping.

## G2-9-013-050  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:121-126` — Open/Close Popconfirm title Are you sure you want to ... this drive? Yes/No.
- vNext now: `src/components/placements/college-legacy-drive-settings.tsx:55-79` — Inline role=group Yes/No; reopening Cancel and Yes, reopen.
- Fix: Use anchored confirmation/popover and exact labels where appropriate.
