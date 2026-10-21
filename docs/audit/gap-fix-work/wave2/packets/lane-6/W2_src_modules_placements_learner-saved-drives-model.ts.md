# Work packet (wave 2): edit src/modules/placements/learner-saved-drives-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/learner-saved-job.md, docs/audit/gap2/lane-17/learner-saved-jobs-service.md

## G2-3-019-036  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:403-425`
- vNext now: `src/modules/placements/learner-saved-drives-model.ts:13-16`, `src/components/placements/learner-save-drive-button.tsx:24-36`
- Fix: Legacy list uses no success toast; detail uses exact `Saved for later`/`Removed from saved jobs`. VNext model supplies these texts but renders inline in all contexts. Restore context-dependent feedback.

## G2-17-011-042  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:1119-1128 — Tooltip `Saved` for active bookmark.
- vNext now: src/modules/placements/learner-saved-drives-model.ts:13-16 — Active button says `Remove from saved jobs`.
- Fix: Show exact active tooltip Saved.

## G2-3-019-007  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:403-426`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:20-36`, `src/modules/placements/learner-saved-drives-model.ts:13-16`
- Fix: Legacy job detail gives Ant success toast `Saved for later`/`Removed from saved jobs`, vNext status text appears inline next to chip. Match detail-specific feedback form.
