# Work packet (wave 2): edit src/components/placements/tpo-calendar-followup-actions.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-050  [P2] GAP  facet F09  effort M
- Legacy: Legacy moving follow-up opens AsyncModal named Move this follow-up (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:372-389`)
- vNext now: vNext embeds inline move form and separate week editor (`src/components/placements/tpo-calendar-followup-actions.tsx:146-230`)
- Fix: Reuse shared dialog with equivalent prefill, confirm and cancel
